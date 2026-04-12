import JSZip from "jszip";

export interface ParseResult {
  title: string;
  text: string;
  html: string;
}

function extractTextFromXml(xmlContent: string): string {
  // Extract text from <hp:t> tags
  const textMatches = xmlContent.matchAll(/<hp:t[^>]*>([^<]*)<\/hp:t>/g);
  const texts: string[] = [];
  for (const match of textMatches) {
    const t = match[1].trim();
    if (t) texts.push(t);
  }
  return texts.join(" ");
}

function xmlToHtml(xmlContent: string): string {
  const lines: string[] = [];

  // Extract paragraphs (hp:p)
  const paraMatches = xmlContent.matchAll(/<hp:p[^>]*>([\s\S]*?)<\/hp:p>/g);
  for (const para of paraMatches) {
    const paraXml = para[1];

    // Check if this paragraph is inside a table cell — handled separately
    const texts: string[] = [];
    const tMatches = paraXml.matchAll(/<hp:t[^>]*>([^<]*)<\/hp:t>/g);
    for (const t of tMatches) {
      const txt = t[1].trim();
      if (txt) texts.push(txt);
    }
    if (texts.length > 0) {
      lines.push(`<p>${escapeHtml(texts.join(" "))}</p>`);
    }
  }

  // Extract tables (hp:tbl)
  const tableMatches = xmlContent.matchAll(/<hp:tbl[^>]*>([\s\S]*?)<\/hp:tbl>/g);
  for (const tbl of tableMatches) {
    const tblXml = tbl[1];
    let tableHtml = '<table class="border-collapse w-full my-2">';
    const rowMatches = tblXml.matchAll(/<hp:tr[^>]*>([\s\S]*?)<\/hp:tr>/g);
    for (const row of rowMatches) {
      tableHtml += "<tr>";
      const cellMatches = row[1].matchAll(/<hp:tc[^>]*>([\s\S]*?)<\/hp:tc>/g);
      for (const cell of cellMatches) {
        const cellTexts: string[] = [];
        const ctMatches = cell[1].matchAll(/<hp:t[^>]*>([^<]*)<\/hp:t>/g);
        for (const ct of ctMatches) {
          const txt = ct[1].trim();
          if (txt) cellTexts.push(txt);
        }
        tableHtml += `<td class="border border-gray-300 px-2 py-1 text-sm">${escapeHtml(cellTexts.join(" "))}</td>`;
      }
      tableHtml += "</tr>";
    }
    tableHtml += "</table>";
    lines.push(tableHtml);
  }

  return lines.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function parseHwpx(buffer: Buffer): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(buffer);

  const allText: string[] = [];
  const allHtml: string[] = [];
  let title = "가정통신문";

  // Parse header for document title
  const headerFile = zip.file("header.xml");
  if (headerFile) {
    const headerXml = await headerFile.async("text");
    const titleMatch = headerXml.match(/<hp:title[^>]*>([^<]+)<\/hp:title>/);
    if (titleMatch) title = titleMatch[1].trim();
  }

  // Parse section files in order
  let sectionIdx = 0;
  while (true) {
    const sectionFile =
      zip.file(`Contents/section${sectionIdx}.xml`) ??
      zip.file(`contents/section${sectionIdx}.xml`);

    if (!sectionFile) break;

    const xmlContent = await sectionFile.async("text");
    allText.push(extractTextFromXml(xmlContent));
    allHtml.push(xmlToHtml(xmlContent));
    sectionIdx++;
  }

  if (allText.length === 0) {
    throw new Error(
      "HWPX 파일을 파싱할 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식입니다."
    );
  }

  const text = allText.join("\n\n");
  // Use first non-empty paragraph as title if not found in header
  if (title === "가정통신문") {
    const firstPara = text.split("\n").find((l) => l.trim().length > 2);
    if (firstPara) title = firstPara.trim().slice(0, 50);
  }

  const html = `<div class="document-content">${allHtml.join("\n")}</div>`;

  return { title, text, html };
}
