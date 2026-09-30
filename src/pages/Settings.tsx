import { actions, useStore } from '../store/store';
import { ConfirmButton, Field, PageHeader, Panel } from '../components/ui';
import { fmtDate, todayKey } from '../lib/dates';
import { DEFAULT_SETTINGS, STORAGE_KEY } from '../data/seed';

const THEMES: { value: 'dark' | 'midnight' | 'carbon'; label: string }[] = [
  { value: 'dark', label: 'Hollow Dark (default)' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'carbon', label: 'Carbon' },
];

export function SettingsPage() {
  const state = useStore((s) => s);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hollow-foundation-export-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Settings" sub="Preferences and data. Everything stays in this browser." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Profile">
          <div className="space-y-3 p-4">
            <Field label="Name">
              <input
                className="field"
                value={state.settings.name}
                onChange={(e) => actions.updateSettings({ name: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <select
                  className="field"
                  value={state.settings.currency}
                  onChange={(e) => actions.updateSettings({ currency: e.target.value })}
                >
                  {['JMD', 'USD', 'EUR', 'GBP', 'CAD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Weight unit">
                <select
                  className="field"
                  value={state.settings.weightUnit}
                  onChange={(e) => actions.updateSettings({ weightUnit: e.target.value as 'kg' | 'lb' })}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lb">Pounds (lb)</option>
                </select>
              </Field>
            </div>
            <Field label="Theme">
              <select
                className="field"
                value={state.settings.theme}
                onChange={(e) => actions.updateSettings({ theme: e.target.value as 'dark' | 'midnight' | 'carbon' })}
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title="Command Arc dates">
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <input
                  type="date"
                  className="field"
                  value={state.settings.arcStart}
                  onChange={(e) => actions.updateSettings({ arcStart: e.target.value || DEFAULT_SETTINGS.arcStart })}
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  className="field"
                  value={state.settings.arcEnd}
                  onChange={(e) => actions.updateSettings({ arcEnd: e.target.value || DEFAULT_SETTINGS.arcEnd })}
                />
              </Field>
            </div>
            <p className="text-xs text-slate-500">
              Default: {fmtDate(DEFAULT_SETTINGS.arcStart)} → {fmtDate(DEFAULT_SETTINGS.arcEnd)} (92 days). Phase boundaries on the
              Command Arc page follow the standard schedule; these dates control the overall countdown.
            </p>
            <Field label="Notifications">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--h-accent)]"
                  checked={state.settings.notifyDailyReview}
                  onChange={(e) => actions.updateSettings({ notifyDailyReview: e.target.checked })}
                />
                Remind me to complete the daily review
              </label>
            </Field>
            <Field>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--h-accent)]"
                  checked={state.settings.notifyWeeklyReview}
                  onChange={(e) => actions.updateSettings({ notifyWeeklyReview: e.target.checked })}
                />
                Remind me to complete the weekly review
              </label>
            </Field>
          </div>
        </Panel>
      </div>

      <Panel title="AI Assistant" className="mt-5">
        <div className="space-y-3 p-4">
          <Field label="Default model">
            <select
              className="field"
              value={state.settings.aiModel}
              onChange={(e) => actions.updateSettings({ aiModel: e.target.value })}
            >
              <option value="llm7-mistral">Mistral Nemo (free, no key)</option>
              <option value="llm7-deepseek">DeepSeek Flash (free, no key)</option>
              <option value="groq-llama">Llama 3.3 70B (Groq — free key)</option>
              <option value="gemini-flash">Gemini 2.0 Flash (free key)</option>
              <option value="openrouter-free">OpenRouter free tier</option>
            </select>
          </Field>
          <p className="text-xs text-slate-500">
            JARVIS reads your live app data to answer. The default Mistral model needs no key. Keyed models all have free tiers:
            <a className="text-accent hover:underline" href="https://console.groq.com/keys" target="_blank" rel="noreferrer"> Groq</a>,
            <a className="text-accent hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"> Gemini</a>,
            <a className="text-accent hover:underline" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"> OpenRouter</a>.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Groq API key">
              <input
                className="field"
                type="password"
                placeholder="gsk_…"
                value={state.settings.aiGroqKey}
                onChange={(e) => actions.updateSettings({ aiGroqKey: e.target.value.trim() })}
              />
            </Field>
            <Field label="Gemini API key">
              <input
                className="field"
                type="password"
                placeholder="AIza…"
                value={state.settings.aiGeminiKey}
                onChange={(e) => actions.updateSettings({ aiGeminiKey: e.target.value.trim() })}
              />
            </Field>
            <Field label="OpenRouter API key">
              <input
                className="field"
                type="password"
                placeholder="sk-or-…"
                value={state.settings.aiOpenRouterKey}
                onChange={(e) => actions.updateSettings({ aiOpenRouterKey: e.target.value.trim() })}
              />
            </Field>
          </div>
          <p className="text-xs text-slate-600">
            Keys are stored only in this browser's local storage and sent only to the provider you choose.
          </p>
        </div>
      </Panel>

      <Panel title="Data" className="mt-5">
        <div className="space-y-3 p-4 text-sm text-slate-400">
          <p>
            All data is stored locally in this browser under the key <code className="text-accent">{STORAGE_KEY}</code>. Nothing leaves
            your device.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={exportData}>Export JSON</button>
            <button
              className="btn"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = async () => {
                  try {
                    const text = await input.files?.[0]?.text();
                    if (!text) return;
                    const parsed = JSON.parse(text);
                    if (!parsed || typeof parsed !== 'object' || !('settings' in parsed)) {
                      alert('Not a Hollow Foundation export file.');
                      return;
                    }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                    location.reload();
                  } catch {
                    alert('Could not read that file.');
                  }
                };
                input.click();
              }}
            >
              Import JSON
            </button>
            <ConfirmButton
              confirmLabel="Click again to confirm full reset"
              onConfirm={() => {
                actions.resetAll();
              }}
            >
              Reset all data
            </ConfirmButton>
          </div>
          <p className="text-xs text-slate-600">
            Reset restores the default projects and habits and clears everything else. Export first if you are unsure.
          </p>
        </div>
      </Panel>
    </div>
  );
}
