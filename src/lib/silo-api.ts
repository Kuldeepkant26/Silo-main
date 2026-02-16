import { env } from "~/env";

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
  };
}

export interface SendMessagePayload {
  content: string;
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
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN.startsWith("Bearer ")
        ? AUTH_TOKEN
        : `Bearer ${AUTH_TOKEN}`,
      ...options.headers,
    },
  });

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
    const raw = await apiRequest<{
      userMessage?: ApiRawMessage;
      aiMessage?: ApiRawMessage;
      message?: ApiRawMessage;
      error?: string;
    }>(
      `/api/ai/chats/${chatId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

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
