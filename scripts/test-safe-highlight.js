import { escapeHtml } from "../js/ui.js";

function safeHighlightTerms(text, tokens = []) {
  if (!text) return "";
  if (!tokens || tokens.length === 0) return escapeHtml(text);

  const cleanTokens = tokens
    .map(t => t.trim())
    .filter(t => t.length > 1 || t === "c" || t === "r")
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (cleanTokens.length === 0) return escapeHtml(text);

  const regex = new RegExp(`(\\b(?:${cleanTokens.join("|")})\\b)`, "gi");
  const parts = String(text).split(regex);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        return `<mark class="highlight-match">${escapeHtml(part)}</mark>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

console.log("Safe AT&T with amp query:", safeHighlightTerms("AT&T Bell Labs", ["amp"]));
console.log("Safe match of bell:", safeHighlightTerms("AT&T Bell Labs", ["bell"]));
console.log("Safe match of c:", safeHighlightTerms("The C Programming Language <script>", ["c"]));

