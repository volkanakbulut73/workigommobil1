import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
  Animated, StatusBar as RNStatusBar, Modal, Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import { useBlockStore } from '../store/useBlockStore';
import {
  ChevronLeft, Send, Image as ImageIcon, Mic, MicOff,
  ShieldBan, ShieldCheck, MoreVertical, X, Play, Pause, Trash2
} from 'lucide-react-native';
import { MessageService } from '../services/messageService';
import { supabase } from '../lib/supabase';
// @ts-ignore
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore
import { Audio } from 'expo-av';
import { decode } from 'base64-arraybuffer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Audio Player Component ────────────────────────────────────────────
const AudioPlayer = React.memo(({ uri }: { uri: string }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const togglePlay = async () => {
    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status: any) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            setPosition(status.positionMillis || 0);
            if (status.durationMillis) {
              const progress = status.positionMillis / status.durationMillis;
              progressAnim.setValue(progress);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              progressAnim.setValue(0);
            }
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio play error:', err);
    }
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity style={audioStyles.container} onPress={togglePlay} activeOpacity={0.8}>
      <View style={audioStyles.playBtn}>
        {isPlaying ? <Pause color="#fff" size={14} /> : <Play color="#fff" size={14} />}
      </View>
      <View style={audioStyles.waveform}>
        <View style={audioStyles.trackBg}>
          <Animated.View style={[audioStyles.trackFill, {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
          }]} />
        </View>
        <Text style={audioStyles.timeText}>{formatMs(position)} / {formatMs(duration)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const audioStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255, 0, 127, 0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 0, 127, 0.5)',
  },
  waveform: { flex: 1, gap: 4 },
  trackBg: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#FF007F',
  },
  timeText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
});


