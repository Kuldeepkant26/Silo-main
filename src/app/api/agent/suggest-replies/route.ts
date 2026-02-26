import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";

// Map locale codes to full language names for the AI prompt
const LOCALE_TO_LANGUAGE: Record<string, string> = {
  en: "English",
  es: "Spanish",
  ca: "Catalan",
};

// Request validation schema
const suggestRepliesSchema = z.object({
  messages: z.array(
    z.object({
      senderType: z.string(),
      senderEmail: z.string().nullable().optional(),
      message: z.string(),
    })
  ),
  context: z.object({
    ticketTitle: z.string().nullable().optional(),
    ticketEmail: z.string().nullable().optional(),
  }).optional(),
  language: z.string().optional(),
});

// System prompt builder for generating professional reply suggestions
function buildRepliesSystemPrompt(language: string): string {
  return `You are a professional assistant helping generate reply suggestions for a support/legal ticket conversation.
Based on the conversation history, generate exactly 3 brief, professional reply suggestions that the admin/support staff could send.

CRITICAL RULE: ALL 3 suggestions MUST be written in ${language}. Regardless of the language used in the conversation, you MUST ALWAYS respond in ${language}.

Other rules:
- Keep each suggestion concise (1-2 sentences max)
- Make them professional and helpful
- Vary the tone slightly: one more formal, one friendly, one direct
- Don't use placeholders like [name] - keep it generic
- Return ONLY a JSON array with 3 strings, nothing else`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = suggestRepliesSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { messages, context, language: localeCode } = validatedData.data;
    const language = LOCALE_TO_LANGUAGE[localeCode ?? "en"] ?? "English";

    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Build conversation context for Gemini
    const recentMessages = messages.slice(-6);
    const conversationText = recentMessages
      .map((msg) => `${msg.senderType === "ADMIN" ? "Admin" : "User"}: ${msg.message}`)
      .join("\n");

    const contextInfo = context?.ticketTitle 
      ? `\nTicket: ${context.ticketTitle}\nFrom: ${context.ticketEmail || "Unknown"}`
      : "";

    const userPrompt = `Here is the conversation:${contextInfo}\n\n${conversationText}\n\nGenerate 3 professional reply suggestions for the admin to send next. You MUST write ALL suggestions in ${language}.`;

    const systemPrompt = buildRepliesSystemPrompt(language);

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: `Understood. I will always generate replies in ${language}. Please provide the conversation.` }],
      },
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to generate suggestions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON array from response
    try {
      // Extract JSON array from response (handle potential markdown formatting)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
        }
      }
      
      // Fallback: return default suggestions
      return NextResponse.json({
        suggestions: [
          "Thank you for your message. I'll review this and get back to you shortly.",
          "I've received your request and will look into it right away.",
          "Thanks for reaching out. Let me assist you with this matter.",
        ],
      });
    } catch {
      return NextResponse.json({
        suggestions: [
          "Thank you for your message. I'll review this and get back to you shortly.",
          "I've received your request and will look into it right away.",
          "Thanks for reaching out. Let me assist you with this matter.",
        ],
      });
    }
  } catch (error) {
    console.error("Error in suggest-replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
