import { env } from "~/env";
import { getSessionAuthHeaderAsync } from "~/lib/api-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Raw message shape from the backend API */
export interface ApiRawMessage {
  id: string;
  chat_id: string;
  content: string;
  is_user: boolean;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

/** Normalised message used throughout the frontend */
export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Raw chat object returned by the backend */
export interface ApiRawChat {
  id: string;
  user_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  context?: Record<string, unknown>;
  is_active?: boolean;
}

/** Normalised chat used throughout the frontend */
export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  context?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatPayload {
  title: string;
  initialMessage: string;
  context?: {
    legalTopic?: string;
    jurisdiction?: string;
    documentType?: string;
    /** Current authenticated user details */
    currentUser?: {
      id: string;
      name: string;
      email: string;
      organizationId?: string;
    };
    /** Summary of the user's requests / tickets */
    userRequests?: Array<{
      id: string;
      title: string;
      type: string;
      priority: string | null;
      workflowStatus: string | null;
      category: string | null;
      createdAt: string;
    }>;
    [key: string]: unknown;
  };
}

export interface SendMessagePayload {
  content: string;
  attachments?: File[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeMessage(raw: ApiRawMessage): ChatMessage {
  return {
    id: raw.id,
    chatId: raw.chat_id,
    role: raw.is_user ? "user" : "assistant",
    content: raw.content,
    createdAt: raw.created_at,
  };
}

function normalizeChat(raw: ApiRawChat, rawMessages: ApiRawMessage[]): Chat {
  return {
    id: raw.id,
    title: raw.title,
    messages: rawMessages.map(normalizeMessage),
    context: raw.context,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─── API Client ───────────────────────────────────────────────────────────────

const API_BASE = env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Resolve the Authorization header value.
 * Prefers the current user's BetterAuth session token; falls back to the
 * static env token only when no session is available (e.g. during SSR or
 * unauthenticated contexts).
 */
async function resolveAuthHeader(): Promise<string> {
  const sessionHeader = await getSessionAuthHeaderAsync();
  if (sessionHeader) return sessionHeader;

  // Fallback for edge-cases where session is not yet available
  const fallback = env.NEXT_PUBLIC_API_AUTH_TOKEN;
  return fallback.startsWith("Bearer ") ? fallback : `Bearer ${fallback}`;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authHeader = await resolveAuthHeader();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...options.headers,
    },
  });

  return handleApiResponse<T>(response);
}

/**
 * Send a multipart/form-data request (used when attachments are included).
 * The browser sets the Content-Type + boundary automatically when we pass FormData.
 */
async function formDataRequest<T>(
  endpoint: string,
  formData: FormData,
  method = "POST",
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const authHeader = await resolveAuthHeader();

  const response = await fetch(url, {
    method,
    body: formData,
    headers: {
      Authorization: authHeader,
      // Do NOT set Content-Type – the browser adds multipart boundary automatically
    },
  });

  return handleApiResponse<T>(response);
}

async function handleApiResponse<T>(response: Response): Promise<T> {

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    // Try to extract a readable error message from JSON
    let errorMessage = `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody) as Record<string, unknown>;
      if (parsed.error && typeof parsed.error === "string") {
        errorMessage = parsed.error;
      } else if (parsed.message && typeof parsed.message === "string") {
        errorMessage = parsed.message;
      }
    } catch {
      if (errorBody) errorMessage = errorBody;
    }
    throw new Error(errorMessage);
  }

  // Some endpoints may not return a body
  const text = await response.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Create a new chat session with an initial message.
 *
 * The backend creates the chat, saves the initial user message, then tries to
 * generate an AI reply.  If the AI generation fails (500) the chat + user
 * message are still persisted.  We catch that specific error, return a
 * partial Chat object, and let the caller poll for the AI response.
 */
export async function createChat(payload: CreateChatPayload): Promise<Chat> {
  try {
    const raw = await apiRequest<{
      chat?: ApiRawChat;
      messages?: ApiRawMessage[];
      initialAiResponse?: ApiRawMessage | null;
    }>(
      "/api/ai/chats",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    const chat = raw.chat ?? ({} as ApiRawChat);
    const msgs = raw.messages ?? [];
    return normalizeChat(chat, msgs);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("failed to generate ai response")) {
      console.warn("[silo-api] createChat: AI generation failed but chat may be created. Will poll.");
      // Return a minimal Chat so the caller has _something_ to work with.
      // The caller should poll getChat() to discover the real chat id + messages.
      throw new CreateChatAIError(msg);
    }
    throw err;
  }
}

/** Specific error for when createChat succeeds but AI generation fails */
export class CreateChatAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreateChatAIError";
  }
}

/** Get a chat by ID with all messages */
export async function getChat(chatId: string): Promise<Chat> {
  const raw = await apiRequest<{ chat?: ApiRawChat; messages?: ApiRawMessage[] }>(
    `/api/ai/chats/${chatId}`,
  );
  const chat = raw.chat ?? ({} as ApiRawChat);
  const msgs = raw.messages ?? [];
  return normalizeChat(chat, msgs);
}

/**
 * Send a message to an existing chat.
 *
 * The backend saves the user message first, then attempts to generate an AI
 * reply. If the AI generation fails the backend returns 500 with
 * `{"error":"Failed to generate AI response"}` but the user message IS
 * persisted. In that case we return an empty object so the caller can fall
 * back to polling via `getChat()`.
 */
export async function sendMessage(
  chatId: string,
  payload: SendMessagePayload,
): Promise<ChatMessage | Record<string, never>> {
  try {
    const hasAttachments = payload.attachments && payload.attachments.length > 0;

    let raw: {
      userMessage?: ApiRawMessage;
      aiMessage?: ApiRawMessage;
      message?: ApiRawMessage;
      error?: string;
    };

    if (hasAttachments) {
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append("content", payload.content);
      for (const file of payload.attachments!) {
        formData.append("attachments", file);
      }
      raw = await formDataRequest(`/api/ai/chats/${chatId}/messages`, formData);
    } else {
      // Standard JSON request (no attachments)
      raw = await apiRequest(`/api/ai/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: payload.content }),
      });
    }

    // The backend may return the AI reply in different shapes
    const aiRaw = raw.aiMessage ?? raw.message;
    if (aiRaw) {
      return normalizeMessage(aiRaw);
    }

    return {} as Record<string, never>;
  } catch (err) {
    // The backend saves the user message even when AI generation fails (500).
    // Swallow this specific error so the caller can poll for the AI reply.
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("failed to generate ai response")) {
      console.warn("[silo-api] AI generation pending – will poll for reply");
      return {} as Record<string, never>;
    }
    throw err;
  }
}
