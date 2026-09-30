/**
 * JARVIS voice engine — three-tier text-to-speech.
 *
 * Tier 1 (native, Android app): @capacitor-community/text-to-speech drives the
 * phone's actual TTS engine (Google TTS) directly — real en-GB voices, works
 * offline, immune to WebView speechSynthesis bugs. This is the reliable path.
 *
 * Tier 2 (network): Google Translate TTS (tl=en-gb) MP3 chunks played through
 * Audio() elements — smooth British male in any browser, no system voices needed.
 *
 * Tier 3 (fallback): Web Speech API with a British-male voice ladder.
 *
 * speakReply() tries tiers in order and automatically falls through on failure.
 */

import { Capacitor } from '@capacitor/core';

type NativeTTS = {
  speak(options: {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    category?: string;
  }): Promise<void>;
  stop(): Promise<void>;
  setLanguage(options: { lang: string }): Promise<{ name: string }>;
  supportedVoices(): Promise<{ id: string; name: string; lang: string }[]>;
};

let nativeTTS: NativeTTS | null = null;
try {
  // Registered only when running inside the native app (not the web build).
  if (Capacitor.isNativePlatform()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeTTS = (Capacitor as unknown as { plugins: { TextToSpeech: NativeTTS } }).plugins.TextToSpeech;
  }
} catch {
  nativeTTS = null;
}

// ─── Text shaping ─────────────────────────────────────────────────────────────

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
    .slice(0, 900);
}

/** Splits text into <=max-char chunks at sentence (then word) boundaries. */
function chunkText(text: string, max = 180): string[] {
  const chunks: string[] = [];
  let cur = '';
  const pushWordwise = (s: string) => {
    let piece = '';
    for (const w of s.split(/\s+/)) {
      if (!piece) piece = w;
      else if (piece.length + 1 + w.length <= max) piece += ' ' + w;
      else {
        chunks.push(piece);
        piece = w;
      }
    }
    return piece;
  };
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!sentence) continue;
    if (cur.length + 1 + sentence.length <= max) {
      cur = cur ? cur + ' ' + sentence : sentence;
    } else {
      if (cur) chunks.push(cur);
      cur = sentence.length <= max ? sentence : pushWordwise(sentence);
    }
  }
  if (cur) chunks.push(cur);
  return chunks.filter(Boolean);
}

// ─── Tier 1: native Android/iOS TTS ───────────────────────────────────────────

let nativeReady: boolean | null = null;

async function nativeSpeak(text: string): Promise<void> {
  if (!nativeTTS) throw new Error('native tts unavailable');
  const clean = forSpeech(text);
  if (!clean) throw new Error('empty text');

  if (nativeReady === null) {
    try {
      const voices = await nativeTTS.supportedVoices();
      // Prefer a British voice if the engine offers one.
      const gb = voices.find((v) => /en[-_]GB/i.test(v.lang) && !/female|kate|serena/i.test(v.name));
      nativeReady = true;
      if (gb) await nativeTTS.setLanguage({ lang: gb.lang });
    } catch {
      nativeReady = true; // engine exists even if voice enumeration fails
    }
  }
  await nativeTTS.speak({
    text: clean,
    lang: 'en-GB',
    rate: 0.94,
    pitch: 0.85,
    volume: 1.0,
  });
}

// ─── Tier 2: network voice (Google Translate TTS, en-GB) ──────────────────────

let currentAudio: HTMLAudioElement | null = null;
let networkStopped = false;

function networkSpeak(text: string, onDone: () => void, onFail: (reason: unknown) => void): void {
  networkStopped = false;
  const chunks = chunkText(forSpeech(text));
  if (chunks.length === 0) {
    onDone();
    return;
  }
  let i = 0;
  const playNext = () => {
    if (networkStopped || i >= chunks.length) {
      onDone();
      return;
    }
    const q = encodeURIComponent(chunks[i++]);
    const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-gb&q=${q}`);
    currentAudio = audio;
    audio.onended = playNext;
    audio.onerror = () => {
      if (!networkStopped) onFail('network voice unavailable');
    };
    audio.play().catch((e) => {
      if (!networkStopped) onFail(e);
    });
  };
  playNext();
}

// ─── Tier 3: Web Speech API fallback with JARVIS voice ladder ────────────────

let cachedVoice: SpeechSynthesisVoice | null = null;

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

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

function synthSpeak(text: string): void {
  if (!ttsSupported()) return;
  const u = new SpeechSynthesisUtterance(forSpeech(text));
  if (!cachedVoice) cachedVoice = pickJARVISVoice();
  if (cachedVoice) u.voice = cachedVoice;
  else u.lang = 'en-GB';
  // JARVIS delivery: unhurried, composed, a register below normal.
  u.rate = 0.92;
  u.pitch = 0.7;
  u.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Speaks a reply: native TTS → network voice → local synthesis, auto-falling. */
export function speakReply(text: string): void {
  // Tier 1 — native engine (the reliable path inside the Android app).
  if (nativeTTS) {
    nativeSpeak(text).catch(() => {
      networkSpeak(text, () => {}, () => synthSpeak(text));
    });
    return;
  }
  // Tier 2 — network voice in browsers.
  networkSpeak(
    text,
    () => {},
    () => synthSpeak(text),
  );
}

/** Stops any spoken audio (all tiers). */
export function stopSpeaking(): void {
  networkStopped = true;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (nativeTTS) {
    nativeTTS.stop().catch(() => {});
  }
  if (ttsSupported()) window.speechSynthesis.cancel();
}
