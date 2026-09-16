import { loadSession, clearSession } from './auth';
import { router } from 'expo-router';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const session = await loadSession();

  const headers: Record<string, string> = {
    ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body != null
        ? JSON.stringify(body)
        : undefined,
  });

  if (res.status === 401) {
    await clearSession();
    router.replace('/(auth)/login');
    throw new Error('انتهت الجلسة — يرجى تسجيل الدخول مجدداً');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      (data as { error?: string } | null)?.error ?? `خطأ ${res.status}`,
    );
  }

  return data as T;
}

export const api = {
  get:    <T>(path: string)                       => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)        => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown)        => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown)        => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                       => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData)       => request<T>('POST',   path, form, true),
};

// ── Streaming helper for chat ──────────────────────────────────────────────────

export async function streamChat(
  message: string,
  history: { role: string; content: string }[],
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const session = await loadSession();
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok || !res.body) throw new Error('فشل الاتصال بالمساعد المالي');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // Parse SSE data lines
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const payload = line.slice(6).trim();
        if (payload && payload !== '[DONE]') {
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.delta ?? '';
            if (delta) onChunk(delta);
          } catch {
            // non-JSON SSE line — skip
          }
        }
      }
    }
  }
}
