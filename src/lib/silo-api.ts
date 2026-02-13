import { env } from "~/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  context?: Record<string, string>;
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

/** Create a new chat session */
export async function createChat(payload: CreateChatPayload): Promise<Chat> {
  return apiRequest<Chat>("/api/ai/chats", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Get a chat by ID with all messages */
export async function getChat(chatId: string): Promise<Chat> {
  return apiRequest<Chat>(`/api/ai/chats/${chatId}`);
}

/** Send a message to an existing chat */
export async function sendMessage(
  chatId: string,
  payload: SendMessagePayload,
): Promise<ChatMessage | Record<string, never>> {
  return apiRequest<ChatMessage | Record<string, never>>(
    `/api/ai/chats/${chatId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
