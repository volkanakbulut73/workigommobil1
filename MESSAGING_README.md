# Workigom Mesajlaşma Sistemi — Yapılandırma Kılavuzu

Bu belge, Workigom mesajlaşma sisteminin **Supabase**, **Mobil (React Native/Expo)** ve **Web (React/Vite)** yapılandırmasını eksiksiz olarak belgelemektedir. Bir şey bozulduğunda bu dosyaya bakarak sistemi sıfırdan yeniden yapılandırabilirsiniz.

> **Son güncelleme:** 2026-03-30

---

## 1. SUPABASE VERİTABANI ŞEMASI

### 1.1 `messages` Tablosu

| Kolon        | Tip          | Varsayılan        | Açıklama                          |
|-------------|-------------|-------------------|-----------------------------------|
| `id`         | uuid         | `gen_random_uuid()` | Primary key                     |
| `thread_id`  | uuid         | —                 | İlişkili sohbet odası (FK → threads) |
| `sender_id`  | uuid         | —                 | Gönderen kullanıcı (FK → profiles) |
| `receiver_id`| uuid         | —                 | Alıcı kullanıcı (FK → profiles)   |
| `content`    | text         | —                 | Mesaj içeriği                     |
| `read`       | bool         | `false`           | Okundu mu?                        |
| `created_at` | timestamptz  | `now()`           | Oluşturulma zamanı                |

### 1.2 `threads` Tablosu

| Kolon          | Tip          | Varsayılan        | Açıklama                         |
|---------------|-------------|-------------------|----------------------------------|
| `id`           | uuid         | `gen_random_uuid()` | Primary key                    |
| `listing_id`   | uuid         | nullable          | İlişkili ilan (FK → swap_listings) |
| `buyer_id`     | uuid         | —                 | Alıcı taraf (FK → profiles)      |
| `seller_id`    | uuid         | —                 | Satıcı taraf (FK → profiles)     |
| `type`         | text         | —                 | `'market'`, `'task'`, `'private'` |
| `last_message` | text         | nullable          | Son mesaj önizlemesi              |
| `updated_at`   | timestamptz  | `now()`           | Son güncelleme zamanı             |
| `created_at`   | timestamptz  | `now()`           | Oluşturulma zamanı                |

### 1.3 `notifications` Tablosu

| Kolon       | Tip          | Varsayılan        | Açıklama                          |
|------------|-------------|-------------------|-----------------------------------|
| `id`        | uuid         | `gen_random_uuid()` | Primary key                     |
| `user_id`   | uuid         | —                 | Bildirim sahibi (FK → profiles)   |
| `type`      | text         | —                 | Bildirim tipi                     |
| `title`     | text         | —                 | Bildirim başlığı                  |
| `content`   | text         | —                 | Bildirim içeriği                  |
| `link`      | text         | —                 | Yönlendirme linki                 |
| `read`      | bool         | `false`           | Okundu mu?                        |
| `created_at`| timestamptz  | `now()`           | Oluşturulma zamanı                |

---

## 2. SUPABASE RLS (ROW LEVEL SECURITY) POLİTİKALARI

**ÖNEMLİ:** Aşağıdaki politikalar olmadan uygulama sessizce çalışmaz — hata fırlatmaz ama veri okuyamaz/yazamaz/silemez/güncelleyemez.

### 2.1 `messages` Tablosu Politikaları

```sql
-- 1. SELECT: Kullanıcılar kendi gönderdiği veya aldığı mesajları okuyabilir
CREATE POLICY "Kullanıcılar kendi mesajlarını okuyabilir" ON "public"."messages"
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. INSERT: Kullanıcılar mesaj gönderebilir
CREATE POLICY "Kullanıcılar mesaj gönderebilir" ON "public"."messages"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() = sender_id);

-- 3. UPDATE: Alıcı mesajı okundu olarak işaretleyebilir
CREATE POLICY "Alıcı mesajları okundu işaretleyebilir" ON "public"."messages"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 4. DELETE: Gönderen kendi mesajını silebilir
CREATE POLICY "Kullanıcılar kendi mesajlarını silebilir" ON "public"."messages"
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() = sender_id);
```

### 2.2 `threads` Tablosu Politikaları

```sql
-- 1. SELECT: Kullanıcılar kendi dahil olduğu sohbetleri görebilir
CREATE POLICY "Kullanıcılar kendi sohbetlerini görebilir" ON "public"."threads"
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 2. INSERT: Kullanıcılar sohbet başlatabilir
CREATE POLICY "Kullanıcılar sohbet başlatabilir" ON "public"."threads"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 3. UPDATE: Kullanıcılar kendi sohbetlerini güncelleyebilir (last_message vb.)
CREATE POLICY "Kullanıcılar kendi sohbetlerini güncelleyebilir" ON "public"."threads"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 4. DELETE: Kullanıcılar kendi sohbetlerini silebilir
CREATE POLICY "Kullanıcılar sohbetlerini silebilir" ON "public"."threads"
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

### 2.3 `notifications` Tablosu Politikaları

```sql
-- 1. SELECT: Kullanıcılar kendi bildirimlerini görebilir
CREATE POLICY "Kullanıcılar kendi bildirimlerini görebilir" ON "public"."notifications"
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = user_id);

