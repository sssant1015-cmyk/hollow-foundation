/**
 * Minimal Web Speech API wrapper for JARVIS voice replies.
 *
 * Speaks through the OS/browser voice list; on Android this uses the system
 * TTS engine (Google TTS / Samsung TTS). No network, no keys, no deps.
 */

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Best available English voice, preferring deeper/male en voices when present. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const en = voices.filter((v) => v.lang.startsWith('en'));
  const pool = en.length > 0 ? en : voices;
  const preferred = pool.find((v) => /en-(GB|US)/i.test(v.lang) && /male|daniel|google|james|fred/i.test(v.name));
  return preferred ?? pool.find((v) => /en-(GB|US)/i.test(v.lang)) ?? pool[0];
}

export function makeUtterance(text: string): SpeechSynthesisUtterance | null {
  if (!ttsSupported()) return null;
  const clean = text.replace(/[*_#`]+/g, '').slice(0, 600);
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.95;
  u.pitch = 0.85;
  const v = pickVoice();
  if (v) u.voice = v;
  return u;
}

export function speak(utterance: SpeechSynthesisUtterance | null): void {
  if (!utterance || !ttsSupported()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}
