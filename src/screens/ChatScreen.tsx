import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import { ChevronLeft, Send, Image as ImageIcon } from 'lucide-react-native';
import { MessageService } from '../services/messageService';

const MessageBubble = React.memo(({ item, isMe, onDelete }: { item: any, isMe: boolean, onDelete: (id: string) => void }) => {
  return (
    <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
      <TouchableOpacity 
        style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}
        onLongPress={() => isMe ? onDelete(item.id) : null}
        delayLongPress={400}
        activeOpacity={isMe ? 0.7 : 1}
      >
        <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
          {item.content}
        </Text>
        <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampOther]}>
          {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { threadId, title } = route.params || {};
  const profile = useAuthStore(state => state.profile);
  
  const messages = useMessageStore(state => state.messages);
  const loading = useMessageStore(state => state.loading);
  const fetchMessages = useMessageStore(state => state.fetchMessages);
  const sendMessage = useMessageStore(state => state.sendMessage);
  const subscribeToThread = useMessageStore(state => state.subscribeToThread);
  const unsubscribe = useMessageStore(state => state.unsubscribe);
  const markThreadAsRead = useMessageStore(state => state.markThreadAsRead);
  const deleteMessage = useMessageStore(state => state.deleteMessage);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [threadDetails, setThreadDetails] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!threadId || !profile) return;

    const loadThread = async () => {
      try {
        const details = await MessageService.getThreadDetails(threadId);
        setThreadDetails(details);
      } catch (err) {
        console.error('Error fetching thread details:', err);
      }
    };

    loadThread();
    fetchMessages(threadId);
    subscribeToThread(threadId, profile.id);

    return () => {
      unsubscribe();
    };
  }, [threadId, profile?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile || !threadId) return;
    
    let receiverId = '';
    if (threadDetails) {
      receiverId = profile.id === threadDetails.buyer_id ? threadDetails.seller_id : threadDetails.buyer_id;
    } else {
      receiverId = route.params?.receiverId || '';
    }

    if (!receiverId) {
      console.warn('Cannot determine receiverId');
      return;
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

  const handleDelete = useCallback((msgId: string) => {
    Alert.alert(
      "Mesajı Sil",
      "Bu mesajı silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => deleteMessage(msgId, profile?.id || '') }
      ]
    );
  }, [profile?.id, deleteMessage]);

  const renderMessage = useCallback(({ item }: { item: any }) => {
    const isMe = item.sender_id === profile?.id;
    return <MessageBubble item={item} isMe={isMe} onDelete={handleDelete} />;
  }, [profile?.id, handleDelete]);

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

      {threadDetails?.listing && (
        <View style={styles.listingHeader}>
          <Image 
            source={{ uri: threadDetails.listing.photo_url?.split(',')[0] }} 
            style={styles.listingThumb} 
          />
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>{threadDetails.listing.title}</Text>
            <Text style={styles.listingPrice}>₺{threadDetails.listing.required_balance}</Text>
          </View>
        </View>
      )}

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

      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#11142A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12
  },
  listingThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  listingPrice: {
    color: '#39ff14',
    fontSize: 12,
    fontWeight: 'bold'
  },
});
