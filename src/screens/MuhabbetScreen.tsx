import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Dimensions, StatusBar as RNStatusBar, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMuhabbetStore } from '../store/useMuhabbetStore';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import { useBlockStore } from '../store/useBlockStore';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Send, Globe, Users as UsersIcon, X, Bot, ChevronDown, Bell, User, Bold, Italic, Underline, Palette, Smile, Type, MessageSquareWarning, Image as ImageIcon, Mic, Square } from 'lucide-react-native';
import { MessageService } from '../services/messageService';
import { useNotificationStore } from '../store/useNotificationStore';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const COLOR_SET = ['#FF007F', '#00FF00', '#00FFFF', '#FFFF00', '#BF00FF', '#FF8000', '#FF0000', '#0080FF'];

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
  messageContentTheirs: {
    alignItems: 'flex-start',
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
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  senderLabelNew: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  senderLabelMineNew: {
    color: '#94a3b8',
  },

  // Bubble
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: '#4f46e5', // bg-indigo-600
    borderTopLeftRadius: 16,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#1e293b', // bg-slate-800
    borderTopLeftRadius: 2,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  bubbleBot: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#ffffff',
    fontWeight: '500',
  },
  messageTextTheirs: {
    color: '#f1f5f9', // text-slate-100
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

  // Color Picker Styles
  colorPickerContainer: {
    padding: 16,
    backgroundColor: '#1d1f2a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  colorListContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  colorItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  // Dropdown
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 100, // Adjusted by insets in code
    left: 20,
    width: 200,
    backgroundColor: '#1d1f2a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
  },
  dropdownText: {
    color: '#aaaab6',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownTextActive: {
    color: '#FF007F',
    fontWeight: '900',
  },
});

const PulsingName = ({ name, isUnread, style }: { name: string, isUnread: boolean, style: any }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isUnread) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isUnread]);

  return (
    <Animated.Text style={[style, isUnread && { opacity: pulse, color: '#FF007F', textShadowColor: '#FF007F', textShadowRadius: 8 }]}>
      {name}
    </Animated.Text>
  );
};


