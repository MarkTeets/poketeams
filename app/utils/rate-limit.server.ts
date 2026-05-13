type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function allowByIp(ip: string): boolean {
  return allow(`ip:${ip}`, 5, 10 * 60_000); // 5 requests per 10 min per IP
}

export function allowByEmail(email: string): boolean {
  return allow(`email:${email}`, 5, 60_000); // 5 request per 60s per email
}

// Requires hosting behind trusted proxy to get around spoofing
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}
