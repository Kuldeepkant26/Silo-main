"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Icons } from "~/components/icons";
import { cn } from "~/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AgentPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Retry logic for rate limits
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        // Prepare chat history for API
        const chatHistory: ChatMessage[] = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        
        // Add current user message
        chatHistory.push({
          role: "user",
          content: userMessage.content,
        });

        // Call the API
        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: chatHistory }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // If rate limited, wait and retry
          if (response.status === 429) {
            retryCount++;
            if (retryCount < maxRetries) {
              const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
              toast.info(`Rate limited. Retrying in ${waitTime / 1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
          
          throw new Error(errorData.error || "Failed to get response");
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        return; // Success - exit the function
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        retryCount++;
        
        if (retryCount < maxRetries && lastError.message.includes("Rate limit")) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          toast.info(`Retrying in ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          break;
        }
      }
    }

    // All retries failed
    console.error("Chat error after retries:", lastError);
    toast.error(lastError?.message || "Failed to send message. Please try again in a moment.");
    
    // Remove the user message if the API call failed
    setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileClick = () => {
    setShowFileMenu(!showFileMenu);
  };

  const handleAddFiles = () => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  // Function to render markdown-like content
  const renderContent = (content: string) => {
    // Simple markdown rendering for bold text
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <section className="flex flex-col h-screen bg-background">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      />

      {/* Header */}
      <header className="flex-shrink-0 px-6 sm:px-8 lg:px-12 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Icons.ai className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                SILO Agent
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Your AI-powered legal assistant
              </p>
            </div>
          </div>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Chat history
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mb-6">
                <Icons.ai className="w-8 h-8 text-background" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 text-center">
                Ready when you are
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Ask anything about legal documents, compliance, or get help drafting contracts.
              </p>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {message.role === "user" ? (
                    /* User Message */
                    <div className="bg-foreground text-background rounded-xl px-5 py-4 font-medium">
                      {message.content}
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {renderContent(message.content)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 py-4">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                    <Icons.spinner className="w-4 h-4 text-background animate-spin" />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border bg-background">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-4 sm:py-6">
          <form onSubmit={handleSubmit}>
            <div className="relative border border-border rounded-xl bg-card shadow-sm hover:border-foreground/20 focus-within:border-foreground/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={messages.length === 0 
                  ? "Ask anything. Whether you need a specific template, help drafting a clause, or guidance on legal best practices, we're here to support your team."
                  : "Ask anything..."
                }
                rows={messages.length === 0 ? 2 : 1}
                className="w-full resize-none bg-transparent border-none outline-none px-5 py-4 pb-14 text-sm text-foreground placeholder:text-muted-foreground min-h-[60px]"
              />
              
              {/* Bottom toolbar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleFileClick}
                    className="w-9 h-9 rounded-full border-2 border-foreground flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-all duration-200"
                  >
                    <Icons.add className="w-4 h-4" />
                  </button>
                  
                  {/* File menu dropdown */}
                  {showFileMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[180px] z-10">
                      <button
                        type="button"
                        onClick={handleAddFiles}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Icons.file className="w-4 h-4" />
                        Add files & photos
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center text-background hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-3">
            SILO Agent may make mistakes. Please verify important legal information.
          </p>
        </div>
      </div>
    </section>
  );
}
