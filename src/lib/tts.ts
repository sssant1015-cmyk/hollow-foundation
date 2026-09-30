/**
 * JARVIS voice engine — Web Speech API wrapper.
 *
 * Goal: a calm, refined, slightly deep British male voice (movie JARVIS).
 * No network, no keys, no deps — speaks through the OS/browser TTS engine.
 * On Android this resolves to "Google UK English Male" when installed
 * (it ships with Google TTS), falling back through a preference ladder.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Kick voice-list loading early (Chrome populates getVoices() asynchronously).
if (ttsSupported()) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = null; // re-pick once the full list arrives
    };
  } catch {
    // ignore — speech stays optional
  }
}

function getVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  try {
    return window.speechSynthesis.getVoices();
  } catch {
    return [];
  }
}

const FEMALE_HINT =
  /female|hazel|kate|serena|emma|charlotte|sonia|libby|clara|amy|zira|susan|linda|heather|samantha|victoria|karen|moira|tessa|fiona|stephanie/i;
const MALE_HINT = /male|daniel|george|ryan|arthur|oliver|gordon|james|david|guy|mark|alex|fred|tom|paul/i;

/**
 * Voice ladder — first match wins:
 *  1. Google UK English Male (exact)            — Android/Chrome, true RP male
 *  2. Daniel (Apple's classic British male)     — macOS/iOS
 *  3. en-GB male-named (George, Ryan, Arthur…)
 *  4. any en-GB that is not obviously female
 *  5. en-US male-named (David, Guy, James…)
 *  6. any English voice that is not obviously female
 *  7. anything at all
 */
export function pickJARVISVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (voices.length === 0) return null;

  const en = (re: RegExp) => voices.filter((v) => re.test(v.lang));
  const byName = (pool: SpeechSynthesisVoice[], re: RegExp) => pool.find((v) => re.test(v.name));
  const notFemale = (pool: SpeechSynthesisVoice[]) => pool.find((v) => !FEMALE_HINT.test(v.name));

  const gb = en(/en-GB/i);
  const us = en(/en-US/i);
  const anyEn = en(/^en/i);

  return (
    byName(voices, /Google UK English Male/i) ??
    byName(voices, /^Daniel$/i) ??
    byName(gb, MALE_HINT) ??
    notFemale(gb) ??
    byName(us, MALE_HINT) ??
    notFemale(anyEn) ??
    voices[0]
  );
}

/** Strips markdown noise and shapes the text for a measured spoken cadence. */
function forSpeech(text: string): string {
  return text
    .replace(/[*_#`>]+/g, '')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/\b(\d{1,2})\/(\d{1,2})\b/g, '$1 of $2')
    .replace(/\s*\n\s*/g, '. ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

export function makeUtterance(text: string): SpeechSynthesisUtterance | null {
  if (!ttsSupported()) return null;
  const u = new SpeechSynthesisUtterance(forSpeech(text));

  if (!cachedVoice) cachedVoice = pickJARVISVoice();
  if (cachedVoice) u.voice = cachedVoice;
  else u.lang = 'en-GB'; // at least hint the accent if no voice list yet

  // JARVIS delivery: unhurried, composed, a register below normal.
  u.rate = 0.92;
  u.pitch = 0.7;
  u.volume = 1;
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
