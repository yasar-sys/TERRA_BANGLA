// Where is the app running? The managed sign-in broker route (/~oauth/initiate)
// only exists on Lovable-hosted surfaces. On any other host (Vercel, a custom
// server, a static export) that route 404s, so we must talk to the auth service
// directly instead.
const LOVABLE_ZONES = [
  "lovable.app",
  "lovableproject.com",
  "lovable.dev",
  "gptengineer.app",
  "gptengineer.run",
];

export function usesLovableAuthBroker(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return LOVABLE_ZONES.some((zone) => host === zone || host.endsWith("." + zone));
}

export function safeAuthNext(value: string | null | undefined): "/admin" | "/chat" {
  return value === "/admin" ? "/admin" : "/chat";
}
