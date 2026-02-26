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
const ticketSuggestionsSchema = z.object({
  ticket: z.object({
    id: z.union([z.string(), z.number()]),
    title: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    workflowStatus: z.string().nullable().optional(),
    priority: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    reviewed: z.boolean().nullable().optional(),
  }),
  language: z.string().optional(),
});

// System prompt builder for generating professional message suggestions based on ticket details
function buildTicketSystemPrompt(language: string): string {
  return `You are a professional assistant helping a reviewer generate message suggestions to send to a requester based on a support/legal ticket's details.

You will be given ticket details (title, description, status, priority, category, etc.) and should generate exactly 4 short, professional messages the reviewer could send to the requester in the chat.

CRITICAL RULE: ALL 4 suggestions MUST be written in ${language}. Regardless of the language used in the ticket content, you MUST ALWAYS respond in ${language}.

Other rules:
- Keep each suggestion concise (1-3 sentences max)
- Make them contextually relevant to the ticket details
- Suggestions should cover different intents: acknowledging the request, asking for more details, providing a status update, and next steps
- Don't use placeholders like [name] - keep it generic but relevant to the ticket context
- Be professional and empathetic
- Return ONLY a JSON array with 4 strings, nothing else`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ticketSuggestionsSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { ticket, language: localeCode } = validatedData.data;
    const language = LOCALE_TO_LANGUAGE[localeCode ?? "en"] ?? "English";

    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Build ticket context for Gemini
    const ticketDetails = [
      `Ticket #${ticket.id}`,
      ticket.title ? `Title: ${ticket.title}` : null,
      ticket.type ? `Type: ${ticket.type}` : null,
      ticket.email ? `Requester Email: ${ticket.email}` : null,
      ticket.description ? `Description: ${ticket.description}` : null,
      ticket.workflowStatus ? `Status: ${ticket.workflowStatus.replace(/_/g, " ")}` : null,
      ticket.priority ? `Priority: ${ticket.priority}` : null,
      ticket.category ? `Category: ${ticket.category}` : null,
      ticket.reviewed !== null && ticket.reviewed !== undefined
        ? `Reviewed: ${ticket.reviewed ? "Yes" : "No"}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const userPrompt = `Here are the ticket details:\n\n${ticketDetails}\n\nGenerate 4 professional message suggestions. You MUST write ALL suggestions in ${language}.`;

    const systemPrompt = buildTicketSystemPrompt(language);

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [
          {
            text: `Understood. I will always generate suggestions in ${language}. Please provide the ticket details.`,
          },
        ],
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
            maxOutputTokens: 1024,
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
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON array from response
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return NextResponse.json({
            suggestions: suggestions.slice(0, 4),
          });
        }
      }

      // Fallback: return default suggestions
      return NextResponse.json({
        suggestions: [
          "Thank you for submitting your request. I'll review the details and get back to you shortly.",
          "Could you please provide any additional information or documents related to this request?",
          "I've reviewed your request and it's currently being processed by our team.",
          "We'll follow up with you soon regarding the next steps. Please don't hesitate to reach out if you have questions.",
        ],
      });
    } catch {
      return NextResponse.json({
        suggestions: [
          "Thank you for submitting your request. I'll review the details and get back to you shortly.",
          "Could you please provide any additional information or documents related to this request?",
          "I've reviewed your request and it's currently being processed by our team.",
          "We'll follow up with you soon regarding the next steps. Please don't hesitate to reach out if you have questions.",
        ],
      });
    }
  } catch (error) {
    console.error("Error in ticket-suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
