import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";

// Request validation schema
const enhanceRequestSchema = z.object({
  text: z.string().min(1).max(2000),
});

// System prompt for generating professional rephrased versions
const SYSTEM_PROMPT = `You are a professional writing assistant. Rephrase the given text into exactly 3 different professional versions.

Rules:
- Keep each version concise and similar in length to the original
- Make them professional, clear, and polished
- Vary the tone slightly: one more formal, one friendly professional, one direct
- Maintain the original meaning and intent
- IMPORTANT: Detect the language of the input text. Your rephrased versions MUST be in the SAME language as the original text. For example, if the text is in Spanish, rephrase in Spanish. If in German, rephrase in German. If in English, rephrase in English. Always match the language of the input.
- Return ONLY a JSON array with 3 strings, nothing else

Example output format:
["Professional version 1", "Professional version 2", "Professional version 3"]`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = enhanceRequestSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { text } = validatedData.data;

    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: "model",
        parts: [{ text: '["Version 1", "Version 2", "Version 3"]' }],
      },
      {
        role: "user",
        parts: [{ text: `Rephrase this text professionally:\n\n${text}` }],
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
            temperature: 0.7,
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
      return NextResponse.json(
        { error: "Failed to enhance text" },
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
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const enhancedVersions = JSON.parse(jsonMatch[0]);
        if (Array.isArray(enhancedVersions) && enhancedVersions.length > 0) {
          return NextResponse.json({ enhancedVersions: enhancedVersions.slice(0, 3) });
        }
      }
      
      // Fallback: return the response as a single enhanced version
      return NextResponse.json({
        enhancedVersions: [responseText.trim()],
      });
    } catch {
      return NextResponse.json({
        enhancedVersions: [responseText.trim()],
      });
    }
  } catch (error) {
    console.error("Enhance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
