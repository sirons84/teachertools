import type { ParseResult } from "./hwpx-parser";

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // pdf-parse uses require() internally and has CJS-only exports
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);

  const text: string = data.text ?? "";
  const title =
    (data.info?.Title as string | undefined) ||
    text.split("\n").find((l) => l.trim().length > 2)?.trim().slice(0, 50) ||
    "가정통신문";

  // Convert plain text to basic HTML paragraphs
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  const html = `<div class="document-content">${paragraphs}</div>`;

  return { title, text, html };
}