// ─── Message Bubble ────────────────────────────────────────────────────
const MessageBubble = React.memo(({ item, isMe, onDelete }: { item: any, isMe: boolean, onDelete: (id: string) => void }) => {
  const isImage = item.content?.startsWith('[img]') && item.content?.endsWith('[/img]');
  const isAudio = item.content?.startsWith('[audio]') && item.content?.endsWith('[/audio]');

  let mediaUrl = '';
  if (isImage) mediaUrl = item.content.replace('[img]', '').replace('[/img]', '');
  if (isAudio) mediaUrl = item.content.replace('[audio]', '').replace('[/audio]', '');

  return (
    <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
      <TouchableOpacity
        style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}
        onLongPress={() => isMe ? onDelete(item.id) : null}
        delayLongPress={400}
        activeOpacity={isMe ? 0.7 : 1}
      >
        {isImage ? (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        ) : isAudio ? (
          <AudioPlayer uri={mediaUrl} />
        ) : (
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>
        )}
        <View style={styles.timestampRow}>
          <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampOther]}>
            {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && item.status === 'sending' && (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

// ─── Main ChatScreen ───────────────────────────────────────────────────
export function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { threadId, title, receiverId: routeReceiverId } = route.params || {};
  const profile = useAuthStore(state => state.profile);

  const messages = useMessageStore(state => state.messages);
  const loading = useMessageStore(state => state.loading);
  const fetchMessages = useMessageStore(state => state.fetchMessages);
  const sendMessage = useMessageStore(state => state.sendMessage);
  const subscribeToThread = useMessageStore(state => state.subscribeToThread);
  const unsubscribe = useMessageStore(state => state.unsubscribe);
  const markThreadAsRead = useMessageStore(state => state.markThreadAsRead);
  const deleteMessage = useMessageStore(state => state.deleteMessage);

  const { isBlocked, blockUser, unblockUser, fetchBlocks } = useBlockStore();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [threadDetails, setThreadDetails] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Determine receiver ID
  const receiverId = routeReceiverId ||
    (threadDetails ? (profile?.id === threadDetails.buyer_id ? threadDetails.seller_id : threadDetails.buyer_id) : '');

  const otherUserBlocked = receiverId ? isBlocked(receiverId) : false;

  useEffect(() => {
    fetchBlocks();
  }, []);

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

  // Recording pulse animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // ─── Image Picker ─────────────────────────────────────────────────
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gereklidir.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert('Hata', 'Fotoğraf okunamadı.');
          return;
        }
        setUploading(true);
        try {
          const fileExt = asset.uri.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${profile?.id}.${fileExt}`;
          const filePath = `chat-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('chat_media')
            .upload(filePath, decode(asset.base64), {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            Alert.alert('Hata', 'Fotoğraf yüklenemedi: ' + uploadError.message);
            return;
          }

          const { data: urlData } = supabase.storage
            .from('chat_media')
            .getPublicUrl(filePath);

          const imageUrl = urlData.publicUrl;
          const content = `[img]${imageUrl}[/img]`;

          await sendMessage(threadId, profile!.id, receiverId, content);
        } catch (err) {
          console.error('Image upload error:', err);
          Alert.alert('Hata', 'Fotoğraf gönderilirken bir sorun oluştu.');
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  // ─── Audio Recording ──────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Ses kaydı için mikrofon izni gereklidir.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Start recording error:', err);
      Alert.alert('Hata', 'Ses kaydı başlatılamadı.');
    }
  };

  const stopAndSendRecording = async () => {
    if (!recording) return;

    clearInterval(recordTimerRef.current!);
    setIsRecording(false);
    setUploading(true);

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        Alert.alert('Hata', 'Ses kaydı alınamadı.');
        return;
      }

      // Read as base64
      const response = await fetch(uri);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Data = await base64Promise;
      const fileName = `${Date.now()}_${profile?.id}.m4a`;
      const filePath = `chat-audio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, decode(base64Data), {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) {
        console.error('Audio upload error:', uploadError);
        Alert.alert('Hata', 'Ses dosyası yüklenemedi: ' + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat_media')
        .getPublicUrl(filePath);

      const audioUrl = urlData.publicUrl;
      const content = `[audio]${audioUrl}[/audio]`;
      await sendMessage(threadId, profile!.id, receiverId, content);
    } catch (err) {
      console.error('Audio send error:', err);
      Alert.alert('Hata', 'Ses kaydı gönderilemedi.');
    } finally {
      setUploading(false);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    clearInterval(recordTimerRef.current!);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (err) { /* ignore */ }
    setRecording(null);
    setIsRecording(false);
    setRecordDuration(0);
  };

  // ─── Block/Unblock ────────────────────────────────────────────────
  const handleBlock = () => {
    if (!receiverId) return;
    setShowMenu(false);

    if (otherUserBlocked) {
      Alert.alert('Engeli Kaldır', 'Bu kullanıcının engelini kaldırmak istiyor musunuz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Engeli Kaldır', onPress: () => unblockUser(receiverId) },
      ]);
    } else {
      Alert.alert(
        'Kullanıcıyı Engelle',
        'Bu kullanıcıyı engellemek istiyor musunuz? Engellenen kullanıcı size mesaj gönderemez ve mesajları görünmez olur.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Engelle', style: 'destructive', onPress: () => blockUser(receiverId) },
        ]
      );
    }
  };

  // ─── Send Text ────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputText.trim() || !profile || !threadId || !receiverId) return;

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
        { text: "Sil", style: "destructive", onPress: () => deleteMessage(msgId, profile?.id || '', threadId) }
      ]
    );
  }, [profile?.id, deleteMessage, threadId]);

  const renderMessage = useCallback(({ item }: { item: any }) => {
    const isMe = item.sender_id === profile?.id;
    return <MessageBubble item={item} isMe={isMe} onDelete={handleDelete} />;
  }, [profile?.id, handleDelete]);

  const keyExtractor = useCallback((item: any, index: number) => item.id || index.toString(), []);

  const formatRecordTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0) + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarSmall}>
            <Text style={styles.headerAvatarText}>
              {(title || 'S')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Sohbet'}</Text>
            <Text style={styles.headerSubtitle}>Özel Mesaj</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleBlock} style={styles.blockHeaderBtn}>
            <ShieldBan color="#FF007F" size={16} />
            <Text style={styles.blockBtnText}>ENGELLE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuBtn}>
            <MoreVertical color="#aaaab6" size={20} />
          </TouchableOpacity>
        </View>

      </View>

      {/* Block status banner */}
      {otherUserBlocked && (
        <View style={styles.blockedBanner}>
          <ShieldBan color="#FF007F" size={14} />
          <Text style={styles.blockedBannerText}>Bu kullanıcı engellenmiş</Text>
          <TouchableOpacity onPress={handleBlock}>
            <Text style={styles.unblockLink}>Engeli Kaldır</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Listing Info (if from market) ───────────────────────── */}
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

      {/* ─── Messages ────────────────────────────────────────────── */}
      <View style={styles.chatArea}>
        {loading && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color="#FF007F" size="large" />
            <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Send color="#FF007F" size={28} />
            </View>
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptySub}>İlk mesajı göndererek sohbeti başlatın!</Text>
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

      {/* ─── Upload Indicator ────────────────────────────────────── */}
      {uploading && (
        <View style={styles.uploadingBar}>
          <ActivityIndicator size="small" color="#FF007F" />
          <Text style={styles.uploadingText}>Dosya yükleniyor...</Text>
        </View>
      )}

      {/* ─── Recording UI ────────────────────────────────────────── */}
      {isRecording ? (
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.cancelRecordBtn} onPress={cancelRecording}>
            <X color="#FF007F" size={20} />
          </TouchableOpacity>

          <View style={styles.recordingInfo}>
            <Animated.View style={[styles.recordDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.recordingText}>Kayıt yapılıyor</Text>
            <Text style={styles.recordingTimer}>{formatRecordTime(recordDuration)}</Text>
          </View>

          <TouchableOpacity style={styles.sendRecordBtn} onPress={stopAndSendRecording}>
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      ) : (
        /* ─── Input Area ─────────────────────────────────────────── */
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage} disabled={uploading}>
            <ImageIcon color={uploading ? '#333' : '#FF007F'} size={20} />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Bir mesaj yazın..."
              placeholderTextColor="#555"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!otherUserBlocked}
            />
          </View>

          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
              <Send color="#fff" size={18} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn} onPress={startRecording} disabled={uploading}>
              <Mic color={uploading ? '#333' : '#FF007F'} size={20} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Menu Modal ──────────────────────────────────────────── */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>İŞLEMLER</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <X color="#aaaab6" size={18} />
              </TouchableOpacity>
            </View>
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
              {otherUserBlocked ? (
                <>
                  <ShieldCheck color="#8eff71" size={18} />
                  <Text style={[styles.menuItemText, { color: '#8eff71' }]}>Engeli Kaldır</Text>
                </>
              ) : (
                <>
                  <ShieldBan color="#FF007F" size={18} />
                  <Text style={[styles.menuItemText, { color: '#FF007F' }]}>Kullanıcıyı Engelle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e16',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#aaaab6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(12, 14, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  headerAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1d1f2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.3)',
  },
  headerAvatarText: {
    color: '#FF007F',
    fontSize: 14,
    fontWeight: '900',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  headerSubtitle: {
    color: '#aaaab6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.3)',
  },
  blockBtnText: {
    color: '#FF007F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  // Blocked Banner
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 0, 127, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 0, 127, 0.15)',
  },
  blockedBannerText: {
    color: '#FF007F',
    fontSize: 12,
    fontWeight: '600',
  },
  unblockLink: {
    color: '#8eff71',
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },

  // Listing
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(29, 31, 42, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  listingThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listingInfo: { flex: 1 },
  listingTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  listingPrice: {
    color: '#8eff71',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Chat Area
  chatArea: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 0, 127, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.2)',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySub: {
    color: '#aaaab6',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Messages
  messageWrapper: {
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
  },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperOther: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: '#4f46e5',
    borderTopRightRadius: 4,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  messageBubbleOther: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#ffffff',
    fontWeight: '500',
  },
  messageTextOther: {
    color: '#f1f5f9',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '600',
  },
  timestampMe: { color: 'rgba(255, 255, 255, 0.5)' },
  timestampOther: { color: '#64748b' },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },

  // Upload
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 0, 127, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 0, 127, 0.1)',
  },
  uploadingText: {
    color: '#FF007F',
    fontSize: 12,
    fontWeight: '600',
  },

  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1d1f2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 127, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.15)',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    color: '#fff',
    fontSize: 14,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 127, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 127, 0.15)',
  },

  // Recording
  cancelRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF007F',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  recordingText: {
    color: '#FF007F',
    fontSize: 13,
    fontWeight: 'bold',
  },
  recordingTimer: {
    color: '#aaaab6',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sendRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF007F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF007F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: '#1d1f2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuTitle: {
    color: '#aaaab6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
