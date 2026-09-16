import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChat } from '@/hooks/useChat';
import { Colors } from '@/constants/colors';
import type { ChatMessage } from '@/types';

const SUGGESTIONS = [
  'ما هو صافي الدخل هذا الشهر؟',
  'اشرح لي قائمة الدخل',
  'ما هي الحسابات الأكثر نشاطاً؟',
  'هل نسبة المصروفات طبيعية؟',
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      {!isUser && (
        <Text style={styles.aiLabel}>🤖 محاسب AI</Text>
      )}
      <Text style={[styles.bubbleText, isUser && { color: '#fff' }]}>
        {msg.content || '...'}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const { messages, streaming, sendMessage, stopStreaming, clearHistory } = useChat();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    setInput('');
    sendMessage(msg);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={{ flex: 1, backgroundColor: Colors.light.bg }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>مسح</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('tabs.chat')}</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={{ flex: 1, gap: 20, justifyContent: 'center' }}>
              <Text style={{ textAlign: 'center', fontSize: 32 }}>🤖</Text>
              <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.light.ink }}>
                محاسبك الذكي
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 13, color: Colors.light.ink3, lineHeight: 20 }}>
                اسألني عن أي شيء مالي — أرقام، تفسيرات، مقارنات
              </Text>
              <View style={{ gap: 8 }}>
                {SUGGESTIONS.map(s => (
                  <TouchableOpacity key={s} onPress={() => handleSend(s)} style={styles.suggestion}>
                    <Text style={{ fontSize: 13, color: Colors.brand, textAlign: 'right' }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          {streaming ? (
            <TouchableOpacity onPress={stopStreaming} style={styles.stopBtn}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>إيقاف ⏹</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!input.trim()}
              style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            >
              <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>↑</Text>
            </TouchableOpacity>
          )}
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            placeholder="اكتب سؤالك المالي..."
            placeholderTextColor={Colors.light.ink3}
            style={styles.input}
            multiline
            textAlign="right"
            writingDirection="rtl"
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!streaming}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:          { backgroundColor: Colors.brand, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:           { fontSize: 20, fontWeight: '900', color: '#fff' },
  bubble:          { maxWidth: '85%', borderRadius: 16, padding: 12, gap: 4 },
  bubbleUser:      { backgroundColor: Colors.brand, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.light.card, alignSelf: 'flex-end', borderBottomRightRadius: 4, borderWidth: 1, borderColor: Colors.light.border },
  aiLabel:         { fontSize: 10, fontWeight: '700', color: Colors.light.ink3, textAlign: 'right' },
  bubbleText:      { fontSize: 14, color: Colors.light.ink, lineHeight: 22, textAlign: 'right' },
  suggestion:      { backgroundColor: Colors.light.card, borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: Colors.light.border },
  inputBar:        { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, backgroundColor: Colors.light.card, borderTopWidth: 1.5, borderTopColor: Colors.light.border },
  input:           { flex: 1, backgroundColor: Colors.light.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.light.ink, maxHeight: 120 },
  sendBtn:         { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  stopBtn:         { paddingHorizontal: 12, height: 40, borderRadius: 20, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center' },
});
