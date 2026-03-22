import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Dimensions } from 'react-native';
import { useMuhabbetStore } from '../store/useMuhabbetStore';
import { useAuthStore } from '../store/useAuthStore';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Send, Globe, Users as UsersIcon, X, Bot } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MuhabbetScreen() {
  const { profile } = useAuthStore();
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
    <Layout>
      <View style={styles.screenContainer}>
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
            <TouchableOpacity 
              style={styles.onlineBadge}
              onPress={() => setShowUsersSidebar(true)}
            >
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{onlineUsers}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowUsersSidebar(true)}>
              <UsersIcon color="#8eff71" size={20} />
            </TouchableOpacity>
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
                <Send color={inputText.trim() ? "#0d6100" : "#aaaab6"} size={18} />
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
                <View style={[styles.drawerAvatar, item?.id === profile?.id && { backgroundColor: '#39FF14', borderColor: '#39FF14' }]}>
                  <Text style={[styles.drawerAvatarText, item?.id === profile?.id && { color: '#0d6100' }]}>
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
    position: 'relative',
  },
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
  botAvatarCircle: {
    backgroundColor: '#0a0b1e',
    borderColor: 'rgba(255, 0, 127, 0.3)',
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
  bubbleBot: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.2)',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
  
  // Drawer Styles
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 99,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.75, // 75% of screen
    backgroundColor: '#1C2541',
    zIndex: 100,
    borderRightWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.1)',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(11, 19, 43, 0.5)',
  },
  drawerHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitle: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(142, 255, 113, 0.1)',
  },
  drawerList: {
    padding: 20,
  },
  drawerSectionTitle: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  drawerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 37, 65, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(142, 255, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: {
    color: '#8eff71',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerUserInfo: {
    flex: 1,
  },
  drawerUserName: {
    color: '#ededf9',
    fontSize: 14,
    fontWeight: '600',
  },
  drawerUserSub: {
    color: '#aaaab6',
    fontSize: 10,
    marginTop: 2,
  },
});
