"use client";

import React from "react";
import { MoreHorizontal, Flag, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CohortMessageItem } from "@/lib/cohorts/types";

interface MessageItemProps {
  message: CohortMessageItem;
  onReport: (messageId: string, author: string, snippet: string) => void;
  onBlock: (userId: string, author: string) => void;
}

export function CohortMessageItemView({
  message,
  onReport,
  onBlock,
}: MessageItemProps) {
  const { id, user_id, first_name, university_name, programme, body, created_at, is_own } =
    message;

  const timeString = new Date(created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "group relative flex flex-col max-w-[85%] sm:max-w-[75%]",
        is_own ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      {/* Header metadata: First Name, University & Programme */}
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] mb-1 px-1",
          is_own ? "text-right flex-row-reverse" : "text-left"
        )}
      >
        <span className="font-semibold text-ink">
          {is_own ? "You" : first_name}
        </span>
        <span className="text-muted">•</span>
        <span className="text-muted truncate max-w-[200px]" title={`${programme}, ${university_name}`}>
          {programme} ({university_name})
        </span>
        <span className="text-muted">•</span>
        <span className="text-muted whitespace-nowrap">{timeString}</span>
      </div>

      {/* Message bubble / container */}
      <div
        className={cn(
          "relative rounded-md px-3.5 py-2 text-xs leading-relaxed border transition-colors",
          is_own
            ? "bg-teal-subtle text-ink border-teal/20"
            : "bg-surface-2 text-ink border-border hover:border-border"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{body}</p>

        {/* Message Actions Menu (for other members' messages) */}
        {!is_own && (
          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-surface-3 text-muted hover:text-ink transition-colors"
                  aria-label="Message options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuItem
                  onClick={() => onReport(id, first_name, body)}
                  className="text-red focus:text-red gap-2 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report message</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onBlock(user_id, first_name)}
                  className="text-muted hover:text-ink gap-2 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block {first_name}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
