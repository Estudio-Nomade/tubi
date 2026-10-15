/**
 * Detect phone / off-platform contact patterns in chat (anti-bypass).
 */

const PHONE_RE =
  /(?:\+?54\s*)?(?:9\s*)?(?:\d[\s\-.]*){8,}/;
const WHATSAPP_RE =
  /whats\s*app|wsp|watsap|telegram|te\s*mando\s*al|pasame\s*(tu\s*)?(n[uú]mero|cel)/i;

export function flagsBypassAttempt(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (WHATSAPP_RE.test(t)) return true;
  if (PHONE_RE.test(t.replace(/\s/g, " "))) return true;
  return false;
}

/** Soft redaction for display (does not replace storage of flagged flag). */
export function redactBypassContent(text: string): string {
  if (!flagsBypassAttempt(text)) return text;
  return "[mensaje oculto: no compartas teléfonos ni WhatsApp por fuera de Tubi]";
}
