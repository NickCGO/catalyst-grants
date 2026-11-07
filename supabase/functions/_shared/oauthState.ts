export type ConnectionState = { provider: string; org_id: string; user_id: string; origin: string; return_to: string; nonce: string; exp: number };
const origins = new Set(["https://www.findthegrant.com", "https://findthegrant.com", "https://catalyst-grants.lovable.app", "https://grant-match.app", "https://id-preview--30ccbbb5-5668-4e77-90d0-17995f092aeb.lovable.app", "http://localhost:8080"]);
export function safeOrigin(value: unknown) {
  if (typeof value !== "string" || !origins.has(value)) throw new Error("Invalid app origin");
  return value;
}
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string" || !/^\/settings(?:\?[^#]*)?$/.test(value) || /[\\<>"'\s]/.test(value)) return "/settings";
  return value;
}
function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function decode(text: string) { return Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)); }
async function key(secret: string) {
  if (secret.length < 32) throw new Error("State signing unavailable");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function signState(state: ConnectionState, secret: string) {
  const payload = encode(new TextEncoder().encode(JSON.stringify(state)));
  const signature = await crypto.subtle.sign("HMAC", await key(secret), new TextEncoder().encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}
export async function verifyState(raw: string, provider: string, secret: string, now = Date.now()): Promise<ConnectionState> {
  const [payload, signature, extra] = raw.split(".");
  if (!payload || !signature || extra || raw.length > 4096 || !await crypto.subtle.verify("HMAC", await key(secret), decode(signature), new TextEncoder().encode(payload))) throw new Error("Invalid state");
  const state = JSON.parse(new TextDecoder().decode(decode(payload)));
  if (state.provider !== provider || typeof state.exp !== "number" || state.exp <= now || state.exp > now + 600000 || ![state.org_id, state.user_id, state.nonce].every(v => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v))) throw new Error("Invalid or expired state");
  safeOrigin(state.origin);
  if (safeReturnPath(state.return_to) !== state.return_to) throw new Error("Invalid return destination");
  return state;
}