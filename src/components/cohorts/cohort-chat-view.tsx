"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Send,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Clock,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CohortMessageItemView } from "./cohort-message-item";
import { RulesDialog } from "./rules-dialog";
import { ReportDialog } from "./report-dialog";
import {
  sendCohortMessage,
  acceptCohortRules,
  leaveCohort,
  joinCohort,
  reportCohortMessage,
  blockCohortUser,
} from "@/app/actions/cohorts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { CohortItem, CohortMessageItem } from "@/lib/cohorts/types";

interface CohortChatViewProps {
  cohort: CohortItem;
  initialMessages: CohortMessageItem[];
}

export function CohortChatView({
  cohort: initialCohort,
  initialMessages,
}: CohortChatViewProps) {
  const [cohort, setCohort] = useState<CohortItem>(initialCohort);
  const [messages, setMessages] = useState<CohortMessageItem[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [acceptingRules, setAcceptingRules] = useState(false);
  const [reportState, setReportState] = useState<{
    open: boolean;
    messageId: string | null;
    author: string;
    snippet: string;
  }>({
    open: false,
    messageId: null,
    author: "",
    snippet: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on initial load or new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription via Supabase
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`cohort:${cohort.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `cohort_id=eq.${cohort.id}`,
          },
          (payload) => {
            const newRecord = payload.new as {
              id: string;
              cohort_id: string;
              user_id: string;
              body: string;
              created_at: string;
              hidden?: boolean;
            } | null;
            if (!newRecord || newRecord.hidden) return;

            setMessages((prev) => {
              if (prev.some((m) => m.id === newRecord.id)) return prev;
              return [
                ...prev,
                {
                  id: newRecord.id,
                  cohort_id: newRecord.cohort_id,
                  user_id: newRecord.user_id,
                  first_name: "Student",
                  university_name: "University student",
                  programme: "Programme",
                  body: newRecord.body,
                  created_at: newRecord.created_at,
                  is_own: false,
                },
              ];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // In offline / mock mode Realtime gracefully falls back
    }
  }, [cohort.id]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) return;

    if (!cohort.is_member) {
      setErrorMsg("You must join this cohort before posting.");
      return;
    }

    if (!cohort.rules_accepted) {
      setRulesOpen(true);
      return;
    }

    if (cohort.is_closed) {
      setErrorMsg("This cohort has closed for posting.");
      return;
    }

    if (cohort.member_count < 2) {
      setErrorMsg("Chat will open once at least two students have joined.");
      return;
    }

    setSending(true);
    setErrorMsg(null);

    try {
      const result = await sendCohortMessage(cohort.id, text);
      if (!result.success) {
        setErrorMsg(result.error || "Failed to send message.");
        return;
      }

      setInputValue("");
      if (result.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.message!.id)) return prev;
          return [...prev, result.message!];
        });
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to communicate with cohort server."
      );
    } finally {
      setSending(false);
    }
  };

  // Accept rules handler
  const handleAcceptRules = async () => {
    setAcceptingRules(true);
    try {
      await acceptCohortRules(cohort.id);
      setCohort((prev) => ({ ...prev, rules_accepted: true }));
      setRulesOpen(false);
    } finally {
      setAcceptingRules(false);
    }
  };

  // Leave cohort handler
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this cohort?")) return;
    await leaveCohort(cohort.id);
    setCohort((prev) => ({
      ...prev,
      is_member: false,
      member_count: Math.max(0, prev.member_count - 1),
    }));
  };

  // Join cohort handler
  const handleJoin = async () => {
    await joinCohort(cohort.id);
    setCohort((prev) => ({
      ...prev,
      is_member: true,
      member_count: prev.member_count + 1,
    }));
  };

  // Report message handler
  const handleOpenReport = (messageId: string, author: string, snippet: string) => {
    setReportState({
      open: true,
      messageId,
      author,
      snippet,
    });
  };

  const handleSubmitReport = async (messageId: string, reason: string) => {
    await reportCohortMessage(messageId, reason);
    // Remove locally if needed
    setErrorMsg("Report submitted. Thank you for keeping the community safe.");
    setTimeout(() => setErrorMsg(null), 4000);
  };

  // Block user handler
  const handleBlockUser = async (targetUserId: string, author: string) => {
    if (!confirm(`Block ${author}? You will no longer see their messages.`)) return;
    await blockCohortUser(targetUserId);
    // Filter out messages immediately
    setMessages((prev) => prev.filter((m) => m.user_id !== targetUserId));
    setErrorMsg(`User ${author} has been blocked.`);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto rounded-lg border border-border bg-surface overflow-hidden">
      {/* 1. Header */}
      <div className="px-4 py-3 bg-surface border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/cohorts"
            className="p-1 rounded hover:bg-surface-2 text-muted hover:text-ink transition-colors"
            title="Back to Cohorts"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/opportunities/${cohort.opportunity_id}`}
                className="font-semibold text-sm text-ink truncate hover:text-teal flex items-center gap-1.5 transition-colors"
                title="View Opportunity"
              >
                <span>{cohort.opportunity_title}</span>
                <ExternalLink className="w-3 h-3 text-muted shrink-0" />
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{cohort.organisation}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {cohort.member_count}{" "}
                {cohort.member_count === 1 ? "member" : "members"}
              </span>
              {cohort.deadline && (
                <>
                  <span>•</span>
                  <span>Deadline: {new Date(cohort.deadline).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {cohort.is_member ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeave}
              className="text-xs h-8 text-muted hover:text-red hover:border-red"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Leave
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleJoin}
              className="text-xs h-8 bg-teal hover:bg-teal-hover text-white"
            >
              Join cohort
            </Button>
          )}
        </div>
      </div>

      {/* 2. Notification Banners */}
      {/* Cohort Closed Notice */}
      {cohort.is_closed && (
        <div className="px-4 py-2 bg-amber/10 border-b border-amber/20 text-xs text-amber flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            This cohort closed for posting 30 days after the opportunity deadline.
            Messages remain readable for reference.
          </span>
        </div>
      )}

      {/* Rules Acceptance Notice */}
      {cohort.is_member && !cohort.rules_accepted && !cohort.is_closed && (
        <div className="px-4 py-2.5 bg-teal/10 border-b border-teal/20 text-xs text-ink flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal shrink-0" />
            <span>
              Please review and accept the community rules before sending messages in this
              cohort.
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setRulesOpen(true)}
            className="text-xs h-7 bg-teal hover:bg-teal-hover text-white shrink-0"
          >
            Review rules
          </Button>
        </div>
      )}

      {/* Single Member Waiting Banner */}
      {cohort.member_count < 2 && (
        <div className="px-4 py-2.5 bg-surface-2 border-b border-border text-xs text-muted flex items-center gap-2">
          <Users className="w-4 h-4 text-muted shrink-0" />
          <span>
            You&apos;re the first here. We&apos;ll notify you when other students mark this
            opportunity as applying or submitted.
          </span>
        </div>
      )}

      {/* Transient Alerts / Errors */}
      {errorMsg && (
        <div className="px-4 py-2 bg-red/10 border-b border-red/20 text-xs text-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <Users className="w-8 h-8 mb-2 stroke-[1.5] text-muted/60" />
            <p className="text-sm font-medium text-ink">No messages yet</p>
            <p className="text-xs text-muted max-w-sm mt-1">
              Start the conversation by sharing preparation tips, questions about required
              documents, or official submission guidelines.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <CohortMessageItemView
              key={msg.id}
              message={msg}
              onReport={handleOpenReport}
              onBlock={handleBlockUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Message Input Bar */}
      <div className="p-3 bg-surface border-t border-border">
        <form onSubmit={handleSendMessage} className="space-y-1.5">
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                !cohort.is_member
                  ? "Join this cohort to post messages..."
                  : cohort.is_closed
                  ? "This cohort is closed for posting."
                  : cohort.member_count < 2
                  ? "Chat unlocks when at least two members join..."
                  : !cohort.rules_accepted
                  ? "Accept community rules to send messages..."
                  : "Type a message... (Enter to send, Shift+Enter for new line)"
              }
              disabled={
                !cohort.is_member ||
                cohort.is_closed ||
                cohort.member_count < 2 ||
                !cohort.rules_accepted ||
                sending
              }
              maxLength={1000}
              className="flex-1 min-h-[44px] max-h-24 p-2.5 text-xs bg-surface-2 border border-border rounded-md focus:outline-none focus:border-teal resize-none placeholder:text-muted disabled:opacity-60 disabled:cursor-not-allowed text-ink"
            />
            <Button
              type="submit"
              disabled={
                !inputValue.trim() ||
                !cohort.is_member ||
                cohort.is_closed ||
                cohort.member_count < 2 ||
                !cohort.rules_accepted ||
                sending
              }
              className="h-auto px-4 bg-teal hover:bg-teal-hover text-white disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>{sending ? "Sending..." : "Send"}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted px-1">
            <span>Text only • 10 messages per minute max</span>
            <span
              className={cn(
                inputValue.length > 900 ? "text-amber font-medium" : ""
              )}
            >
              {inputValue.length} / 1000
            </span>
          </div>
        </form>
      </div>

      {/* Rules Acceptance Dialog */}
      <RulesDialog
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        onAccept={handleAcceptRules}
        loading={acceptingRules}
      />

      {/* Message Report Dialog */}
      <ReportDialog
        open={reportState.open}
        onOpenChange={(open) =>
          setReportState((prev) => ({ ...prev, open }))
        }
        messageId={reportState.messageId}
        messageAuthor={reportState.author}
        messageSnippet={reportState.snippet}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}