export default function MuhabbetScreen() {
  const { profile } = useAuthStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { unreadMessageCount } = useNotificationStore();
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Audio Recording States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const {
    messages,
    onlineUsers,
    presenceList,
    initializeRoom,
    sendMessage,
    leaveRoom,
    activePrivateTab,
    privateMessages,
    unreadPrivate,
    incomingInvite,
    openPrivateChat: openPrivateRoom,
    closePrivateChat,
    sendPrivateMessage,
    acceptInvite,
    declineInvite
  } = useMuhabbetStore();
  const { unreadSenderIds } = useNotificationStore();

  const [inputText, setInputText] = useState('');
  const [showUsersSidebar, setShowUsersSidebar] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('genel');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const { blockedUsers, fetchBlocks, blockUser, unblockUser, isBlocked } = useBlockStore();

  useEffect(() => {
    fetchBlocks();
  }, [profile?.id]);


  const slideAnim = useRef(new Animated.Value(-width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unreadMessageCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [unreadMessageCount]);

  const lastTapRef = useRef<number>(0);

  const openPrivateChat = (selectedUser: {id: string, name: string}) => {
    if (selectedUser.id === profile?.id || selectedUser.id === 'bot-1' || isBlocked(selectedUser.id)) return;
    openPrivateRoom(selectedUser);
    setShowUsersSidebar(false);
  };

  const handleUserDoubleTap = (selectedUser: {id: string, name: string}) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_PRESS_DELAY) {
      openPrivateChat(selectedUser);
    } else {
      lastTapRef.current = now;
    }
  };

  const ROOM_NAME = 'genel';

  useEffect(() => {
    if (profile?.id) {
      initializeRoom(currentRoom, profile.id, profile);
    }
    return () => leaveRoom();
  }, [profile?.id, currentRoom]);


  // Sidebar Slide Animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showUsersSidebar ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showUsersSidebar]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      if (activePrivateTab) {
        await sendPrivateMessage(activePrivateTab.id, inputText.trim(), activePrivateTab.name);
      } else {
        await sendMessage('genel', {
          sender_id: profile?.id,
          sender_name: profile?.full_name || 'Anonim',
          avatar_url: profile?.avatar_url || '',
          content: inputText.trim()
        });
      }
      setInputText('');
      setShowEmojiPicker(false);
      setShowColorPicker(false);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true, // We need base64 for ephemeral broadcast
      });

      if (!result.canceled && result.assets[0].base64) {
        setImageLoading(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        // Approximate size check
        const sizeInBytes = Math.ceil((base64Image.length * 3) / 4);
        if (sizeInBytes > 700 * 1024) {
           alert('Görsel sıkıştırılmasına rağmen çok büyük.');
           setImageLoading(false);
           return;
        }

        if (activePrivateTab) {
          await sendPrivateMessage(activePrivateTab.id, 'Görsel paylaşıldı.', activePrivateTab.name, base64Image);
        } else {
          // Send to global using Web compat schema ('event: image-share')
          const { currentBroadcastChannel } = useMuhabbetStore.getState();
          if (currentBroadcastChannel) {
             const payload = {
                id: Math.random().toString(),
                text: 'Görsel paylaşıldı.',
                senderId: profile?.id,
                senderName: profile?.full_name || 'Anonim',
                senderAvatar: profile?.avatar_url || '',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                imageUrl: base64Image,
                roomId: 'public-chat'
             };
             await currentBroadcastChannel.send({ type: 'broadcast', event: 'image-share', payload });
             useMuhabbetStore.getState().addMessage({
                id: payload.id,
                sender_id: payload.senderId,
                sender_name: payload.senderName,
                avatar_url: payload.senderAvatar,
                content: payload.text,
                created_at: new Date().toISOString(),
                imageUrl: base64Image
             });
          }
        }
        setImageLoading(false);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      setImageLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('Mikrofon izni reddedildi');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY
      );
      setRecording(recording);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Kayıt başlatılamadı:', err);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        // Read file using fetch since expo-file-system requires native install rebuild
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Audio = reader.result as string;
          if (activePrivateTab) {
            await sendPrivateMessage(activePrivateTab.id, 'Ses paylaşıldı.', activePrivateTab.name, undefined, base64Audio);
          } else {
            const { currentBroadcastChannel } = useMuhabbetStore.getState();
            if (currentBroadcastChannel) {
               const payload = {
                  id: Math.random().toString(),
                  text: 'Ses paylaşıldı.',
                  senderId: profile?.id,
                  senderName: profile?.full_name || 'Anonim',
                  senderAvatar: profile?.avatar_url || '',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  audioUrl: base64Audio,
                  roomId: 'public-chat'
               };
               await currentBroadcastChannel.send({ type: 'broadcast', event: 'audio-share', payload });
               useMuhabbetStore.getState().addMessage({
                  id: payload.id,
                  sender_id: payload.senderId,
                  sender_name: payload.senderName,
                  avatar_url: payload.senderAvatar,
                  content: payload.text,
                  created_at: new Date().toISOString(),
                  audioUrl: base64Audio
               });
            }
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.error('Kayıt durdurulamadı:', err);
    }
  };

  const getRoomDisplayName = (room: string) => {
    switch (room) {
      case 'genel': return 'Global Chat';
      case 'pazar': return 'Pazar Alanı';
      case 'destek': return 'Yardımlaşma';
      case 'goygoy': return 'Goygoy';
      default: return 'Sohbet';
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
    switch (type) {
      case 'bold': tag = '**'; break;
      case 'italic': tag = '_'; break;
      case 'underline': tag = '__'; break;
    }

    const { start, end } = selection;
    const selectedText = inputText.substring(start, end);
    const beforeText = inputText.substring(0, start);
    const afterText = inputText.substring(end);

    let newText = '';
    let newSelection = { start, end };

    if (start !== end) {
      // Wrap selection
      newText = `${beforeText}${tag}${selectedText}${tag}${afterText}`;
      newSelection = { start: start + tag.length, end: end + tag.length };
    } else {
      // Empty selection: insert tags and place cursor in middle
      newText = `${beforeText}${tag}${tag}${afterText}`;
      newSelection = { start: start + tag.length, end: start + tag.length };
    }

    setInputText(newText);
    setSelection(newSelection);
  };

  const applyColor = (color: string) => {
    const { start, end } = selection;
    const selectedText = inputText.substring(start, end);
    const beforeText = inputText.substring(0, start);
    const afterText = inputText.substring(end);

    const openTag = `[color=${color}]`;
    const closeTag = `[/color]`;

    let newText = '';
    let newSelection = { start, end };

    if (start !== end) {
      newText = `${beforeText}${openTag}${selectedText}${closeTag}${afterText}`;
      newSelection = { start: start + openTag.length, end: end + openTag.length };
    } else {
      newText = `${beforeText}${openTag}${closeTag}${afterText}`;
      newSelection = { start: start + openTag.length, end: start + openTag.length };
    }

    setInputText(newText);
    setSelection(newSelection);
    setShowColorPicker(false);
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

  const renderMessage = ({ item: msg }: { item: any }) => {
    const isMine = msg.sender_id === profile?.id;
    const isBot = msg.sender_id === 'bot-1';

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
        {/* Message Content */}
        <View style={isMine ? styles.messageContentMine : styles.messageContentTheirs}>
          <View style={isMine ? styles.nameTimeRowMine : styles.nameTimeRowTheirs}>
            {!isMine && (
              <Text 
                style={styles.senderLabelNew}
                onLongPress={() => {
                  const targetUser = presenceList.find(u => u.id === msg.sender_id);
                  if (targetUser && typeof unblockUser === 'function') {
                     // Extra action if needed
                  }
                }}
              >
                {msg.sender_name}
              </Text>
            )}
            <Text style={styles.timeLabelNew}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <View style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            msg.sender_id === 'bot-1' && styles.bubbleBot
          ]}>
            {msg.imageUrl && (
              <Image source={{ uri: msg.imageUrl }} style={{ width: 200, height: 200, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
            )}
            {msg.audioUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isMine ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 12, gap: 8 }}>
                <Mic size={16} color={isMine ? "#fff" : "#cbd5e1"} />
                <Text style={isMine ? styles.messageTextMine : styles.messageTextTheirs}>Ses Mesajı Oynatılamıyor</Text>
              </View>
            ) : (
              <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
                {msg.content}
              </Text>
            )}
          </View>
        </View>

        {/* Avatar next to bubble */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => handleUserDoubleTap({ id: msg.sender_id, name: msg.sender_name || 'Anonim' })}
          style={[styles.avatarWrapper, isMine ? styles.avatarWrapperMine : styles.avatarWrapperTheirs]}
        >
          <View style={[styles.avatarCircle, isMine ? styles.avatarCircleMine : styles.avatarCircleTheirs, isBot && styles.botAvatarCircle]}>
            {isBot ? (
              <Bot color="#FF007F" size={16} />
            ) : (
              <Image
                source={{ uri: (isMine ? profile?.avatar_url : msg.avatar_url) || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                style={styles.avatarImage}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isBotTyping) return null;
    return (
      <View style={[styles.messageRow, styles.messageRowTheirs, { marginBottom: 12 }]}>
        <View style={[styles.avatarWrapper, styles.avatarWrapperTheirs]}>
          <View style={[styles.avatarCircle, styles.botAvatarCircle, { borderColor: '#4f46e5' }]}>
            <Bot color="#4f46e5" size={16} />
          </View>
        </View>
        <View style={[styles.messageContent, styles.messageContentTheirs]}>
          <View style={[styles.nameTimeRow, styles.nameTimeRowTheirs]}>
            <Text style={styles.senderLabelNew}>WORKIGOM AI</Text>
          </View>
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
            {activePrivateTab ? (
              <View style={styles.chatSelector}>
                <Text style={styles.chatSelectorText}>Özel: {activePrivateTab.name}</Text>
                <TouchableOpacity onPress={closePrivateChat} style={{ marginLeft: 8 }}>
                  <X color="#FF007F" size={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.chatSelector} onPress={() => setShowRoomDropdown(true)}>
                <Text style={styles.chatSelectorText}>{getRoomDisplayName(currentRoom)}</Text>
                <ChevronDown color="#fff" size={16} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerRightNew}>
            {unreadMessageCount > 0 ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity style={[styles.roundIconBtn, { backgroundColor: 'rgba(255,0,0,0.2)' }]} onPress={() => setShowUsersSidebar(true)}>
                  <MessageSquareWarning color="#FF007F" size={20} />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity style={styles.roundIconBtn}>
                <Bell color="#aaaab6" size={20} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.roundIconBtn}
              onPress={() => setShowUsersSidebar(true)}
            >
              <UsersIcon color="#aaaab6" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Pill */}
        {!activePrivateTab && (
          <View style={styles.welcomePillContainer}>
            <View style={styles.welcomePill}>
              <Text style={styles.welcomePillText}>GENEL SOHBET. ŞİFRELI OTURUMA HOŞ GELDİNİZ.</Text>
            </View>
          </View>
        )}
        
        {incomingInvite && (
          <View style={{ backgroundColor: 'rgba(255, 0, 127, 0.15)', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF007F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{incomingInvite.name} size özel oda açtı!</Text>
              <Text style={{ color: '#aaaab6', fontSize: 11, marginTop: 4 }}>Mesaja yanıt vermek için katılın.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={declineInvite} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Reddet</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={acceptInvite} style={{ padding: 8, backgroundColor: '#FF007F', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Katıl</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : -40}
        >

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={activePrivateTab ? (privateMessages[activePrivateTab.id] || []) : messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            ListHeaderComponent={renderTypingIndicator} // Bottom in inverted

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

          {/* Color Picker Panel */}
          {showColorPicker && (
            <View style={styles.colorPickerContainer}>
              <View style={styles.colorListContent}>
                {COLOR_SET.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.colorItem, { backgroundColor: color }]}
                    onPress={() => applyColor(color)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Input Dock (Redesigned & Functional) */}
          <View style={[styles.inputDockNew, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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

              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowEmojiPicker(false);
                }}
              >
                <Palette color={showColorPicker ? '#FF007F' : '#aaaab6'} size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowColorPicker(false);
                }}
              >
                <Smile color={showEmojiPicker ? '#FF007F' : '#aaaab6'} size={18} />
              </TouchableOpacity>

              {!!activePrivateTab && (
                <>
                  <View style={styles.toolbarDivider} />

                  {!recording && (
                    <TouchableOpacity
                      style={styles.toolbarBtn}
                      onPress={handlePickImage}
                      disabled={imageLoading}
                    >
                      <ImageIcon color={imageLoading ? '#444' : '#aaaab6'} size={18} />
                    </TouchableOpacity>
                  )}
                  {recording ? (
                    <TouchableOpacity
                      style={[styles.toolbarBtn, { backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 8, paddingHorizontal: 8 }]}
                      onPress={stopRecordingAndSend}
                    >
                      <Square color="#FF0000" size={14} fill="#FF0000" />
                      <Text style={{ color: '#FF0000', fontSize: 10, marginLeft: 4, fontWeight: 'bold' }}>{recordingTime}s</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.toolbarBtn}
                      onPress={startRecording}
                    >
                      <Mic color="#aaaab6" size={18} />
                    </TouchableOpacity>
                  )}
                </>
              )}
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
            renderItem={({ item }) => {
              const blocked = isBlocked(item?.id);
              return (
              <TouchableOpacity 
                style={[styles.drawerUserRow, blocked && { opacity: 0.5 }]}
                onPress={() => {
                  if (!blocked) {
                    setShowUsersSidebar(false);
                    openPrivateChat({ id: item?.id, name: item?.name });
                  }
                }}
              >
                <View style={[styles.drawerAvatar, item?.id === profile?.id && { backgroundColor: '#FF007F', borderColor: '#FF007F' }]}>
                  <Text style={[styles.drawerAvatarText, item?.id === profile?.id && { color: '#ffffff' }]}>
                    {(item?.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.drawerUserInfo}>
                  <PulsingName 
                    name={item?.name} 
                    isUnread={unreadSenderIds.includes(item?.id) || unreadPrivate.includes(item?.id)}
                    style={[styles.drawerUserName, blocked && { textDecorationLine: 'line-through', color: '#ff4d4d' }]}
                  />
                  <Text style={styles.drawerUserSub}>
                    {item?.id === profile?.id ? 'SİZ' : (blocked ? 'ENGELLENDİ' : 'KATILIMCI')}
                  </Text>
                </View>
                
                {item?.id !== profile?.id && item?.id !== 'bot-1' && (
                  <TouchableOpacity
                    style={{ padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}
                    onPress={async (e) => {
                      e.stopPropagation();
                      if (blocked) {
                        await unblockUser(item.id);
                      } else {
                        await blockUser(item.id);
                        if (activePrivateTab?.id === item.id) closePrivateChat();
                      }
                    }}
                  >
                    <X color={blocked ? "#ff4d4d" : "#aaaab6"} size={16} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}}
            ListHeaderComponent={(
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.drawerSectionTitle}>DROIDS (Yapay Zeka)</Text>
                <View style={[styles.drawerUserRow, { marginTop: 8 }]}>
                  <View style={[styles.drawerAvatar, { backgroundColor: '#0a0b1e', borderColor: 'rgba(255, 0, 127, 0.4)' }]}>
                    <Bot color="#FF007F" size={16} />
                  </View>
                  <View style={styles.drawerUserInfo}>
                    <Text style={[styles.drawerUserName, { color: '#FF007F' }]}>Workigom AI</Text>
                    <Text style={styles.drawerUserSub}>Geçerli Oda: {getRoomDisplayName(currentRoom)}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        </Animated.View>

        {/* Room Dropdown Modal */}
        <Modal 
          visible={showRoomDropdown} 
          transparent 
          animationType="fade" 
          onRequestClose={() => setShowRoomDropdown(false)}
        >
          <TouchableOpacity 
            style={styles.dropdownModalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowRoomDropdown(false)}
          >
            <View style={[styles.dropdownContainer, { top: insets.top + 60 }]}>
              {['genel', 'pazar', 'destek', 'goygoy'].map((room) => (
                <TouchableOpacity
                  key={room}
                  style={[styles.dropdownItem, currentRoom === room && styles.dropdownItemActive]}
                  onPress={() => {
                    setCurrentRoom(room);
                    setShowRoomDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, currentRoom === room && styles.dropdownTextActive]}>
                    {getRoomDisplayName(room)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Layout>
  );
}


