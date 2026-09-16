import { useState, useCallback, useRef } from 'react';
import { streamChat } from '@/lib/api';
import type { ChatMessage } from '@/types';

export function useChat() {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    const placeholder: ChatMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, placeholder]);
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      await streamChat(
        text,
        messages,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: last.content + chunk };
            }
            return updated;
          });
        },
        abortRef.current.signal,
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'حدث خطأ، يرجى المحاولة مجدداً.' };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, streaming, sendMessage, stopStreaming, clearHistory };
}
