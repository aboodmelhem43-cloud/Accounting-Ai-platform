"use client";

import { Fragment } from "react";

function parseInline(text: string, keyPrefix: string): React.ReactNode {
  const segments: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith("**")) {
      segments.push(<strong key={`${keyPrefix}-b${i}`}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      segments.push(<em key={`${keyPrefix}-i${i}`}>{m.slice(1, -1)}</em>);
    } else {
      segments.push(
        <code key={`${keyPrefix}-c${i}`} className="bg-gray-200 px-1 rounded text-xs font-mono">
          {m.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
    i++;
  }

  if (lastIndex < text.length) segments.push(text.slice(lastIndex));
  if (segments.length === 0) return null;
  if (segments.length === 1) return segments[0];
  return <Fragment>{segments}</Fragment>;
}

export default function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(
        <h5 key={i} className="font-bold text-sm mt-3 mb-1">
          {parseInline(line.slice(4), `h${i}`)}
        </h5>
      );
      i++;
    } else if (line.startsWith("## ")) {
      elements.push(
        <h4 key={i} className="font-bold text-sm mt-3 mb-1">
          {parseInline(line.slice(3), `h${i}`)}
        </h4>
      );
      i++;
    } else if (line.startsWith("# ")) {
      elements.push(
        <h3 key={i} className="font-bold text-base mt-3 mb-1">
          {parseInline(line.slice(2), `h${i}`)}
        </h3>
      );
      i++;
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("• "))) {
        items.push(
          <li key={i} className="ms-4">
            {parseInline(lines[i].slice(2), `li${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul${i}`} className="list-disc list-inside space-y-0.5 my-1">
          {items}
        </ul>
      );
    } else if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const text = lines[i].replace(/^\d+\. /, "");
        items.push(<li key={i}>{parseInline(text, `oli${i}`)}</li>);
        i++;
      }
      elements.push(
        <ol key={`ol${i}`} className="list-decimal list-inside space-y-0.5 my-1">
          {items}
        </ol>
      );
    } else if (line.trim() === "") {
      if (elements.length > 0) {
        elements.push(<div key={i} className="h-1" />);
      }
      i++;
    } else {
      elements.push(
        <p key={i} className="leading-relaxed">
          {parseInline(line, `p${i}`)}
        </p>
      );
      i++;
    }
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>;
}
