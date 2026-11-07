import DOMPurify from "dompurify";

export function sanitizeDocument(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "blockquote", "div", "span", "hr"],
    ALLOWED_ATTR: ["colspan", "rowspan"],
  });
}