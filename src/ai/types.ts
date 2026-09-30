export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export interface ChatResult {
  text: string;
  modelId: string;
}

export interface AIModel {
  id: string;
  label: string;
  /** e.g. 'GPT', 'Gemini', 'Llama' — shown as a small tag */
  family: string;
  /** true = no API key needed */
  keyless: boolean;
  /** which settings key stores the API key, if any */
  keySetting?: 'aiGroqKey' | 'aiGeminiKey' | 'aiOpenRouterKey';
  /** short description shown in the picker */
  blurb: string;
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AIError';
  }
}
