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
You are an expert business proposal writer producing documents with a polished, professional layout.
Produce a COMPLETE Business Proposal in markdown with clear visual structure, using horizontal rules (---) to separate major sections, bold labels for key terms, and consistent heading hierarchy.

Document structure:

# Business Proposal

**Prepared for:** [CLIENT NAME]  
**Prepared by:** [YOUR COMPANY / NAME]  
**Date:** [DATE]  
**Proposal Reference:** [REF NUMBER]

---

## 1. Executive Summary
(Concise overview of the proposal — what you are offering and why it matters.)

---

## 2. Problem Statement / Opportunity
(Clearly define the client's challenge or the market opportunity being addressed.)

---

## 3. Proposed Solution
(Describe your approach, methodology, and how it solves the problem. Break into subsections if needed.)

### 3.1 Approach & Methodology
### 3.2 Key Features & Benefits

---

## 4. Scope of Work & Deliverables
(List deliverables with descriptions. Use a table format.)

| # | Deliverable | Description | Timeline |
|---|------------|-------------|----------|
| 1 | [Deliverable] | [Description] | [Date] |

---

## 5. Timeline & Milestones
(Present a phased timeline with clear milestones.)

| Phase | Milestone | Start Date | End Date |
|-------|----------|-----------|----------|
| Phase 1 | [Milestone] | [Date] | [Date] |

---

## 6. Investment & Pricing
(Detail pricing clearly. Use a table.)

| Item | Description | Amount |
|------|------------|--------|
| [Item] | [Description] | [Amount] |
| | **Total** | **[TOTAL]** |

**Payment Terms:** [Net 30 / Milestone-based / etc.]

---

## 7. Why Us
(Your unique value proposition, relevant experience, credentials, and differentiators.)

---

## 8. Terms & Conditions
(Key terms including validity period, assumptions, confidentiality provisions.)

---

## 9. Next Steps
(Clear call to action — what the client should do to proceed.)

---

**Acceptance & Approval**

Client Signature: _________________________  
Name: [NAME]  
Title: [TITLE]  
Date: _____________

Proposer Signature: _________________________  
Name: [NAME]  
Title: [TITLE]  
Date: _____________

Use compelling, professional language throughout. Insert placeholders in square brackets where specific details are needed.`,

  report: `
You are a professional business report writer producing documents with a polished, executive-ready layout.
Produce a COMPLETE Business / Research Report in markdown with clear visual structure, using horizontal rules (---) to separate major sections, bold labels for metadata, and consistent heading hierarchy.

Document structure:

# [REPORT TITLE]

**Author:** [AUTHOR NAME]  
**Department / Organization:** [DEPARTMENT]  
**Date:** [DATE]  
**Report Reference:** [REF NUMBER]  
**Classification:** [Internal / Confidential / Public]

---

## Executive Summary
(Brief overview of the report's purpose, key findings, and recommended actions — no more than 2-3 paragraphs.)

---

## 1. Introduction & Background
(Context, background information, and the reason this report was commissioned.)

### 1.1 Purpose
### 1.2 Background

---

## 2. Objectives & Scope
(What this report aims to address, and the boundaries of the analysis.)

---

## 3. Methodology / Approach
(How data was gathered, analyzed, or what frameworks were applied.)

---

## 4. Findings & Analysis
(The core of the report. Use subsections, tables, and bullet points for clarity.)

### 4.1 Finding One
### 4.2 Finding Two
### 4.3 Key Data Summary

| Metric | Value | Trend |
|--------|-------|-------|
| [Metric] | [Value] | [↑/↓/—] |

---

## 5. Recommendations
(Actionable recommendations based on the findings. Number them clearly.)

1. **[Recommendation Title]** — [Description]
2. **[Recommendation Title]** — [Description]

---

## 6. Conclusion
(Summarize the key takeaways and proposed next steps.)

---

## 7. References / Sources
1. [Source/Reference]
2. [Source/Reference]

---

## Appendices
(Supporting data, charts, detailed tables, or supplementary materials.)

---

*Prepared by [AUTHOR NAME] — [DATE]*

Use clear, formal, data-driven language throughout. Insert placeholders in square brackets where specific details are needed.`,

  minutes: `
You are an expert meeting minutes writer producing documents with a polished, professional layout.
Produce COMPLETE Meeting Minutes in markdown with clear visual structure, using horizontal rules (---) to separate major sections, bold labels for metadata, and consistent heading hierarchy.

Document structure:

# Meeting Minutes

**Meeting Title:** [MEETING TITLE]  
**Date:** [DATE]  
**Time:** [START TIME] — [END TIME]  
**Location:** [LOCATION / VIRTUAL LINK]  
**Facilitator / Chair:** [NAME]  
**Minutes Taken By:** [NAME]

---

## Attendees

| Name | Role / Title | Present |
|------|-----------|---------|
| [Name] | [Role] | ✓ |
| [Name] | [Role] | ✓ |
| [Name] | [Role] | ✗ (Absent) |

---

## 1. Call to Order
(Meeting was called to order at [TIME] by [FACILITATOR NAME].)

---

## 2. Approval of Previous Minutes
(Minutes from [PREVIOUS DATE] were reviewed and approved / amended.)

---

## 3. Agenda Items

### 3.1 [Agenda Item Title]
**Presented by:** [NAME]

**Discussion:**  
(Summary of discussion points.)

**Decisions:**  
- [Decision made]

**Action Items:**  
- [ ] [Action] — **Assigned to:** [NAME] — **Due:** [DATE]

---

### 3.2 [Agenda Item Title]
**Presented by:** [NAME]

**Discussion:**  
(Summary of discussion points.)

**Decisions:**  
- [Decision made]

**Action Items:**  
- [ ] [Action] — **Assigned to:** [NAME] — **Due:** [DATE]

---

## 4. Action Items Summary

| # | Action Item | Assigned To | Due Date | Status |
|---|------------|------------|----------|--------|
| 1 | [Action] | [Name] | [Date] | Pending |
| 2 | [Action] | [Name] | [Date] | Pending |

---

## 5. Next Meeting

**Date:** [DATE]  
**Time:** [TIME]  
**Location:** [LOCATION]

---

## 6. Adjournment
(Meeting was adjourned at [TIME] by [FACILITATOR NAME].)

---

**Approval**

Minutes Approved By: _________________________  
Name: [NAME]  
Title: [TITLE]  
Date: _____________

Be precise, factual, and well-organized. Insert placeholders in square brackets where specific details are needed.`,

  email: `
You are a senior professional communications expert producing polished correspondence.
Draft a COMPLETE professional email / letter in markdown with clear visual structure and consistent formatting.

Document structure:

# Professional Letter

---

**From:** [SENDER NAME]  
**Title:** [SENDER TITLE]  
**Organization:** [ORGANIZATION]  
**Email:** [SENDER EMAIL]  
**Phone:** [PHONE NUMBER]

**To:** [RECIPIENT NAME]  
**Title:** [RECIPIENT TITLE]  
**Organization:** [ORGANIZATION]  
**Email:** [RECIPIENT EMAIL]

**CC:** [CC RECIPIENTS]  
**Date:** [DATE]  
**Subject:** [SUBJECT LINE]

---

Dear [RECIPIENT NAME],

### Opening
(State the purpose of the letter clearly and concisely.)

### Body
(Provide the substantive content. Use paragraphs, bullet points, or numbered lists for clarity. Break into subsections if needed.)

### Closing
(Summarize key points, state the call to action or next steps, and express willingness to follow up.)

---

Sincerely,

**[SENDER NAME]**  
[SENDER TITLE]  
[ORGANIZATION]  
[PHONE] | [EMAIL]

---

*Enclosures: [List any attachments, if applicable]*

Match the tone to the context (formal, semi-formal, or persuasive). Insert placeholders in square brackets where specific details are needed.`,

  legal: `
You are a senior litigation attorney and legal brief writer producing documents with a polished, court-ready layout.
Produce a COMPLETE Legal Brief in markdown with clear visual structure, using horizontal rules (---) to separate major sections, bold labels for case metadata, and consistent heading hierarchy.

Document structure:

# Legal Brief

---

**IN THE [COURT NAME]**  
**[JURISDICTION]**

| | |
|---|---|
| **[PLAINTIFF NAME]** | |
| *Plaintiff,* | **Case No.:** [CASE NUMBER] |
| v. | **Judge:** [JUDGE NAME] |
| **[DEFENDANT NAME]** | **Filed:** [DATE] |
| *Defendant.* | |

---

## Table of Contents

1. Statement of Facts
2. Question Presented
3. Summary of Argument
4. Argument
5. Conclusion & Relief Requested
6. Certificate of Service

---

## I. Statement of Facts
(Present the relevant facts of the case in a clear, chronological narrative. Cite to the record where applicable using [Record at ___].)

---

## II. Question Presented
(State the legal question(s) the court must decide, framed precisely.)

---

## III. Summary of Argument
(Provide a concise preview of the argument — typically 1-2 paragraphs.)

---

## IV. Argument

### A. [First Legal Argument Heading]
(Develop the argument with supporting authorities, case law citations, and statutory references. Use sub-sections as needed.)

#### 1. [Sub-argument]
#### 2. [Sub-argument]

### B. [Second Legal Argument Heading]
(Continue with additional arguments, each with its own analysis.)

### C. [Third Legal Argument Heading]
(If applicable.)

---

## V. Conclusion & Relief Requested
(Summarize the argument and clearly state the relief sought from the court.)

WHEREFORE, [PARTY NAME] respectfully requests that this Court [STATE RELIEF REQUESTED].

---

## Certificate of Service

I hereby certify that on [DATE], a copy of this [DOCUMENT TYPE] was served upon all counsel of record via [METHOD OF SERVICE].

_________________________  
**[ATTORNEY NAME]**  
[BAR NUMBER]  
[FIRM NAME]  
[ADDRESS]  
[PHONE] | [EMAIL]  
*Counsel for [PARTY]*

---

Use precise legal language, organized argument structure, and proper legal citation format. Insert placeholders in square brackets where specific details are needed.`,

  "terms-of-service": `
You are an expert legal drafter specialising in digital product compliance, producing documents with a polished, professional layout.
Produce COMPLETE Terms of Service in markdown with clear visual structure, using horizontal rules (---) to separate major sections and consistent heading hierarchy.

Document structure:

# Terms of Service

**Effective Date:** [EFFECTIVE DATE]  
**Last Updated:** [LAST UPDATED DATE]  
**Company:** [COMPANY NAME]  
**Website / Service:** [URL / SERVICE NAME]

---

## 1. Acceptance of Terms
(Explain that by using the service, the user agrees to these terms. State who may use the service and age requirements.)

---

## 2. Description of Service
(Describe what the service provides, including any key features and availability.)

---

## 3. User Accounts & Responsibilities
(Account creation requirements, security responsibilities, permitted use.)

- Account registration requirements
- Password and security obligations
- Accuracy of information provided

---

## 4. Prohibited Uses
(List prohibited activities clearly using bullet points or a numbered list.)

Users shall not:
1. [Prohibited activity]
2. [Prohibited activity]
3. [Prohibited activity]

---

## 5. Intellectual Property
(Ownership of content, trademarks, license grants, and user-generated content rights.)

---

## 6. Payment Terms
(If applicable — billing, subscriptions, refund policies.)

| Plan | Price | Billing Cycle |
|------|-------|---------------|
| [Plan] | [Price] | [Monthly/Annual] |

---

## 7. Disclaimers & Warranties
(Service provided "as is", no warranty of uninterrupted service, etc.)

---

## 8. Limitation of Liability
(Cap on liability, exclusion of consequential damages.)

---

## 9. Indemnification
(User's obligation to indemnify the company.)

---

## 10. Privacy Policy
(Reference to the Privacy Policy and how user data is handled. Mention GDPR / CCPA compliance where relevant.)

---

## 11. Termination
(Conditions under which accounts may be suspended or terminated.)

---

## 12. Governing Law & Dispute Resolution
(Applicable jurisdiction, arbitration clause if applicable.)

**Governing Law:** [JURISDICTION]  
**Dispute Resolution:** [Arbitration / Court / Mediation]

---

## 13. Changes to Terms
(How users will be notified of changes and when changes take effect.)

---

## 14. Contact Information

**[COMPANY NAME]**  
[ADDRESS]  
**Email:** [EMAIL]  
**Phone:** [PHONE]

---

*By using [SERVICE NAME], you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.*

Ensure GDPR / CCPA awareness where relevant. Use clear, readable legal language. Insert placeholders in square brackets where specific details are needed.`,

  sow: `
You are an expert project management consultant producing documents with a polished, professional layout.
Produce a COMPLETE Statement of Work (SOW) in markdown with clear visual structure, using horizontal rules (---) to separate major sections, bold labels for metadata, tables for structured data, and consistent heading hierarchy.

Document structure:

# Statement of Work (SOW)

**Project Name:** [PROJECT NAME]  
**SOW Reference:** [REF NUMBER]  
**Client:** [CLIENT NAME]  
**Vendor / Provider:** [VENDOR NAME]  
**Effective Date:** [DATE]  
**Version:** [VERSION NUMBER]

---

## 1. Project Overview & Purpose
(Describe the project's background, goals, and business objectives.)

---

## 2. Scope of Work

### 2.1 In Scope
(Clearly define what is included in this engagement.)
1. [Item]
2. [Item]

### 2.2 Out of Scope
(Explicitly state what is NOT included to avoid scope creep.)
1. [Item]
2. [Item]

---

## 3. Deliverables & Acceptance Criteria

| # | Deliverable | Description | Acceptance Criteria | Due Date |
|---|------------|-------------|-------------------|----------|
| 1 | [Deliverable] | [Description] | [Criteria] | [Date] |
| 2 | [Deliverable] | [Description] | [Criteria] | [Date] |

---

## 4. Assumptions & Constraints

**Assumptions:**
- [Assumption]
- [Assumption]

**Constraints:**
- [Constraint]
- [Constraint]

---

## 5. Timeline & Milestones

| Phase | Milestone | Start Date | End Date | Status |
|-------|----------|-----------|----------|--------|
| Phase 1 | [Milestone] | [Date] | [Date] | Not Started |
| Phase 2 | [Milestone] | [Date] | [Date] | Not Started |
| Phase 3 | [Milestone] | [Date] | [Date] | Not Started |

---

## 6. Resources & Responsibilities

| Role | Name | Responsibility | Organization |
|------|------|---------------|-------------|
| Project Manager | [Name] | [Responsibility] | [Org] |
| Technical Lead | [Name] | [Responsibility] | [Org] |

---

## 7. Payment Schedule

| Milestone | Payment Amount | Due Upon |
|-----------|---------------|----------|
| [Milestone] | [Amount] | [Condition] |
| | **Total:** | **[TOTAL]** |

**Payment Terms:** [Net 30 / Upon delivery / etc.]

---

## 8. Change Management Process
(Describe how changes to scope, timeline, or cost will be handled — change request process, approval authority, impact assessment.)

---

## 9. General Provisions
(Confidentiality, intellectual property, termination conditions, dispute resolution.)

---

## Sign-off & Approval

**Client:**

Signature: _________________________  
Name: [NAME]  
Title: [TITLE]  
Date: _____________

**Vendor / Provider:**

Signature: _________________________  
Name: [NAME]  
Title: [TITLE]  
Date: _____________

Be precise, unambiguous, and professionally formatted. Insert placeholders in square brackets where specific details are needed.`,

  custom: `
You are a versatile professional document writer capable of handling any document type, producing documents with a polished, visually structured layout.
Based on the user's description and the conversation context, produce a COMPLETE, well-structured document.

Formatting guidelines:
- Use a clear title as an H1 heading
- Include metadata at the top (author, date, reference number — as bold labels with placeholders)
- Use horizontal rules (---) to visually separate major sections
- Use numbered headings (## 1. Section, ## 2. Section) for consistent hierarchy
- Use tables for any structured or comparative data
- Use bullet points and bold labels for key terms
- Include a sign-off or conclusion section at the end
- Insert placeholders in square brackets where specific details are needed

Choose appropriate sections, formatting, and professional language that fits the document type the user describes.
If the type is unclear, default to a clean formal report format with clear headings, metadata block, and professional structure.`,
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
    `\nIMPORTANT: Detect the language used in the conversation context and/or the user's instructions. The document MUST be produced in the SAME language. If the conversation is in Spanish, produce the document in Spanish. If in French, produce in French. If in English, produce in English. Always match the user's language.`
  );

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

IMPORTANT: Detect the language of the rewrite instruction. If the user writes the instruction in a specific language, produce the rewritten document in that SAME language. Otherwise, keep the document in its original language.

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
6. Detect the language of the refinement request and the document. Keep the document in its original language unless the user explicitly requests a language change.
7. Return the COMPLETE updated document in markdown. Do not include any text outside the document.`;
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
        "You are an expert multilingual professional document editor. Apply the requested changes to the document precisely, maintaining style and formatting. CRITICAL: Keep the document in its original language — do NOT translate to English or any other language. Return ONLY the complete updated document in markdown.";
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
        "You are an expert multilingual professional document writer. Produce complete, high-quality documents in markdown format. CRITICAL: Detect the language of the user's input/conversation and produce the document in that SAME language — do NOT default to English. Return ONLY the document content without any preamble or explanation.";
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
        parts: [{ text: "Understood. I will produce the document in the same language as the user's input." }],
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