-- 2. INSERT: Sistem bildirim oluşturabilir
CREATE POLICY "Bildirim oluşturma" ON "public"."notifications"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- 3. UPDATE: Kullanıcılar kendi bildirimlerini okundu işaretleyebilir
CREATE POLICY "Kullanıcılar bildirimlerini güncelleyebilir" ON "public"."notifications"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = user_id);
```

---

## 3. SUPABASE REALTIME YAPILANDIRMASI

**Supabase Dashboard → Database → Publications (Replication)**

`supabase_realtime` yayınında aşağıdaki tablolar **AKTİF** olmalıdır:

| Tablo           | Realtime | Açıklama                                     |
|----------------|----------|----------------------------------------------|
| `messages`      | ✅ AÇIK   | Yeni mesaj, okundu işareti, silme olayları   |
| `threads`       | ✅ AÇIK   | Sohbet güncelleme/silme olayları             |
| `notifications` | ✅ AÇIK   | Bildirim güncelleme olayları                 |

**Bu açılmazsa:** Uygulama mesajları/bildirimleri anlık olarak alamaz, sayfa yenilenmesi gerekir.

---

## 4. MİMARİ — BİLDİRİM VE BADGE SİSTEMİ

### 4.1 Tasarım Felsefesi

- **Zil ikonu (Bell):** Yalnızca platform bildirimleri (görev kabul, market hareketi vb.) gösterir. **Mesaj bildirimleri burada GÖSTERILMEZ.**
- **Mesaj ikonu (MessageCircle):** Header'daki mesaj simgesi üzerinde `unreadMessageCount` badge'i gösterir.
- **Muhabbet sekmesi:** Grup sohbeti (broadcast) için. Birebir mesajlarla ilgisi yoktur, badge konulmaz.

### 4.2 Okunmamış Mesaj Sayısı Nasıl Hesaplanır?

Her iki platformda da `messages` tablosu doğrudan sorgulanır:

```sql
SELECT count(*) FROM messages WHERE receiver_id = '{userId}' AND read = false;
```

**ÖNEMLİ:** Eski sistem `notifications` tablosundan `type = 'new_message'` satırlarını sayıyordu. Bu kaldırıldı çünkü mesaj gönderilirken artık `notifications` tablosuna kayıt **oluşturulmaz**.

### 4.3 Okunmamış Thread'ler

```sql
SELECT DISTINCT thread_id FROM messages WHERE receiver_id = '{userId}' AND read = false;
```

Bu liste, mesajlar listesinde hangi sohbetin yanında mavi nokta (unread badge) gösterileceğini belirler.

---

## 5. MOBİL MİMARİ (React Native / Expo)

### 5.1 Dosya Yapısı

```
mobile/src/
├── services/
│   ├── messageService.ts      ← Supabase CRUD işlemleri
│   └── realtimeService.ts     ← Realtime kanal yönetimi
├── store/
│   ├── useMessageStore.ts     ← Mesaj state (Zustand)
│   ├── useNotificationStore.ts ← Bildirim state + Realtime dinleyiciler
│   └── useMuhabbetStore.ts    ← Grup sohbet state (broadcast)
├── screens/
│   ├── MessagesListScreen.tsx ← Sohbet listesi (thread'ler)
│   ├── ChatScreen.tsx         ← Birebir sohbet ekranı
│   └── MuhabbetScreen.tsx     ← Grup sohbet ekranı
├── components/
│   └── Header.tsx             ← Mesaj + bildirim ikonları (badge'ler burada)
└── navigation/
    └── TabNavigator.tsx       ← Alt sekmeler + subscribe() başlatma
```

### 5.2 Realtime Dinleyici Akışı (Mobil)

```
TabNavigator mount →
  useNotificationStore.subscribe(userId) →
    Kanal 1: notifications tablosu dinlenir (user_id filtresi)
    Kanal 2: messages tablosu dinlenir (receiver_id filtresi)
    Her değişiklikte → fetchCounts(userId) →
      unreadMessageCount güncellenir →
        Header.tsx badge güncellenir
```

### 5.3 Mesaj Gönderme Akışı (Mobil)

```
ChatScreen → useMessageStore.sendMessage() →
  1. Optimistic: Geçici ID ile mesaj listeye eklenir
  2. Supabase INSERT → messages tablosu
  3. threads.last_message ve updated_at güncellenir
  4. Gerçek mesaj ID'si ile geçici ID değiştirilir
  5. ❌ notifications tablosuna kayıt OLUŞTURULMAZ
```

### 5.4 Mesaj Silme Akışı (Mobil)

```
ChatScreen → Mesaj balonuna uzun basma (Long Press) →
  Alert "Mesajı Sil" →
    useMessageStore.deleteMessage(msgId, senderId, threadId) →
      1. Optimistic: Mesaj listeden kaldırılır
      2. Supabase DELETE → messages (sender_id eşleşmesi)
      3. threads.last_message bir önceki mesajla güncellenir
```

### 5.5 Sohbet (Thread) Silme Akışı (Mobil)

```
MessagesListScreen → Sohbete uzun basma (Long Press) →
  Alert "Sohbeti Sil" →
    useMessageStore.deleteThread(threadId) →
      1. Optimistic: Thread listeden kaldırılır
      2. Supabase DELETE → threads
```

### 5.6 Okundu İşaretleme Akışı (Mobil)

```
ChatScreen mount / Realtime yeni mesaj →
  useMessageStore.markThreadAsRead(threadId, userId) →
    1. messages → UPDATE read=true WHERE thread_id AND receiver_id AND read=false
    2. notifications → UPDATE read=true WHERE user_id AND type='new_message' AND link LIKE threadId
    3. useNotificationStore.fetchCounts(userId) → badge güncellenir
```

---

## 6. WEB MİMARİ (React / Vite)

### 6.1 Dosya Yapısı

```
anti/src/
├── lib/
│   ├── services.ts            ← Tüm Supabase servisleri (Message, Notification, DB, Swap)
│   └── supabase.ts            ← Supabase client oluşturma
├── hooks/
│   └── useNotifications.ts    ← Bildirim sayıları + Realtime dinleyiciler
├── pages/
│   └── Messages.tsx           ← Sohbet listesi + sohbet ekranı (tek sayfa)
└── context/
    └── AuthContext.tsx         ← Kullanıcı oturumu
```

### 6.2 Realtime Dinleyici Akışı (Web)

```
useNotifications hook mount →
  Kanal 1: notifications tablosu (user_id filtresi) → fetchCount()
  Kanal 2: messages tablosu (receiver_id filtresi) → fetchCount()
  Her değişiklikte →
    NotificationService.getUnreadCount(userId) → unreadCount
    NotificationService.getUnreadMessageCount(userId) → unreadMessageCount
    → Header badge güncellenir + document.title güncellenir
```

### 6.3 Mesaj Gönderme Akışı (Web)

```
Messages.tsx → handleSendMessage →
  1. Optimistic: tempId ile mesaj eklenir
  2. MessageService.sendMessage() → Supabase INSERT
  3. Dönen gerçek mesaj ile tempId değiştirilir (silme ID uyuşmazlığını önler)
  4. Hata olursa temp mesaj kaldırılır
```

### 6.4 Mesaj Silme Akışı (Web)

```
Messages.tsx → Mesaj üzerine hover → Çöp kutusu ikonu →
  window.confirm("Silmek istediğinize emin misiniz?") →
    1. Optimistic: Mesaj listeden kaldırılır
    2. MessageService.deleteMessage(msgId, userId, threadId) →
      Supabase DELETE + threads.last_message güncellenir
    3. Hata olursa mesajlar yeniden fetch edilir
```

### 6.5 Sohbet (Thread) Silme Akışı (Web)

```
Messages.tsx → Sol panelde sohbet üzerine hover → Çöp kutusu ikonu →
  window.confirm("Sohbeti silmek istediğinize emin misiniz?") →
    1. Optimistic: Thread listeden kaldırılır
    2. MessageService.deleteThread(threadId) → Supabase DELETE
    3. Aktif sohbet silindiyse /app/messages'a yönlendirilir
```

### 6.6 Sohbet İçi Realtime (Web)

```
Messages.tsx → thread_id değiştiğinde →
  Kanal: messages tablosu (thread_id filtresi)
    INSERT → yeni mesaj listeye eklenir + anında okundu işaretlenir
    DELETE → silinen mesaj listeden kaldırılır
```

---

## 7. SERVİS KATMANLARINDAKİ KRİTİK METOTLAR

### 7.1 `getUnreadMessageCount` (Her İki Platform)

```typescript
// ✅ DOĞRU: messages tablosundan sayar
const { count } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .eq('receiver_id', userId)
  .eq('read', false);
```

```typescript
// ❌ YANLIŞ (ESKİ): notifications tablosundan sayardı — KALDIRILDI
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('type', 'new_message')
  .eq('read', false);
```

### 7.2 `sendMessage` — Bildirim Oluşturmaz

```typescript
// ✅ DOĞRU: Sadece mesaj INSERT + thread UPDATE
await supabase.from('messages').insert({ thread_id, sender_id, receiver_id, content });
await supabase.from('threads').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', threadId);
// Bildirim oluşturma KODLARI SİLİNDİ — badge zaten messages tablosundan hesaplanıyor
```

### 7.3 `deleteMessage` — Thread son mesajını günceller

```typescript
// 1. Mesajı sil
await supabase.from('messages').delete().match({ id: messageId, sender_id: senderId });
// 2. Thread'in last_message'ını güncelle (bir önceki mesajla)
const { data: lastMsgs } = await supabase.from('messages')
  .select('content').eq('thread_id', threadId)
  .order('created_at', { ascending: false }).limit(1);
const newLastMessage = lastMsgs?.length > 0 ? lastMsgs[0].content : '';
await supabase.from('threads').update({ last_message: newLastMessage }).eq('id', threadId);
```

---

## 8. SORUN GİDERME REHBERİ

| Sorun | Kök Neden | Çözüm |
|-------|-----------|-------|
| Mesaj siliniyor ama geri geliyor | `messages` DELETE RLS politikası eksik | Bölüm 2.1 politika #4'ü ekle |
| `read` kolonu false kalıyor | `messages` UPDATE RLS politikası eksik | Bölüm 2.1 politika #3'ü ekle |
| Badge hiç güncellenmiyor | Realtime yayını kapalı | Bölüm 3'teki tabloları aktif et |
| Badge sayfa yenilemeden güncellenmiyor (WEB) | `useNotifications.ts`'de `messages` kanalı eksik | `messages` tablosu için ikinci kanal ekle |
| Badge sayfa yenilemeden güncellenmiyor (MOBİL) | `subscribe()` çağrılmamış | `TabNavigator.tsx`'de `useEffect` ile `subscribe(userId)` çağır |
| Zil ikonunda gereksiz mesaj bildirimi | `sendMessage` içinde notification oluşturuluyor | `sendMessage`'dan notification INSERT'i sil |
| Sohbet listesinde silinen mesaj hala görünüyor | `deleteMessage`'da `threads.last_message` güncellenmiyor | `deleteMessage`'a last_message güncelleme ekle |
| Mesajlar ekranında sonsuz loading | `fetchThreads`'de try/catch/finally eksik | `fetchThreads`'e try/catch/finally ekle |

---

## 9. TAM SUPABASE SQL — SIFIRDAN KURULUM

Tüm RLS politikalarını tek seferde uygulamak için SQL Editor'de çalıştırın:

```sql
-- ========================
-- MESSAGES TABLOSU RLS
-- ========================
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON "public"."messages"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert" ON "public"."messages"
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update" ON "public"."messages"
AS PERMISSIVE FOR UPDATE TO public
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "messages_delete" ON "public"."messages"
AS PERMISSIVE FOR DELETE TO public
USING (auth.uid() = sender_id);

-- ========================
-- THREADS TABLOSU RLS
-- ========================
ALTER TABLE "public"."threads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threads_select" ON "public"."threads"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "threads_insert" ON "public"."threads"
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "threads_update" ON "public"."threads"
AS PERMISSIVE FOR UPDATE TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "threads_delete" ON "public"."threads"
AS PERMISSIVE FOR DELETE TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ========================
-- NOTIFICATIONS TABLOSU RLS
-- ========================
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON "public"."notifications"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON "public"."notifications"
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "notifications_update" ON "public"."notifications"
AS PERMISSIVE FOR UPDATE TO public
USING (auth.uid() = user_id);

-- ========================
-- REALTIME YAYIN
-- ========================
-- Supabase Dashboard → Database → Publications → supabase_realtime
-- Şu tabloları etkinleştir: messages, threads, notifications
```

---

## 10. ÖNEMLİ KURALLAR

1. **`sendMessage` içinde asla `notifications` tablosuna INSERT yapma** — badge zaten `messages` tablosundan hesaplanıyor
2. **Muhabbet sekmesine mesaj badge'i koyma** — bu sekme grup sohbeti (broadcast) için
3. **Mesaj silindikten sonra `threads.last_message`'ı güncelle** — yoksa listede hayalet mesaj görünür
4. **Her Realtime dinleyicide `*` (tüm event'ler) kullan** — INSERT, UPDATE ve DELETE olaylarını yakalamak için
5. **Optimistic UI'da gerçek ID'yi yerine koy** — silme işleminin çalışması için `tempId` → `realId` dönüşümü şart
6. **`fetchThreads` ve `fetchMessages`'da `try/catch/finally` kullan** — RLS hatası sonsuz loading döngüsüne neden olur
