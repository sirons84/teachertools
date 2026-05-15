// 외부 링크 미리보기: YouTube/Vimeo는 oEmbed, 그 외는 OpenGraph

export interface EmbedPreview {
  type: "video" | "link";
  url: string;
  title: string | null;
  thumbnail: string | null;
  provider: string | null;
  html: string | null;
}

const YT_OEMBED = "https://www.youtube.com/oembed";
const VIMEO_OEMBED = "https://vimeo.com/api/oembed.json";

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isYouTube(host: string): boolean {
  return host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com";
}

function isVimeo(host: string): boolean {
  return host === "vimeo.com" || host === "player.vimeo.com";
}

async function fetchOEmbed(endpoint: string, target: string): Promise<EmbedPreview | null> {
  const u = `${endpoint}?url=${encodeURIComponent(target)}&format=json`;
  try {
    const res = await fetch(u, {
      headers: { "user-agent": "Mozilla/5.0 (teachertools-padlet)" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      provider_name?: string;
      html?: string;
    };
    return {
      type: "video",
      url: target,
      title: data.title ?? null,
      thumbnail: data.thumbnail_url ?? null,
      provider: data.provider_name ?? null,
      html: data.html ?? null,
    };
  } catch {
    return null;
  }
}

function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

async function fetchOpenGraph(target: string): Promise<EmbedPreview | null> {
  try {
    const res = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (teachertools-padlet)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return null;
    // 최대 64KB만 읽음
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    const LIMIT = 65536;
    while (total < LIMIT) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= LIMIT) break;
    }
    try { await reader.cancel(); } catch { /* ignore */ }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      buf.set(c.subarray(0, Math.min(c.byteLength, LIMIT - offset)), offset);
      offset += c.byteLength;
      if (offset >= LIMIT) break;
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);

    const ogTitle = extractMeta(html, "og:title") || extractTitle(html);
    const ogImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
    const ogSite = extractMeta(html, "og:site_name");
    const host = hostnameOf(target);

    if (!ogTitle && !ogImage) {
      // 정말 아무것도 없으면 호스트명이라도 반환
      return {
        type: "link",
        url: target,
        title: host,
        thumbnail: null,
        provider: host,
        html: null,
      };
    }
    return {
      type: "link",
      url: target,
      title: ogTitle ?? host,
      thumbnail: ogImage ? new URL(ogImage, target).toString() : null,
      provider: ogSite ?? host,
      html: null,
    };
  } catch {
    return null;
  }
}

export async function getEmbedPreview(rawUrl: string): Promise<EmbedPreview> {
  const url = rawUrl.trim();
  const parsed = (() => {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      return u;
    } catch {
      return null;
    }
  })();
  if (!parsed) throw new Error("유효한 URL이 아닙니다.");

  const host = parsed.hostname.replace(/^www\./, "");

  if (isYouTube(host)) {
    const r = await fetchOEmbed(YT_OEMBED, url);
    if (r) return r;
  }
  if (isVimeo(host)) {
    const r = await fetchOEmbed(VIMEO_OEMBED, url);
    if (r) return r;
  }

  const og = await fetchOpenGraph(url);
  if (og) return og;

  return {
    type: "link",
    url,
    title: host,
    thumbnail: null,
    provider: host,
    html: null,
  };
}
