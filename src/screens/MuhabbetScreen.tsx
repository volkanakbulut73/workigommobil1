import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useMuhabbetStore } from '../store/useMuhabbetStore';
import { useAuthStore } from '../store/useAuthStore';
import { Layout } from '../components/Layout';
import { Send } from 'lucide-react-native';

export default function MuhabbetScreen() {
  const { profile } = useAuthStore();
  const { 
    messages, 
    onlineUsers, 
    initializeRoom, 
    sendMessage, 
    leaveRoom 
  } = useMuhabbetStore();
  
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  const ROOM_NAME = 'genel';

  useEffect(() => {
    if (profile?.id) {
      initializeRoom(ROOM_NAME, profile.id, {
        name: profile.full_name,
        avatar: profile.avatar_url
      });
    }
    return () => leaveRoom();
  }, [profile?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile) return;
    
    const content = inputText.trim();
    setInputText('');
    
    await sendMessage(ROOM_NAME, {
      sender_id: profile.id,
      sender_name: profile.full_name || 'Anonim',
      avatar_url: profile.avatar_url || '',
      content: content
    });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === profile?.id;
    
    return (
      <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMine && (
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{item.sender_name?.[0] || 'U'}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
          {!isMine && <Text style={styles.senderName}>{item.sender_name}</Text>}
          <Text style={[styles.messageText, isMine ? styles.myText : styles.theirText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Layout>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Muhabbet</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{onlineUsers} Online</Text>
        </View>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.inputDock}>
          <TextInput
            style={styles.input}
            placeholder="Sosyalleş..."
            placeholderTextColor="#ababab"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={handleSend} 
            disabled={!inputText.trim()}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          >
            <Send color={inputText.trim() ? "#00fd00" : "#484848"} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#191919'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#191919',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00fd00',
    marginRight: 6,
    shadowColor: '#01ed00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4
  },
  onlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  theirMessageWrapper: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#191919',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#00fd00',
    fontSize: 14,
    fontWeight: 'bold'
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  myBubble: {
    backgroundColor: '#00fd00', // primary_fixed
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: '#262626', // surface_container_highest
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 0,
  },
  senderName: {
    color: '#ababab', // on_surface_variant
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '700'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myText: {
    color: '#014500', // on_primary_fixed
    fontWeight: '500'
  },
  theirText: {
    color: '#ffffff',
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#191919',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
  },
  sendButton: {
    marginLeft: 12,
    marginBottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  }
});
