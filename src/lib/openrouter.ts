import { AIGenFile, AIMode } from '../Types';

const AI_KEY_STORAGE = 'aksaralumina:openrouter-key';
const AI_MODEL_STORAGE = 'aksaralumina:openrouter-model';
const AI_HISTORY = 'aksaralumina:openrouter-model-history';

export const DEFAULT_MODEL = 'tencent/hy3:free';

export const loadKey = () => localStorage.getItem(AI_KEY_STORAGE) || '';
export const saveKey = (k: string) => localStorage.setItem(AI_KEY_STORAGE, k);

export const loadModel = () => localStorage.getItem(AI_MODEL_STORAGE) || DEFAULT_MODEL;
export const saveModel = (m: string) => {
  localStorage.setItem(AI_MODEL_STORAGE, m);
  const list = loadModelHistory();
  const next = [m, ...list.filter((x) => x !== m)].slice(0, 8);
  localStorage.setItem(AI_HISTORY, JSON.stringify(next));
};

export const loadModelHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(AI_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const MODE_LABELS: Record<AIMode, string> = {
  generate_command: 'Generate Command (Tanpa Penjelasan)',
  generate_command_explain: 'Generate Command (Dengan Penjelasan)',
};

const JSON_INSTRUCTION =
  'Balas HANYA dengan JSON valid berbentuk array of objects: [{"title": "...", "content": "..."}]. Jangan sertakan markdown/backtick, penjelasan, atau kunci tambahan. `title` adalah nama perintah/judul singkat. `content` adalah kata perintah/isi terminal.';

export const buildPrompt = (
  mode: AIMode,
  userPrompt: string,
  sourceFiles: { name: string; content: string }[],
): string => {
  let sources = '';
  if (sourceFiles.length > 0) {
    sources = '\n\nFile sumber:\n' + sourceFiles.map((f, i) => `File ${i + 1}:\nIsi:\n${f.content}`).join('\n\n');
  }
  
  const base = `${JSON_INSTRUCTION}\n\nPermintaan pengguna: ${userPrompt || '(tidak ada)'}${sources}`;
  
  if (mode === 'generate_command') {
    return `Tugas: Hasilkan perintah terminal sesuai permintaan. Jangan sertakan penjelasan apapun di judul atau isi.\n${base}`;
  }
  
  if (mode === 'generate_command_explain') {
    return `Tugas: Hasilkan perintah terminal sesuai permintaan. Sertakan baris penjelasan (menggunakan komentar seperti # atau //) di dalam isi (content).\n${base}`;
  }
  
  return base;
};

const stripCodeFence = (t: string): string => {
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : t.trim();
};

export const parseAIResponse = (text: string): AIGenFile[] => {
  const cleaned = stripCodeFence(text);
  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return normalize(parsed);
    if (parsed && Array.isArray(parsed.files)) return normalize(parsed.files);
    if (parsed && parsed.title && parsed.content !== undefined) return normalize([parsed]);
  } catch {
    /* ignore */
  }
  // Try to find first JSON array in text
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const arr = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(arr)) return normalize(arr);
    } catch {
      /* ignore */
    }
  }
  throw new Error('Format respons AI tidak valid.');
};

const normalize = (arr: unknown[]): AIGenFile[] => {
  return arr
    .map((x: any, i: number) => ({
      title: String(x?.title ?? `File ${i + 1}`).trim() || `File ${i + 1}`,
      content: String(x?.content ?? ''),
    }))
    .filter((x) => x.title);
};

interface CallOpts {
  apiKey: string;
  model: string;
  prompt: string;
  signal?: AbortSignal;
}

// WARNING: This application uses a client-side API key for OpenRouter.
// This is acceptable for "bring-your-own-key" utilities, but not recommended for production apps where you want to hide your own key.
// As requested, keeping this client-side.
export const callOpenRouter = async ({ apiKey, model, prompt, signal }: CallOpts): Promise<string> => {
  if (!apiKey) throw new Error('API Key kosong.');
  if (!model) throw new Error('Model kosong.');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'aksaralumina',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Anda adalah asisten pembangkit konten. Selalu balas dengan JSON valid sesuai instruksi pengguna, tanpa penjelasan atau markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respons AI kosong.');
  return text;
};
