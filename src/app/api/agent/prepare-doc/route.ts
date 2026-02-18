import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "~/env";

// ─── Request Schema ───────────────────────────────────────────────────────────

const prepareDocRequestSchema = z.object({
  /** Conversation messages to draw context from */
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  /** The chosen document template ID */
  templateId: z.string(),
  /** Human-readable template name */
  templateName: z.string(),
  /** Optional custom prompt / description provided by the user */
  customPrompt: z.string().optional(),
  /** If set, we are in refinement mode — update the existing doc */
  currentDoc: z.string().optional(),
  /** The refinement instruction */
  refinementRequest: z.string().optional(),
});

// ─── Template-Specific System Prompts ───────────────────────────────────────

const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  nda: `
You are an expert legal document drafter specialising in Non-Disclosure Agreements (NDAs).
Produce a COMPLETE, professional NDA in markdown that includes:
- Title: "Non-Disclosure Agreement (NDA)"
- Parties section (with placeholders like [PARTY A NAME], [PARTY B NAME], [EFFECTIVE DATE])
- Recitals / Background
- 1. Definitions (Confidential Information, Disclosing Party, Receiving Party)
- 2. Obligations of Receiving Party
- 3. Exclusions from Confidential Information
- 4. Term & Termination
- 5. Return / Destruction of Information
- 6. Remedies
- 7. Governing Law & Jurisdiction
- 8. Miscellaneous (entire agreement, amendments, waiver, severability)
- Signature Block
Use formal legal language. Insert placeholders in square brackets where specific details are needed.`,

  contract: `
You are an expert contract drafter.
Produce a COMPLETE, professional Service Agreement / Contract in markdown that includes:
- Title: "Service Agreement"
- Parties (with placeholders)
- 1. Services & Deliverables
- 2. Payment Terms & Schedule
- 3. Term & Termination
- 4. Intellectual Property & Ownership
- 5. Confidentiality
- 6. Representations & Warranties
- 7. Limitation of Liability & Indemnification
- 8. Dispute Resolution
- 9. General Provisions
- Signature Block
Use professional and enforceable language.`,

  proposal: `
You are an expert business proposal writer.
Produce a COMPLETE, persuasive Business Proposal in markdown that includes:
- Executive Summary
- Problem Statement / Opportunity
- Proposed Solution
- Scope of Work / Deliverables
- Timeline & Milestones
- Pricing & Investment
- Why Us (value proposition & credentials)
- Next Steps
- Terms & Conditions
- Appendix (if relevant)
Use compelling, professional language that motivates action.`,

  report: `
You are a professional business report writer.
Produce a COMPLETE, well-structured Business / Research Report in markdown that includes:
- Title Page (Title, Author placeholder, Date)
- Executive Summary
- Introduction & Background
- Objectives & Scope
- Methodology / Approach (if applicable)
- Findings & Analysis (with subsections)
- Recommendations
- Conclusion
- References / Sources (placeholders)
- Appendices (if applicable)
Use clear, formal, data-driven language.`,

  minutes: `
You are an expert meeting minutes writer.
Produce COMPLETE Meeting Minutes in markdown that includes:
- Meeting title, date/time, location, facilitator placeholders
- Attendees list (with placeholders)
- Call to Order / Opening
- Agenda Items (each with discussion, decisions, action items)
- Action Items Summary table (Who | What | Due Date)
- Next Meeting details
- Adjournment
- Approval / Sign-off block
Be precise and factual.`,

  email: `
You are a senior professional communications expert.
Draft a COMPLETE, polished professional email / letter in markdown that includes:
- Header (From, To, CC, Subject — with placeholders)
- Salutation
- Opening paragraph (purpose)
- Body (substantive content)
- Closing paragraph (call to action / next steps)
- Professional sign-off
- Signature block placeholder
Match the tone to the context (formal, semi-formal, persuasive).`,

  legal: `
You are a senior litigation attorney and legal brief writer.
Produce a COMPLETE Legal Brief in markdown that includes:
- Caption / Case Header (with placeholders)
- Table of Contents
- Statement of Facts
- Question Presented
- Summary of Argument
- Argument (with numbered sections and sub-arguments)
- Conclusion & Relief Requested
- Certificate of Service
- Signature Block
Use precise legal language and organised argument structure.`,

  "terms-of-service": `
You are an expert legal drafter specialising in digital product compliance.
Produce COMPLETE Terms of Service in markdown that includes:
- Acceptance of Terms
- Description of Service
- User Accounts & Responsibilities
- Prohibited Uses
- Intellectual Property
- Disclaimers & Warranties
- Limitation of Liability
- Indemnification
- Privacy Policy Reference
- Governing Law
- Changes to Terms
- Contact Information
Ensure GDPR / CCPA awareness where relevant. Use clear, readable legal language.`,

  sow: `
You are an expert project management consultant.
Produce a COMPLETE Statement of Work (SOW) in markdown that includes:
- Project Overview & Purpose
- Scope of Work (in / out of scope)
- Deliverables & Acceptance Criteria
- Assumptions & Constraints
- Timeline / Schedule (with milestones table)
- Resources & Responsibilities (RACI if applicable)
- Payment Schedule
- Change Management Process
- Sign-off Block
Be precise and unambiguous.`,

  custom: `
You are a versatile professional document writer capable of handling any document type.
Based on the user's description and the conversation context, produce a COMPLETE, well-structured document.
Choose appropriate sections, formatting, and professional language that fits the document type the user describes.
If the type is unclear, default to a clean formal report format with clear headings.`,
};

