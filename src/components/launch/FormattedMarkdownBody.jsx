import React from "react";

/**
 * FormattedMarkdownBody
 * Flawlessly renders markdown-formatted email and chat messages without raw syntax.
 * Converts bold (**text**), italics (*text*), headers (### text), lists (• / - / 1.),
 * links ([text](url)), and cleanly separates internal studio tracking tokens.
 */
export default function FormattedMarkdownBody({ text = "", className = "", showRefTag = true }) {
  if (!text || typeof text !== "string") return null;

  // 1. Extract internal tracking tokens (Ref: [CF-STAGE:...])
  let content = text;
  let refToken = null;

  const refMatch = content.match(/(?:---\s*)?Ref:\s*(\[[^\]]+\])/i);
  if (refMatch) {
    refToken = refMatch[1];
    content = content.replace(refMatch[0], "").trim();
  }

  // Also catch stray [CF-STAGE:...]
  const cfMatch = content.match(/(\[CF-[^\]]+\])/);
  if (cfMatch && !refToken) {
    refToken = cfMatch[1];
    content = content.replace(cfMatch[0], "").trim();
  }

  content = content.replace(/---\s*$/, "").trim();

  // Helper to parse inline styles (bold, italics, links, code)
  const renderInline = (str) => {
    if (!str) return null;

    // Tokenize string for links, bold, italics, and code
    // Patterns:
    // [text](url)
    // **bold**
    // *italic*
    // `code`
    // bare url
    const tokens = [];
    let remaining = str;
    let keyIdx = 0;

    // Regex matching markdown link, bold, italic, code, or bare URL
    const inlineRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(https?:\/\/[^\s<]+)/;

    while (remaining) {
      const match = remaining.match(inlineRegex);
      if (!match) {
        tokens.push(<React.Fragment key={keyIdx++}>{remaining}</React.Fragment>);
        break;
      }

      const matchIdx = match.index;
      if (matchIdx > 0) {
        tokens.push(
          <React.Fragment key={keyIdx++}>
            {remaining.substring(0, matchIdx)}
          </React.Fragment>
        );
      }

      const [fullMatch, linkText, linkUrl, boldText, italicText, codeText, bareUrl] = match;

      if (linkText && linkUrl) {
        tokens.push(
          <a
            key={keyIdx++}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2 transition-colors"
          >
            {linkText}
          </a>
        );
      } else if (boldText) {
        const cleanBold = boldText.slice(2, -2);
        tokens.push(
          <strong key={keyIdx++} className="font-bold text-white">
            {renderInline(cleanBold)}
          </strong>
        );
      } else if (italicText) {
        const cleanItalic = italicText.slice(1, -1);
        tokens.push(
          <em key={keyIdx++} className="italic text-slate-200">
            {renderInline(cleanItalic)}
          </em>
        );
      } else if (codeText) {
        const cleanCode = codeText.slice(1, -1);
        tokens.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-white/[0.08] text-purple-300 font-mono text-[11px]"
          >
            {cleanCode}
          </code>
        );
      } else if (bareUrl) {
        tokens.push(
          <a
            key={keyIdx++}
            href={bareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2 break-all transition-colors"
          >
            {bareUrl}
          </a>
        );
      }

      remaining = remaining.substring(matchIdx + fullMatch.length);
    }

    return tokens;
  };

  // Preprocess text to ensure lists and headings are separated from preceding paragraphs
  const preprocessMarkdownContent = (raw) => {
    if (!raw) return "";
    const rawLines = raw.split("\n");
    const processed = [];
    const listMarkerRegex = /^(\s*)(?:[•\-\*]|\d+[.)])\s+/;
    const headingRegex = /^#{1,6}\s+/;
    let inList = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const stripped = line.trim();
      const isListItem = listMarkerRegex.test(stripped);
      const isHeading = headingRegex.test(stripped);

      if (isHeading && processed.length > 0 && processed[processed.length - 1].trim()) {
        processed.push("");
      }

      if (isListItem && !inList) {
        if (processed.length > 0 && processed[processed.length - 1].trim()) {
          processed.push("");
        }
        inList = true;
      } else if (!isListItem && inList && stripped) {
        processed.push("");
        inList = false;
      } else if (!stripped) {
        inList = false;
      }

      processed.push(line);
    }

    return processed.join("\n");
  };

  // Split into structural blocks (paragraphs, lists, headings, dividers)
  const blocks = preprocessMarkdownContent(content).split(/\n\s*\n/);

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Divider
        if (trimmed === "---") {
          return <hr key={bIdx} className="border-white/10 my-3" />;
        }

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={bIdx} className="text-sm font-bold text-white tracking-tight mt-2 mb-1">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={bIdx} className="text-base font-extrabold text-white tracking-tight mt-2.5 mb-1">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={bIdx} className="text-lg font-black text-white tracking-tight mt-3 mb-1">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        // Check if block is a list (all non-empty lines begin with bullet •/-/* or numbered item)
        const lines = trimmed.split("\n").filter((l) => Boolean(l.trim()));
        const isList = lines.length >= 1 && lines.every((l) => {
          const s = l.trim();
          return s.startsWith("•") || s.startsWith("-") || s.startsWith("*") || /^\d+[.)]/.test(s);
        });

        if (isList) {
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const s = line.trim();
                if (!s) return null;
                const cleanItem = s.replace(/^(?:[•\-*]|\d+[.)])\s*/, "").trim();
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                    <span className="text-purple-400 font-bold mt-0.5">•</span>
                    <span className="flex-1">{renderInline(cleanItem)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph (may contain linebreaks)
        return (
          <p key={bIdx} className="text-xs text-slate-200 leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}

      {/* Discrete Studio Reference Tag */}
      {showRefTag && refToken && (
        <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Tracking Ref:</span>
          <span className="text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.04]">
            {refToken}
          </span>
        </div>
      )}
    </div>
  );
}
