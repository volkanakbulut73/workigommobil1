import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Dimensions, StatusBar as RNStatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMuhabbetStore } from '../store/useMuhabbetStore';
import { useAuthStore } from '../store/useAuthStore';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Send, Globe, Users as UsersIcon, X, Bot, ChevronDown, Bell, User, Bold, Italic, Underline, Palette, Smile, Type } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const EMOJI_SET = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😮‍💨", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😶‍🌫️", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😻", "😼", "😽", "🙀", "😿", "😾"];

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  // Redesigned Header
  headerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(12, 14, 22, 0.95)',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeftNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  pinkSquare: {
    width: 36,
    height: 36,
    backgroundColor: '#FF007F',
    borderRadius: 8,
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  chatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  chatSelectorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerRightNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Welcome Pill
  welcomePillContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  welcomePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  welcomePillText: {
    color: '#aaaab6',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },

  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },

  // Message Rows
  messageRow: {
    flexDirection: 'row',
    maxWidth: '90%',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowMine: {
    alignSelf: 'flex-end',
    flexDirection: 'row', 
  },
  messageRowTheirs: {
    alignSelf: 'flex-start',
    flexDirection: 'row-reverse',
  },
  messageContent: {
    flex: 1,
    gap: 4,
  },
  messageContentMine: {
    alignItems: 'flex-end',
  },
  nameTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  nameTimeRowMine: {
    flexDirection: 'row',
  },
  nameTimeRowTheirs: {
    flexDirection: 'row-reverse',
  },
  timeLabelNew: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  senderLabelNew: {
    color: '#FF007F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  senderLabelMineNew: {
    color: '#FF007F',
  },
  
  // Bubble
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: '#FF007F',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#1d1f2a',
    borderBottomLeftRadius: 4,
  },
  bubbleBot: {
    backgroundColor: 'rgba(255, 0, 127, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.2)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#fff',
    fontWeight: '600',
  },
  messageTextTheirs: {
    color: '#ededf9',
  },

  // Avatar
  avatarWrapper: {
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  avatarWrapperMine: {
    marginLeft: 4,
  },
  avatarWrapperTheirs: {
    marginRight: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d1f2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircleMine: {
    backgroundColor: '#1d1f2a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarCircleTheirs: {
    backgroundColor: '#1d1f2a',
  },
  botAvatarCircle: {
    backgroundColor: '#0c0e16',
    borderWidth: 1,
    borderColor: '#FF007F',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },

  // Redesigned Input Dock
  inputDockNew: {
    backgroundColor: '#1d1f2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  formatToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  toolbarBtn: {
    padding: 4,
  },
  toolbarDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputRowNew: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputContainerNew: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputNew: {
    color: '#fff',
    fontSize: 15,
    minHeight: 44,
    maxHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sendButtonNew: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabledNew: {
    backgroundColor: '#333',
    shadowOpacity: 0,
  },

  // Emoji Picker Styles
  emojiPickerContainer: {
    height: 250,
    backgroundColor: '#1d1f2a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  emojiListContent: {
    padding: 12,
  },
  emojiItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emojiText: {
    fontSize: 26,
  },

  // Side Drawer
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

export default function MuhabbetScreen() {
  const { profile } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
  const toggleFormat = (type: string) => {
    let tag = '';
    switch(type) {
      case 'bold': tag = '**'; break;
      case 'italic': tag = '_'; break;
      case 'underline': tag = '__'; break;
    }

    const { start, end } = selection;
    const selectedText = inputText.substring(start, end);
    const beforeText = inputText.substring(0, start);
    const afterText = inputText.substring(end);

    let newText = '';
    if (selectedText) {
      newText = `${beforeText}${tag}${selectedText}${tag}${afterText}`;
    } else {
      newText = `${beforeText}${tag}${tag}${afterText}`;
    }
    
    setInputText(newText);
  };

  const addEmoji = (emoji: string) => {
    const { start, end } = selection;
    const beforeText = inputText.substring(0, start);
    const afterText = inputText.substring(end);
    const newText = `${beforeText}${emoji}${afterText}`;
    setInputText(newText);
    // Move cursor after emoji
    setSelection({ start: start + emoji.length, end: start + emoji.length });
  };

  const EMOJI_SET_INNER = EMOJI_SET; // Just for reference or local use if needed


  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === profile?.id;
    const isBot = item.sender_id === 'bot-1';
    
    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
        {/* Message Content Group (Top: Name/Time, Bottom: Bubble) */}
        <View style={[styles.messageContent, isMine && styles.messageContentMine]}>
          {/* Sender Name and Time Above Bubble */}
          <View style={[styles.nameTimeRow, isMine ? styles.nameTimeRowMine : styles.nameTimeRowTheirs]}>
            <Text style={styles.timeLabelNew}>{formatTime(item.created_at)}</Text>
            <Text style={[styles.senderLabelNew, isMine && styles.senderLabelMineNew]}>
              {isMine ? 'SİZ' : (item.sender_name || 'Anonim')}
            </Text>
          </View>
          
          {/* Message Bubble */}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, isBot && styles.bubbleBot]}>
            <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
              {item.content}
            </Text>
          </View>
        </View>

        {/* Avatar next to bubble */}
        <View style={[styles.avatarWrapper, isMine ? styles.avatarWrapperMine : styles.avatarWrapperTheirs]}>
          <View style={[styles.avatarCircle, isMine ? styles.avatarCircleMine : styles.avatarCircleTheirs, isBot && styles.botAvatarCircle]}>
            {isBot ? (
              <Bot color="#FF007F" size={16} />
            ) : (
              <Image 
                source={{ uri: (isMine ? profile?.avatar_url : item.avatar_url) || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }} 
                style={styles.avatarImage}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isBotTyping) return null;
    return (
      <View style={[styles.messageRow, styles.messageRowTheirs, { marginBottom: 12 }]}>
         <View style={[styles.avatarWrapper, styles.avatarWrapperTheirs]}>
           <View style={[styles.avatarCircle, styles.botAvatarCircle]}>
              <Bot color="#FF007F" size={16} />
           </View>
         </View>
         <View style={styles.messageContent}>
           <Text style={[styles.senderLabelNew, { color: '#FF007F' }]}>WORKIGOM AI</Text>
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
        {/* Header with Safe Area (Redesigned) */}
        <View style={[
          styles.headerNew, 
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0) + 12 }
        ]}>
          <View style={styles.headerLeftNew}>
            <View style={styles.pinkSquare} />
            <TouchableOpacity style={styles.chatSelector}>
              <Text style={styles.chatSelectorText}>Global Chat</Text>
              <ChevronDown color="#fff" size={16} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRightNew}>
            <TouchableOpacity style={styles.roundIconBtn}>
              <Bell color="#aaaab6" size={20} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.roundIconBtn}
              onPress={() => setShowUsersSidebar(true)}
            >
              <UsersIcon color="#aaaab6" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Pill */}
        <View style={styles.welcomePillContainer}>
          <View style={styles.welcomePill}>
             <Text style={styles.welcomePillText}>GENEL SOHBET. ŞİFRELI OTURUMA HOŞ GELDİNİZ.</Text>
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
            onScroll={() => showEmojiPicker && setShowEmojiPicker(false)}
          />

          {/* Emoji Picker Panel */}
          {showEmojiPicker && (
            <View style={styles.emojiPickerContainer}>
              <FlatList
                data={EMOJI_SET}
                keyExtractor={(item, index) => index.toString()}
                numColumns={8}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.emojiItem} 
                    onPress={() => addEmoji(item)}
                  >
                    <Text style={styles.emojiText}>{item}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.emojiListContent}
              />
            </View>
          )}

          {/* Input Dock (Redesigned & Functional) */}
          <View style={styles.inputDockNew}>
            {/* Formatting Toolbar */}
            <View style={styles.formatToolbar}>
              <TouchableOpacity 
                style={styles.toolbarBtn} 
                onPress={() => toggleFormat('bold')}
              >
                <Bold color={inputText.includes('**') ? '#FF007F' : '#aaaab6'} size={18} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarBtn} 
                onPress={() => toggleFormat('italic')}
              >
                <Italic color={inputText.includes('_') ? '#FF007F' : '#aaaab6'} size={18} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarBtn} 
                onPress={() => toggleFormat('underline')}
              >
                <Underline color={inputText.includes('__') ? '#FF007F' : '#aaaab6'} size={18} />
              </TouchableOpacity>
              
              <View style={styles.toolbarDivider} />
              
              <TouchableOpacity style={styles.toolbarBtn}><Palette color="#aaaab6" size={18} /></TouchableOpacity>
              <TouchableOpacity 
                style={styles.toolbarBtn}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile color={showEmojiPicker ? '#FF007F' : '#aaaab6'} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRowNew}>
              <View style={styles.inputContainerNew}>
                <TextInput
                  style={styles.inputNew}
                  placeholder="Mesajınızı yazın..."
                  placeholderTextColor="#666"
                  value={inputText}
                  onChangeText={setInputText}
                  onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                  multiline
                  maxLength={500}
                />
              </View>

              <TouchableOpacity 
                onPress={handleSend} 
                disabled={!inputText.trim()}
                style={[styles.sendButtonNew, !inputText.trim() && styles.sendButtonDisabledNew]}
              >
                <Send color="#fff" size={20} />
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


