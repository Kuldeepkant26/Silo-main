import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";

const summaryRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  refinementRequest: z.string().optional(),
  currentSummary: z.string().optional(),
});

const SUMMARY_SYSTEM_PROMPT = `You are a professional document summarizer. Given a conversation between a user and an AI assistant, produce a well-structured, professional summary document.

Format the summary using clean markdown with:
- A clear title (# Summary)
- An "Overview" section with a brief 2-3 sentence synopsis
- "Key Discussion Points" as bullet points
- "Decisions & Outcomes" if any conclusions were reached
- "Action Items" if any tasks or follow-ups were identified
- "Additional Notes" for anything else relevant

Be concise, professional, and ensure the summary captures all important information. Use proper formatting with headers, bullet points, and bold text for emphasis.`;

const REFINEMENT_SYSTEM_PROMPT = `You are a professional document editor. The user has an existing summary document and wants changes made. Apply the requested changes while maintaining the professional formatting and structure. Return the complete updated document in markdown.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = summaryRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { messages, refinementRequest, currentSummary } = validated.data;

    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    let contents;

    if (refinementRequest && currentSummary) {
      // Refinement mode — user wants changes to existing summary
      contents = [
        {
          role: "user",
          parts: [{ text: REFINEMENT_SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Ready to refine the document." }],
        },
        {
          role: "user",
          parts: [
            {
              text: `Here is the current summary document:\n\n${currentSummary}\n\n---\n\nPlease make the following changes:\n${refinementRequest}`,
            },
          ],
        },
      ];
    } else {
      // Initial summary generation
      const conversationText = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      contents = [
        {
          role: "user",
          parts: [{ text: SUMMARY_SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Ready to create a professional summary." }],
        },
        {
          role: "user",
          parts: [
            {
              text: `Please create a professional summary of the following conversation:\n\n${conversationText}`,
            },
          ],
        },
      ];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini summary error:", errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summaryText) {
      return NextResponse.json(
        { error: "No summary generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: summaryText });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
