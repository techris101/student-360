import React from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

export interface MessageProps {
  role: "user" | "assistant";
  content: string;
}

/**
 * Formats inline markdown text, converting [Title](/opportunities/{id}) into compact inline rows
 */
function renderFormattedContent(text: string) {
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Split content by paragraphs
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        // Check for bullet lists
        const lines = para.split("\n");
        const isList = lines.length > 1 && lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* ") || /^\d+\.\s/.test(l.trim()));

        if (isList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[-*]\s+|\d+\.\s+/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-sm text-[var(--ink)] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] mt-2 shrink-0" />
                    <span className="flex-1">{parseInlineLinks(cleaned, linkRegex)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-sm leading-relaxed whitespace-pre-wrap">
            {parseInlineLinks(para, linkRegex)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineLinks(text: string, linkRegex: RegExp) {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  linkRegex.lastIndex = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const matchIndex = match.index;

    // Text before link
    if (matchIndex > lastIndex) {
      elements.push(parseBoldText(text.slice(lastIndex, matchIndex), `txt-${lastIndex}`));
    }

    // Is it an opportunity link?
    if (url.startsWith("/opportunities/") || url.includes("/opportunities/")) {
      const oppUrl = url.startsWith("http") ? new URL(url).pathname : url;
      elements.push(
        <Link
          key={`opp-${matchIndex}`}
          href={oppUrl}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 my-0.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[4px] text-xs font-medium text-[var(--ink)] hover:text-[var(--teal)] hover:border-[var(--teal)] transition-colors align-middle"
        >
          <Compass className="w-3.5 h-3.5 text-[var(--teal)] shrink-0" strokeWidth={1.5} />
          <span>{linkText}</span>
        </Link>
      );
    } else {
      elements.push(
        <a
          key={`link-${matchIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--teal)] underline hover:text-[#0c5945] font-medium"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Trailing text
  if (lastIndex < text.length) {
    elements.push(parseBoldText(text.slice(lastIndex), `txt-${lastIndex}`));
  }

  return elements.length > 0 ? elements : parseBoldText(text, "plain");
}

function parseBoldText(text: string, keyPrefix: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;

  return (
    <React.Fragment key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className="font-semibold text-[var(--ink)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </React.Fragment>
  );
}

export function MessageItem({ role, content }: MessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[8px] bg-[var(--surface-2)] text-[var(--ink)] px-4 py-3 text-sm leading-relaxed border border-[var(--line)]">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant message: plain text on page background (no bubble) per DESIGN.md
  return (
    <div className="flex justify-start">
      <div className="w-full text-[var(--ink)] py-1">
        {renderFormattedContent(content)}
      </div>
    </div>
  );
}
