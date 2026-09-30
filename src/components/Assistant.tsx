import { useEffect, useRef, useState } from 'react';
import { actions, useStore } from '../store/store';
import { AIError, type ChatMessage } from '../ai/types';
import { MODELS, getModel, chatComplete } from '../ai/providers';
import { buildMessages } from '../ai/assistant';
import { cx } from './ui';
import { speakReply, stopSpeaking } from '../lib/tts';

interface UIMessage extends ChatMessage {
  id: string;
  error?: boolean;
}

const WELCOME: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Online. I see your full command deck — tasks, arc, money, training, learning.\n\nAsk for a status read, a plan for the day, or where you\'re falling behind.',
};

export function Assistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useStore((s) => s);
  const modelId = state.settings.aiModel;
  const [messages, setMessages] = useState<UIMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const model = getModel(modelId);
  const voiceOn = state.settings.aiVoiceOn;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const speak = (text: string) => {
    if (voiceOn && !text.startsWith('(')) speakReply(text);
  };

  useEffect(() => {
    if (voiceOn) speak(WELCOME.content);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);
    const userMsg: UIMessage = { id: `u${Date.now()}`, role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const history: ChatMessage[] = messages
      .filter((m) => m.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }));

    try {
      const result = await chatComplete(
        modelId,
        apiKeyFor(modelId),
        buildMessages(state, history, text),
        ctrl.signal,
      );
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', content: result.text }]);
      speak(result.text);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', content: '(stopped)' }]);
      } else {
        const msg = e instanceof AIError ? e.message : 'Something went wrong. Try again.';
        setMessages((m) => [...m, { id: `e${Date.now()}`, role: 'assistant', content: msg, error: true }]);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const apiKeyFor = (id: string): string | undefined => {
    const m = getModel(id);
    if (!m.keySetting) return undefined;
    return state.settings[m.keySetting] || undefined;
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60" onMouseDown={onClose} />}
      <aside
        className={cx(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-hollow-line bg-hollow-panel shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-hollow-line px-4 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-good" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white">JARVIS</div>
            <div className="truncate text-[11px] text-slate-500">{model.label}</div>
          </div>
          <button
            className="btn !px-2.5 !py-1.5 text-xs"
            onClick={() => setPickerOpen((v) => !v)}
            title="Switch model"
          >
            {model.family} ▾
          </button>
          <button
            className={cx('btn h-8 w-8 !p-0', voiceOn ? 'text-accent' : 'text-slate-500')}
            onClick={() => {
              stopSpeaking();
              actions.updateSettings({ aiVoiceOn: !voiceOn });
            }}
            title={voiceOn ? 'Mute JARVIS' : 'Let JARVIS speak replies aloud'}
            aria-label={voiceOn ? 'Disable voice' : 'Enable voice'}
          >
            {voiceOn ? '🔊' : '🔇'}
          </button>
          <button className="btn h-8 w-8 !p-0 text-slate-400" onClick={onClose} aria-label="Close assistant">✕</button>
        </header>

        {/* Model picker */}
        {pickerOpen && (
          <div className="border-b border-hollow-line bg-hollow-panel2 p-2">
            {MODELS.map((m) => {
              const active = m.id === modelId;
              const hasKey = m.keyless || !!apiKeyFor(m.id);
              return (
                <button
                  key={m.id}
                  className={cx(
                    'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left',
                    active ? 'bg-accent/15' : 'hover:bg-hollow-panel',
                  )}
                  onClick={() => {
                    actions.updateSettings({ aiModel: m.id });
                    setPickerOpen(false);
                  }}
                >
                  <span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', active ? 'bg-accent' : hasKey ? 'bg-good/60' : 'bg-slate-600')} />
                  <span className="min-w-0 flex-1">
                    <span className={cx('block text-sm font-medium', active ? 'text-accent' : 'text-slate-200')}>{m.label}</span>
                    <span className="block truncate text-[11px] text-slate-500">{m.blurb}</span>
                  </span>
                </button>
              );
            })}
            <p className="px-3 pb-1 pt-2 text-[11px] text-slate-600">
              Keyed models need a free API key — add it in Settings → AI Assistant.
            </p>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <div key={m.id} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cx(
                  'max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-br-sm bg-accent/15 text-slate-100'
                    : m.error
                      ? 'rounded-bl-sm border border-bad/30 bg-bad/10 text-bad'
                      : 'rounded-bl-sm border border-hollow-line bg-hollow-panel2 text-slate-200',
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-xl rounded-bl-sm border border-hollow-line bg-hollow-panel2 px-4 py-3">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && !busy && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {[
              ['Status', 'status report'],
              ['Plan today', 'plan my day'],
              ['Behind on', 'what am I behind on?'],
              ['Money', 'summarize my spending this week'],
            ].map(([label, prompt]) => (
              <button key={label} className="btn !py-1 text-[11px] text-slate-400" onClick={() => setInput(prompt)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <footer className="border-t border-hollow-line p-3">
          <div className="flex items-end gap-2">
            <textarea
              className="field max-h-32 min-h-[42px] flex-1 resize-none"
              placeholder={busy ? 'Thinking…' : 'Ask JARVIS…'}
              value={input}
              rows={1}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {busy ? (
              <button className="btn btn-danger !px-3" onClick={() => abortRef.current?.abort()} aria-label="Stop">
                ■
              </button>
            ) : (
              <button className="btn btn-primary !px-3.5" onClick={send} disabled={!input.trim()} aria-label="Send">
                ➤
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-600">
            Free models · your data goes only to the chosen provider · Enter to send
          </p>
        </footer>
      </aside>
    </>
  );
}
