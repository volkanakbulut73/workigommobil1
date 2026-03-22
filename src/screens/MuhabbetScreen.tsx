import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useMuhabbetStore } from '../store/useMuhabbetStore';
import { useAuthStore } from '../store/useAuthStore';
import { Layout } from '../components/Layout';
import { Send, Globe, Users as UsersIcon } from 'lucide-react-native';

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

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === profile?.id;
    
    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
        {/* Avatar */}
        {!isMine && (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{item.sender_name?.[0] || 'U'}</Text>
          </View>
        )}
        
        <View style={[styles.messageContent, isMine && styles.messageContentMine]}>
          {/* Sender Name */}
          <Text style={[styles.senderLabel, isMine && styles.senderLabelMine]}>
            {isMine ? 'SİZ' : (item.sender_name || 'Anonim')}
          </Text>
          
          {/* Message Bubble */}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
              {item.content}
            </Text>
          </View>
          
          {/* Time */}
          {item.created_at && (
            <Text style={[styles.timeLabel, isMine && styles.timeLabelMine]}>
              {formatTime(item.created_at)}
            </Text>
          )}
        </View>

        {isMine && (
          <View style={styles.avatarCircleMine}>
            <Text style={styles.avatarLetterMine}>{profile?.full_name?.[0] || 'U'}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Layout>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Globe color="#8eff71" size={22} />
          <View>
            <Text style={styles.headerTitle}>MUHABBET</Text>
            <Text style={styles.headerSubtitle}>Global Chat</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{onlineUsers}</Text>
          </View>
          <UsersIcon color="#8eff71" size={20} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeDivider} />
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeTitle}>GENEL SOHBET. ŞİFRELİ OTURUMA HOŞ GELDİNİZ.</Text>
            <Text style={styles.welcomeSub}>WORKIGOM{'<'}CHAT{'>'}</Text>
          </View>
          <View style={styles.welcomeDivider} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
        />

        {/* Input Dock — floating pill */}
        <View style={styles.inputDock}>
          <View style={styles.inputPill}>
            <TextInput
              style={styles.input}
              placeholder="Bir mesaj yazın..."
              placeholderTextColor="#aaaab6"
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
              <Send color={inputText.trim() ? "#0d6100" : "#aaaab6"} size={18} />
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0c0e16',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(70, 71, 81, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#8eff71',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8eff71',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  onlineText: {
    color: '#8eff71',
    fontSize: 12,
    fontWeight: '900',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  welcomeBanner: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  welcomeDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
  },
  welcomeBox: {
    backgroundColor: 'rgba(142, 255, 113, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  welcomeTitle: {
    color: '#8eff71',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeSub: {
    color: '#aaaab6',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    maxWidth: '85%',
    gap: 10,
  },
  messageRowMine: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageRowTheirs: {
    alignSelf: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 255, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.3)',
  },
  avatarLetter: {
    color: '#8eff71',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarCircleMine: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8eff71',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8eff71',
  },
  avatarLetterMine: {
    color: '#0d6100',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    flexShrink: 1,
    gap: 4,
  },
  messageContentMine: {
    alignItems: 'flex-end',
  },
  senderLabel: {
    color: 'rgba(142, 255, 113, 0.7)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  senderLabelMine: {
    marginLeft: 0,
    marginRight: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: '#8eff71',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 0,
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  bubbleTheirs: {
    backgroundColor: '#1d1f2a',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.1)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  messageTextMine: {
    color: '#0d6100',
    fontWeight: 'bold',
  },
  messageTextTheirs: {
    color: '#ededf9',
    fontWeight: '500',
  },
  timeLabel: {
    color: '#aaaab6',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginTop: 2,
  },
  timeLabelMine: {
    marginLeft: 0,
    marginRight: 4,
  },
  inputDock: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#0c0e16',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(34, 37, 49, 0.8)',
    borderRadius: 9999,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(70, 71, 81, 0.3)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '500',
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8eff71',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8eff71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#222531',
    shadowOpacity: 0,
  },
});