const DEFAULT_INSTRUCTIONS = TEMPLATE_INSTRUCTIONS.custom!;

// ─── Build generation prompt ──────────────────────────────────────────────────

function buildGenerationPrompt(
  templateId: string,
  templateName: string,
  conversationContext: string,
  customPrompt?: string
): string {
  const instructions =
    TEMPLATE_INSTRUCTIONS[templateId] ?? DEFAULT_INSTRUCTIONS;

  const parts: string[] = [instructions.trim()];

  if (conversationContext.trim()) {
    parts.push(
      `\n--- CONVERSATION CONTEXT ---\nUse the following conversation as context and source material for the document:\n${conversationContext}`
    );
  }

  if (customPrompt?.trim()) {
    parts.push(
      `\n--- USER'S SPECIFIC INSTRUCTIONS ---\n${customPrompt.trim()}`
    );
  }

  parts.push(
    `\nNow produce the complete "${templateName}" document in well-formatted markdown. Do not include any explanation outside the document itself — return ONLY the document content.`
  );

  return parts.join("\n");
}

// ─── Build refinement prompt ──────────────────────────────────────────────────

function buildRefinementPrompt(
  currentDoc: string,
  refinementRequest: string,
  templateName: string
): string {
  /**
   * Smart refinement: detect if the user wants a full rewrite vs. a targeted change.
   * Keywords that signal full regeneration:
   */
  const fullRewriteSignals = [
    "rewrite",
    "regenerate",
    "redo",
    "start over",
    "from scratch",
    "completely",
    "full",
    "entirely",
    "overhaul",
    "restructure",
  ];

  const isFullRewrite = fullRewriteSignals.some((kw) =>
    refinementRequest.toLowerCase().includes(kw)
  );

  if (isFullRewrite) {
    return `You are an expert document writer. The user wants the entire "${templateName}" document rewritten.

Current document:
${currentDoc}

User's rewrite instruction:
${refinementRequest}

Rewrite the complete document following the instruction. Return ONLY the new document in markdown, no explanations.`;
  }

  return `You are an expert professional document editor.

Here is the current "${templateName}" document:
${currentDoc}

---

The user requests the following specific change:
"${refinementRequest}"

INSTRUCTIONS:
1. Identify EXACTLY what needs to change — nothing more.
2. Apply the change precisely and surgically.
3. Maintain all formatting, tone, style, and structure of the rest of the document.
4. If the change is minor (e.g., fix a word, add a clause), only that part should differ.
5. If the change requires restructuring a section, restructure only that section.
6. Return the COMPLETE updated document in markdown. Do not include any text outside the document.`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = prepareDocRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: validated.error.issues },
        { status: 400 }
      );
    }

    const {
      messages,
      templateId,
      templateName,
      customPrompt,
      currentDoc,
      refinementRequest,
    } = validated.data;

    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    let userPrompt: string;
    let systemPrompt: string;

    if (refinementRequest && currentDoc) {
      // ── Refinement mode ──────────────────────────────────────────────────
      systemPrompt =
        "You are an expert professional document editor. Apply the requested changes to the document precisely, maintaining style and formatting. Return ONLY the complete updated document in markdown.";
      userPrompt = buildRefinementPrompt(
        currentDoc,
        refinementRequest,
        templateName
      );
    } else {
      // ── Initial generation mode ──────────────────────────────────────────
      const conversationContext = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      systemPrompt =
        "You are an expert professional document writer. Produce complete, high-quality documents in markdown format. Return ONLY the document content without any preamble or explanation.";
      userPrompt = buildGenerationPrompt(
        templateId,
        templateName,
        conversationContext,
        customPrompt
      );
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will produce the document now." }],
      },
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ];

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384,
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

    if (!geminiResponse.ok) {
      const errorData = (await geminiResponse
        .json()
        .catch(() => ({}))) as Record<string, unknown>;
      console.error("Gemini prepare-doc error:", errorData);

      if (geminiResponse.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate document" },
        { status: geminiResponse.status }
      );
    }

    const data = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const docText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!docText) {
      return NextResponse.json(
        { error: "No document content generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ document: docText.trim() });
  } catch (error) {
    console.error("Prepare-doc API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
