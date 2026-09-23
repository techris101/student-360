"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Plus, MessageSquare, Trash2, AlertCircle } from "lucide-react";
import { MessageItem, MessageProps } from "@/components/advisor/message-item";
import type { AdvisorThreadSummary } from "@/app/actions/advisor";
import { deleteAdvisorThread } from "@/app/actions/advisor";

interface AdvisorChatProps {
  initialThreads?: AdvisorThreadSummary[];
  initialThreadId?: string;
  initialMessages?: MessageProps[];
  remainingMessages?: number;
  messageCap?: number;
}

const STARTER_PROMPTS = [
  "Which scholarships should I prioritise this month?",
  "How can I make my CV competitive for global fellowships?",
  "Review my eligibility for Mastercard Foundation Scholars.",
  "What should I prepare for Chevening before the cycle opens?",
];

export function AdvisorChat({
  initialThreads = [],
  initialThreadId,
  initialMessages = [],
  remainingMessages = 30,
  messageCap = 30,
}: AdvisorChatProps) {
  const [threads, setThreads] = useState<AdvisorThreadSummary[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreadId || (initialThreads[0]?.id ?? null)
  );
  const [messages, setMessages] = useState<MessageProps[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState(remainingMessages);
  const [cap] = useState(messageCap);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

  // Handle start new thread
  const handleNewConversation = () => {
    setActiveThreadId(null);
    setMessages([]);
    setErrorMsg(null);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle delete thread
  const handleDeleteThread = async (tId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAdvisorThread(tId);
    setThreads((prev) => prev.filter((t) => t.id !== tId));
    if (activeThreadId === tId) {
      handleNewConversation();
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || streaming || remaining <= 0) return;

    setInput("");
    setErrorMsg(null);

    // Append user message optimistically
    const userMsg: MessageProps = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Placeholder for incoming assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          thread_id: activeThreadId || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setErrorMsg("Daily message limit reached. Resets at midnight Kigali time.");
          setRemaining(0);
        } else {
          const errData = await response.json().catch(() => ({}));
          setErrorMsg(errData.error || "Failed to receive response from Advisor.");
        }
        // Remove empty assistant placeholder
        setMessages((prev) => prev.slice(0, -1));
        setStreaming(false);
        return;
      }

      // Check remaining header
      const newRemaining = response.headers.get("X-Advisor-Remaining");
      if (newRemaining !== null) {
        setRemaining(parseInt(newRemaining, 10));
      }

      // Check thread ID header
      const serverThreadId = response.headers.get("X-Advisor-Thread-Id");
      if (serverThreadId && serverThreadId !== activeThreadId) {
        setActiveThreadId(serverThreadId);
        // Add to threads list if not present
        setThreads((prev) => {
          if (prev.some((t) => t.id === serverThreadId)) return prev;
          return [
            {
              id: serverThreadId,
              title:
                messageContent.length > 40
                  ? `${messageContent.slice(0, 37)}...`
                  : messageContent,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }

      // Stream text chunks
      if (!response.body) {
        throw new Error("Empty response body from stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          const last = updated[lastIndex];
          if (last && last.role === "assistant") {
            updated[lastIndex] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while communicating with the Advisor."
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-160px)]">
      {/* Threads Sidebar (Desktop) */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[var(--line)] pr-6 space-y-4">
        <button
          type="button"
          onClick={handleNewConversation}
          className="flex items-center justify-center gap-2 h-10 px-3 bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--line-strong)] rounded-[4px] text-xs font-medium transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>New conversation</span>
        </button>

        <div className="space-y-1 overflow-y-auto max-h-[60vh]">
          <span className="text-[11px] font-medium text-[var(--muted)] px-2 block">
            Recent conversations
          </span>
          {threads.length === 0 ? (
            <p className="text-xs text-[var(--ink-2)] px-2 pt-2">
              No conversations yet.
            </p>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setActiveThreadId(t.id);
                  // Load thread messages could be triggered here or in router
                }}
                className={`group flex items-center justify-between p-2 rounded-[4px] cursor-pointer text-xs transition-colors ${
                  activeThreadId === t.id
                    ? "bg-[var(--surface-2)] text-[var(--ink)] font-medium"
                    : "text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[var(--muted)]" />
                  <span className="truncate">{t.title}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteThread(t.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-[var(--red)] transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col justify-between min-w-0 space-y-4">
        {/* Messages Container */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="py-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[var(--ink)]">
                  Student 360 Advisor
                </h2>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed max-w-lg">
                  Ask study, fellowship, or scholarship questions. I check your profile
                  against all verified opportunities and official criteria.
                </p>
              </div>

              {/* Starter questions */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--muted)] block">
                  Suggested topics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 text-left bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--line)] rounded-[4px] text-xs text-[var(--ink)] transition-colors leading-relaxed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageItem key={idx} role={msg.role} content={msg.content} />
            ))
          )}

          {streaming && messages[messages.length - 1]?.content === "" && (
            <div className="text-xs text-[var(--muted)] animate-pulse">
              Advisor is thinking...
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-[var(--red-subtle)] border border-[var(--red)] text-[var(--red)] rounded-[4px] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-2 border-t border-[var(--line)] space-y-1.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-end gap-2"
          >
            <div className="relative flex-1">
              <label htmlFor="advisor-message-input" className="sr-only">
                Your message to advisor
              </label>
              <textarea
                id="advisor-message-input"
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={streaming || remaining <= 0}
                placeholder={
                  remaining <= 0
                    ? "Daily message cap reached. Resets at midnight."
                    : "Ask about scholarships, requirements, timelines..."
                }
                className="w-full resize-none p-3 pr-10 text-sm bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:ring-offset-2 placeholder:text-[var(--muted)] disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || streaming || remaining <= 0}
              className="h-10 px-4 bg-[var(--teal)] hover:bg-[#0c5945] text-white text-xs font-medium rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Messages-left counter under the input in --muted per DESIGN.md */}
          <div className="flex items-center justify-between text-xs text-[var(--muted)] px-1">
            <span>
              {remaining} of {cap} messages left today · Resets at midnight
            </span>
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
