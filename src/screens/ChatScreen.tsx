import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import { ChevronLeft, Send, Image as ImageIcon } from 'lucide-react-native';

const MessageBubble = React.memo(({ item, isMe }: { item: any, isMe: boolean }) => (
  <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
    <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
      <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
        {item.content}
      </Text>
      <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampOther]}>
        {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  </View>
));

export function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { threadId, title } = route.params || {};
  const profile = useAuthStore(state => state.profile);
  
  const messages = useMessageStore(state => state.messages);
  const loading = useMessageStore(state => state.loading);
  const fetchMessages = useMessageStore(state => state.fetchMessages);
  const sendMessage = useMessageStore(state => state.sendMessage);
  const subscribeToThread = useMessageStore(state => state.subscribeToThread);
  const unsubscribe = useMessageStore(state => state.unsubscribe);
  const markThreadAsRead = useMessageStore(state => state.markThreadAsRead);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!threadId || !profile) return;

    fetchMessages(threadId);
    subscribeToThread(threadId);
    markThreadAsRead(threadId, profile.id);

    return () => {
      unsubscribe();
    };
  }, [threadId, profile]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile || !threadId) return;
    
    let receiverId = '';
    const otherMessage = messages.find(m => m.sender_id !== profile.id);
    if (otherMessage) {
      receiverId = otherMessage.sender_id;
    } else {
      receiverId = route.params?.receiverId || '';
    }

    const text = inputText.trim();
    setInputText('');
    setSending(true);
    
    try {
      await sendMessage(threadId, profile.id, receiverId, text);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: any }) => {
    const isMe = item.sender_id === profile?.id;
    return <MessageBubble item={item} isMe={isMe} />;
  }, [profile?.id]);

  const keyExtractor = useCallback((item: any, index: number) => item.id || index.toString(), []);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Sohbet'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.chatArea}>
        {loading && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color="#00e5ff" size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            inverted
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
          />
        )}
      </View>

      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.attachBtn}>
          <ImageIcon color="#aaa" size={20} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Bir mesaj yazın..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!inputText.trim() || sending}>
          <Send color={inputText.trim() ? "#00e5ff" : "#444"} size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050a19' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
    backgroundColor: '#0a1529', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 40 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  chatArea: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  messageWrapper: { marginBottom: 16, width: '100%', flexDirection: 'row' },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperOther: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  messageBubbleMe: { backgroundColor: '#00e5ff', borderTopRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#16172d', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderTopLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextMe: { color: '#050a19', fontWeight: '500' },
  messageTextOther: { color: '#fff' },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timestampMe: { color: 'rgba(5, 10, 25, 0.6)' },
  timestampOther: { color: '#666' },
  inputArea: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#0a1529', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: '#050a19', borderRadius: 20,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: '#fff', fontSize: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  sendBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});
