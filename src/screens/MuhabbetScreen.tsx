import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Dimensions, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMuhabbetStore } from '../store/useMuhabbetStore';
import { useAuthStore } from '../store/useAuthStore';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Send, Globe, Users as UsersIcon, X, Bot } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MuhabbetScreen() {
  const { profile } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { 
    messages, 
    onlineUsers, 
    presenceList,
    initializeRoom, 
    sendMessage, 
    leaveRoom 
  } = useMuhabbetStore();
  
  const [inputText, setInputText] = useState('');
  const [showUsersSidebar, setShowUsersSidebar] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  
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

  // Sidebar Slide Animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showUsersSidebar ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showUsersSidebar]);

  const handleSend = async () => {
    if (!inputText.trim() || !profile) return;
    
    const content = inputText.trim();
    setInputText(''); // Optimistic UI clear
    
    // Normal message handling
    await sendMessage(ROOM_NAME, {
      sender_id: profile.id,
      sender_name: profile.full_name || 'Anonim',
      avatar_url: profile.avatar_url || '',
      content: content
    });

    // Check for bot trigger
    const isBotTriggered = content.toLowerCase().includes('@workigom') || content.toLowerCase().includes('/workigom');
    
    if (isBotTriggered) {
      setIsBotTyping(true);
      try {
        const { data, error } = await supabase.functions.invoke('gemini-bot', {
          body: { message: content, user_name: profile.full_name || 'Anonim' }
        });

        if (error) {
          console.error("Supabase Edge Function Error:", error);
          throw error;
        }

        const botReply = data?.response || data?.error || "Sanırım sistemlerimde bir arıza var...";

        await sendMessage(ROOM_NAME, {
          sender_id: 'bot-1',
          sender_name: 'Workigom AI',
          avatar_url: '',
          content: botReply
        });
      } catch (err) {
        console.error("Bot error details:", err);
        await sendMessage(ROOM_NAME, {
          sender_id: 'bot-1',
          sender_name: 'Workigom AI',
          avatar_url: '',
          content: "Bağlantı hatası oluştu, Workigom AI'a ulaşılamıyor."
        });
      } finally {
        setIsBotTyping(false);
      }
    }
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
    const isBot = item.sender_id === 'bot-1';
    
    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
        {/* Avatar */}
        {!isMine && (
          <View style={[styles.avatarCircle, isBot && styles.botAvatarCircle]}>
            {isBot ? (
              <Bot color="#FF007F" size={16} />
            ) : (
              <Text style={styles.avatarLetter}>{item.sender_name?.[0] || 'U'}</Text>
            )}
          </View>
        )}
        
        <View style={[styles.messageContent, isMine && styles.messageContentMine]}>
          {/* Sender Name */}
          <Text style={[styles.senderLabel, isMine && styles.senderLabelMine, isBot && { color: '#FF007F' }]}>
            {isMine ? 'SİZ' : (item.sender_name || 'Anonim')}
          </Text>
          
          {/* Message Bubble */}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, isBot && styles.bubbleBot]}>
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

  const renderTypingIndicator = () => {
    if (!isBotTyping) return null;
    return (
      <View style={[styles.messageRow, styles.messageRowTheirs, { marginBottom: 12 }]}>
         <View style={[styles.avatarCircle, styles.botAvatarCircle]}>
            <Bot color="#FF007F" size={16} />
         </View>
         <View style={styles.messageContent}>
           <Text style={[styles.senderLabel, { color: '#FF007F' }]}>WORKIGOM AI</Text>
           <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={[styles.messageText, styles.messageTextTheirs, { opacity: 0.6 }]}>
                Workigom AI düşünüyor...
              </Text>
           </View>
         </View>
      </View>
    );
  };

  return (
    <Layout withHeader={false}>
      <View style={styles.screenContainer}>
        {/* Header with Safe Area */}
        <View style={[
          styles.header, 
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0) + 12 }
        ]}>
          <View style={styles.headerLeft}>
            <Globe color="#FF007F" size={16} />
            <View>
              <Text style={styles.headerSubtitle}>MUHABBET - Global Chat</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.onlineBadge}
              onPress={() => setShowUsersSidebar(true)}
            >
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{onlineUsers}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowUsersSidebar(true)}>
              <UsersIcon color="#FF007F" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            ListHeaderComponent={renderTypingIndicator} // Renders at bottom due to inverted
            inverted
            contentContainerStyle={styles.listContent}
          />

          {/* Input Dock */}
          <View style={styles.inputDock}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.input}
                placeholder="@workigom yazarak çağırın..."
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
                <Send color={inputText.trim() ? "#ffffff" : "#aaaab6"} size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* --- Side Drawer Overlay --- */}
        {showUsersSidebar && (
          <TouchableOpacity 
            style={styles.drawerOverlay} 
            activeOpacity={1} 
            onPress={() => setShowUsersSidebar(false)} 
          />
        )}

        {/* --- Side Drawer Content --- */}
        <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.drawerHeader}>
            <View style={styles.drawerHeaderTitleRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.drawerTitle}>ÇEVRİMİÇİ KULLANICILAR</Text>
            </View>
            <TouchableOpacity onPress={() => setShowUsersSidebar(false)}>
              <X color="#aaaab6" size={20} />
            </TouchableOpacity>
          </View>
          <View style={styles.drawerDivider} />
          
          <FlatList
            data={presenceList}
            keyExtractor={(item, index) => item?.id || index.toString()}
            contentContainerStyle={styles.drawerList}
            renderItem={({ item }) => (
              <View style={styles.drawerUserRow}>
                <View style={[styles.drawerAvatar, item?.id === profile?.id && { backgroundColor: '#FF007F', borderColor: '#FF007F' }]}>
                  <Text style={[styles.drawerAvatarText, item?.id === profile?.id && { color: '#ffffff' }]}>
                    {(item?.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.drawerUserInfo}>
                  <Text style={styles.drawerUserName}>
                    {item?.id === profile?.id ? `${item?.name} (Siz)` : (item?.name || 'Anonim')}
                  </Text>
                  <Text style={styles.drawerUserSub}>Online</Text>
                </View>
              </View>
            )}
            ListHeaderComponent={() => (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.drawerSectionTitle}>DROIDS (Yapay Zeka)</Text>
                <View style={[styles.drawerUserRow, { marginTop: 8 }]}>
                  <View style={[styles.drawerAvatar, { backgroundColor: '#0a0b1e', borderColor: 'rgba(255, 0, 127, 0.4)' }]}>
                    <Bot color="#FF007F" size={16} />
                  </View>
                  <View style={styles.drawerUserInfo}>
                    <Text style={[styles.drawerUserName, { color: '#FF007F' }]}>Workigom AI</Text>
                    <Text style={styles.drawerUserSub}>Geçerli Oda: Global Chat</Text>
                  </View>
                </View>
              </View>
            )}
          />
        </Animated.View>

      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(12, 14, 22, 0.85)',
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSubtitle: {
    color: '#FF007F',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF007F',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  onlineText: {
    color: '#FF007F',
    fontSize: 12,
    fontWeight: '900',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    maxWidth: '85%',
    gap: 12,
  },
  messageRowMine: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageRowTheirs: {
    alignSelf: 'flex-start',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d1f2a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  botAvatarCircle: {
    backgroundColor: '#0c0e16',
    shadowColor: '#FF007F',
    shadowOpacity: 0.2,
  },
  avatarLetter: {
    color: '#FF007F',
    fontSize: 15,
    fontWeight: '900',
  },
  avatarCircleMine: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatarLetterMine: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  messageContent: {
    flexShrink: 1,
    gap: 6,
  },
  messageContentMine: {
    alignItems: 'flex-end',
  },
  senderLabel: {
    color: '#FF007F',
    opacity: 0.8,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
  },
  senderLabelMine: {
    marginLeft: 0,
    marginRight: 4,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: '#FF007F',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bubbleTheirs: {
    backgroundColor: '#1d1f2a',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bubbleBot: {
    backgroundColor: 'rgba(255, 0, 127, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.2)',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTextMine: {
    color: '#ffffff',
    fontWeight: '700',
  },
  messageTextTheirs: {
    color: '#ededf9',
    fontWeight: '500',
  },
  timeLabel: {
    color: '#aaaab6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
    marginLeft: 4,
    marginTop: 4,
  },
  timeLabelMine: {
    marginLeft: 0,
    marginRight: 4,
  },
  inputDock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: 'rgba(12, 14, 22, 0.95)',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1d1f2a',
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingVertical: 6,
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#ededf9',
    fontSize: 15,
    fontWeight: '500',
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#2d3142',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Drawer Styles
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 99,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.8,
    backgroundColor: '#0c0e16',
    zIndex: 100,
    shadowColor: '#FF007F',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  drawerHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerTitle: {
    color: '#FF007F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    marginHorizontal: 24,
  },
  drawerList: {
    padding: 24,
  },
  drawerSectionTitle: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  drawerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1d1f2a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  drawerAvatarText: {
    color: '#FF007F',
    fontSize: 16,
    fontWeight: '900',
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerUserName: {
    color: '#ededf9',
    fontSize: 15,
    fontWeight: 'bold',
  },
  drawerUserSub: {
    color: '#FF007F',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
    marginTop: 2,
  },
});
