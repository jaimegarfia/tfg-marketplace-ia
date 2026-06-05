"use client";

import type { ReactNode } from "react";

type MarkdownSegment =
  | { kind: "code"; content: string; language?: string }
  | { kind: "text"; content: string };

function splitMarkdownSegments(source: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const fence = /```([^\n`]*)\r?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index);
    if (before.trim()) {
      segments.push({ kind: "text", content: before });
    }
    segments.push({
      kind: "code",
      language: match[1]?.trim() || undefined,
      content: match[2]?.replace(/\n$/, "") ?? "",
    });
    lastIndex = match.index + match[0].length;
  }

  const tail = source.slice(lastIndex);
  if (tail.trim()) {
    segments.push({ kind: "text", content: tail });
  }

  if (segments.length === 0 && source.trim()) {
    segments.push({ kind: "text", content: source });
  }

  return segments;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <span key={`${keyPrefix}-text-${index}`} className="text-zinc-300">
          {text.slice(last, match.index)}
        </span>,
      );
    }

    const token = match[0];
    if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const label = linkMatch?.[1] ?? token;
      const href = linkMatch?.[2] ?? "#";
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-400 underline decoration-emerald-400/30 underline-offset-2 transition hover:text-emerald-300"
        >
          {label}
        </a>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300/90"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong
          key={`${keyPrefix}-bold-${index}`}
          className="font-semibold text-zinc-200"
        >
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em key={`${keyPrefix}-em-${index}`} className="text-zinc-300">
          {token.slice(1, -1)}
        </em>,
      );
    }

    last = match.index + token.length;
    index += 1;
  }

  if (last < text.length) {
    nodes.push(
      <span key={`${keyPrefix}-tail`} className="text-zinc-300">
        {text.slice(last)}
      </span>,
    );
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderTextBlock(content: string): ReactNode {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let lineIndex = 0;
  let blockIndex = 0;

  const pushBlock = (node: ReactNode) => {
    blocks.push(
      <div key={`block-${blockIndex}`} className={blockIndex > 0 ? "mt-5" : ""}>
        {node}
      </div>,
    );
    blockIndex += 1;
  };

  while (lineIndex < lines.length) {
    const line = lines[lineIndex] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      lineIndex += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 3;
      const title = headingMatch[2] ?? "";
      const className =
        level === 1
          ? "text-base font-semibold text-neutral-100"
          : level === 2
            ? "text-sm font-semibold text-neutral-100"
            : "text-sm font-medium text-zinc-200";
      pushBlock(
        <h4 className={`${className} mb-1`}>
          {renderInline(title, `h-${lineIndex}`)}
        </h4>,
      );
      lineIndex += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (lineIndex < lines.length) {
        const current = (lines[lineIndex] ?? "").trim();
        const itemMatch = current.match(/^[-*]\s+(.+)$/);
        if (!itemMatch) break;
        items.push(itemMatch[1] ?? "");
        lineIndex += 1;
      }
      pushBlock(
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-zinc-500">
          {items.map((item, itemIndex) => (
            <li key={`li-${lineIndex}-${itemIndex}`} className="text-zinc-300">
              {renderInline(item, `li-${lineIndex}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (lineIndex < lines.length) {
        const current = (lines[lineIndex] ?? "").trim();
        const itemMatch = current.match(/^\d+\.\s+(.+)$/);
        if (!itemMatch) break;
        items.push(itemMatch[1] ?? "");
        lineIndex += 1;
      }
      pushBlock(
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed marker:text-zinc-500">
          {items.map((item, itemIndex) => (
            <li key={`ol-${lineIndex}-${itemIndex}`} className="text-zinc-300">
              {renderInline(item, `ol-${lineIndex}-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    lineIndex += 1;
    while (lineIndex < lines.length) {
      const next = (lines[lineIndex] ?? "").trim();
      if (
        !next ||
        /^#{1,3}\s+/.test(next) ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      lineIndex += 1;
    }

    pushBlock(
      <p className="text-sm leading-relaxed text-zinc-300">
        {renderInline(paragraphLines.join(" "), `p-${lineIndex}`)}
      </p>,
    );
  }

  return <div>{blocks}</div>;
}

function shouldShowCodeLanguage(language: string | undefined): boolean {
  if (!language?.trim()) return false;
  const normalized = language.trim().toLowerCase();
  return normalized !== "markdown" && normalized !== "md";
}

interface DeveloperGuideMarkdownProps {
  content: string;
  className?: string;
}

export function DeveloperGuideMarkdown({
  content,
  className = "prose prose-invert prose-sm max-w-none",
}: DeveloperGuideMarkdownProps) {
  const segments = splitMarkdownSegments(content);

  return (
    <div className={`${className} space-y-6`}>
      {segments.map((segment, index) =>
        segment.kind === "code" ? (
          <div key={`code-${index}`} className="not-prose space-y-2 pt-1">
            {shouldShowCodeLanguage(segment.language) && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                {segment.language}
              </p>
            )}
            <pre className="overflow-x-auto rounded-lg border border-zinc-800/50 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-400">
              {segment.content}
            </pre>
          </div>
        ) : (
          <div key={`text-${index}`} className="leading-relaxed">
            {renderTextBlock(segment.content)}
          </div>
        ),
      )}
    </div>
  );
}
