const MAX_REDIRECTS = 3;

export class SafeFetchError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function allowedHosts() {
  return (process.env.OG_FETCH_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function validateUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SafeFetchError("Invalid URL");
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new SafeFetchError("Only credential-free HTTPS URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const hosts = allowedHosts();
  const allowed = hosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );
  if (!allowed) {
    throw new SafeFetchError("URL host is not allowed", 403);
  }
  return url;
}

export async function safeFetch(value: string, timeoutMs = 5000) {
  let url = validateUrl(value);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "FlooyStudioMetadataBot/1.0" },
    });

    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get("location");
    if (!location || redirects === MAX_REDIRECTS) {
      throw new SafeFetchError("Too many redirects", 502);
    }
    url = validateUrl(new URL(location, url).toString());
  }

  throw new SafeFetchError("Unable to fetch URL", 502);
}

export async function readLimited(response: Response, maxBytes: number) {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > maxBytes) throw new SafeFetchError("Upstream response is too large", 413);
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new SafeFetchError("Upstream response is too large", 413);
    }
    chunks.push(value);
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
