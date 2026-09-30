import { AIError, type ChatMessage, type ChatResult, type AIModel } from './types';

/**
 * Free model registry.
 *
 * Keyless (work with zero setup, free tiers / open endpoints):
 *  - llm7.io: OpenAI-compatible, CORS-open, free "turbo" tier, no key.
 *    Pin `mistral-Nemo-Instruct-2407` (default) and `DeepSeek-V4-Flash-0731`
 *    (sometimes busy at peak). Verified live 30 Sep 2026.
 *
 * Key required (all have permanent free tiers — user pastes their own key):
 *  - Groq      → Llama 3.3 70B (very fast, generous free tier)
 *  - Gemini    → gemini-2.0-flash (Google free tier)
 *  - OpenRouter→ free-tier models via OpenAI-compatible endpoint
 */
export const MODELS: AIModel[] = [
  {
    id: 'llm7-mistral',
    label: 'Mistral Nemo (free, no key)',
    family: 'Mistral',
    keyless: true,
    blurb: 'Keyless via llm7.io. Works instantly, no account.',
  },
  {
    id: 'llm7-deepseek',
    label: 'DeepSeek Flash (free, no key)',
    family: 'DeepSeek',
    keyless: true,
    blurb: 'Keyless via llm7.io. Stronger, but busy at peak times.',
  },
  {
    id: 'groq-llama',
    label: 'Llama 3.3 70B (Groq)',
    family: 'Llama',
    keyless: false,
    keySetting: 'aiGroqKey',
    blurb: 'Extremely fast. Free API key at console.groq.com',
  },
  {
    id: 'gemini-flash',
    label: 'Gemini 2.0 Flash',
    family: 'Gemini',
    keyless: false,
    keySetting: 'aiGeminiKey',
    blurb: 'Google free tier. Key at aistudio.google.com',
  },
  {
    id: 'openrouter-free',
    label: 'OpenRouter (free tier)',
    family: 'OpenRouter',
    keyless: false,
    keySetting: 'aiOpenRouterKey',
    blurb: 'Free models via openrouter.ai — paste any free key.',
  },
];

export function getModel(id: string): AIModel {
  const found = MODELS.find((m) => m.id === id);
  if (found) return found;
  // Legacy ids from before the llm7 switch fall back to the default model.
  if (id.startsWith('pollinations-')) return MODELS[0];
  return MODELS[0];
}

interface Endpoint {
  url: string;
  model: string;
}

function endpointFor(m: AIModel): Endpoint {
  switch (m.id) {
    case 'llm7-mistral':
      return { url: 'https://api.llm7.io/v1/chat/completions', model: 'mistral-Nemo-Instruct-2407' };
    case 'llm7-deepseek':
      return { url: 'https://api.llm7.io/v1/chat/completions', model: 'DeepSeek-V4-Flash-0731' };
    case 'groq-llama':
      return { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' };
    case 'gemini-flash':
      // Gemini's OpenAI-compatible endpoint.
      return { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.0-flash' };
    case 'openrouter-free':
      return { url: 'https://openrouter.ai/api/v1/chat/completions', model: 'openrouter/auto' };
    default:
      throw new AIError(`Unknown model: ${m.id}`);
  }
}

export async function chatComplete(modelId: string, apiKey: string | undefined, messages: ChatMessage[], signal?: AbortSignal): Promise<ChatResult> {
  const model = getModel(modelId);
  const ep = endpointFor(model);

  if (!model.keyless && !apiKey) {
    throw new AIError(`${model.family} needs a free API key. Add it in Settings → AI Assistant.`, 401);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!model.keyless && apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  // OpenRouter etiquette headers.
  if (model.id === 'openrouter-free') {
    headers['HTTP-Referer'] = location.origin;
    headers['X-Title'] = 'Hollow Foundation';
  }

  let res: Response;
  try {
    res = await fetch(ep.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: ep.model,
        messages,
        temperature: 0.65,
        max_tokens: 700,
      }),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new AIError('Network error — check your connection and try again.', 0);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    if (res.status === 401 || res.status === 403) {
      throw new AIError(`Key rejected by ${model.family}. Check it in Settings → AI Assistant.`, res.status);
    }
    if (res.status === 429) {
      throw new AIError(`${model.family} rate limit hit. Wait a moment or switch models.`, 429);
    }
    throw new AIError(detail || `${model.family} request failed (${res.status}).`, res.status);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AIError(`${model.family} returned an empty response. Try again or switch models.`, res.status);
  return { text, modelId: model.id };
}
