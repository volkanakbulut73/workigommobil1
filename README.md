# Workigom Mobile

Workigom topluluğu için geliştirilmiş kapsamlı mobil uygulama (React Native & Expo). 

Bu uygulama kullanıcıların ilan açabildikleri, takas yapabildikleri (Market), görev listeleri oluşturup destekleşebildikleri (Talepler), ve topluluk içi mesajlaşabildikleri interaktif bir deneyim sunmaktadır.

## 🚀 Teknolojiler ve Kullanılan Araçlar

**Uygulama Geliştirme:**
- **React Native (v0.73.4)**
- **Expo (SDK 50)**: Native modül yapılarını yönetmek ve Prebuild yaklaşımı ile hızlı geliştirme yapmak için.
- **TypeScript**: Güçlü tip kontrolü (strict mod aktif) ile projeyi daha güvenilir hale getirmek için.

**Veritabanı & Backend:**
- **Supabase (@supabase/supabase-js)**: Veritabanı (PostgreSQL), Auth, Storage ve Realtime (Canlı takip/bildirim) özellikleri için.

**State Management (Durum Yönetimi):**
- **Zustand**: Sadelik ve performans odaklı merkezi store yöntemi.
  - `useAuthStore` (Oturum / Kullanıcı yönetimi)
  - `useMarketStore` (Market ilanları)
  - `useMessageStore` (Sohbetler ve Canlı Dinleme)
  - `useNotificationStore` (Bildirim yönetimi)

**Navigasyon:**
- **React Navigation (v6)**: 
  - `Stack Navigator`: Temel sayfa yönlendirmeleri (Mesajlar, Detay ekranları vb.)
  - `Bottom Tabs`: Ana gezinme sekmeleri (Home, Talepler, Market, Muhabbet, Profile)

**UI & Gözlem:**
- **Lucide React Native**: Şık, modern SVG ikonlar.
- **Expo Image**: Yüksek performanslı ve `blurhash` destekli gösterim.
- **React Native Toast Message**: Bildirim / Uyarı pencereleri.
- **Sentry (@sentry/react-native)**: Crash ve Hata takibi (Error Boundary dahil).
- **PostHog**: Ürün içi analitikler ve olay takibi (event tracking).

## 📂 Klasör ve Mimari Yapısı

```
src/
 ├── components/       # (Card, Button, Layout vb. yeniden kullanılabilir UI araçları)
 ├── hooks/            # (usePushNotifications gibi custom hooklar)
 ├── lib/              # (Supabase client ayarları)
 ├── navigation/       # (RootStack, TabNavigator tanımları)
 ├── screens/          # (Uygulamanın ekranları - HomeScreen, MarketScreen, TrackerScreen vb.)
 ├── services/         # (DBService, AnalyticsService, MessageService gibi API yönetim noktaları)
 ├── store/            # (Zustand State yönetim dosyaları)
 └── types/            # (TypeScript Interface'leri - Profile, Thread, SwapListing vb.)
```

## 🌟 Temel Özellikler

1. **Market Modülü:**
   - İlanları (SwapListing) listeleme, arama ve filtreleme özellikleri.
   - İlan ekleme (Kamera & Galeri erişimi ile) ve detaylı ilan inceleme.
2. **Talepler & İşlem Takibi (Tracker):**
   - Kullanıcılar arası etkileşim, talep açma / kabul etme sistemi.
   - **Canlı (Realtime)** işlem takibi ve durum güncelleme.
3. **Mesajlaşma (Sohbet & Muhabbet):**
   - Anlık özel mesajlaşma (Private Threads API).
   - "Muhabbet" sosyal global chat ekranı.
4. **Push Bildirimleri:**
   - `expo-device` ve `expo-notifications` kullanılarak anlık cihaz bildirimleri.

## 💬 Mesajlaşma Mimarisi

Uygulamanın mesajlaşma sistemi, web versiyonu ile tam uyumlu ve senkronize bir mimari üzerine kuruludur.

### Veri Yapısı ve Tablolar

**`messages` Tablosu:**

| Kolon        | Tip          | Varsayılan          | Açıklama                          |
|-------------|-------------|---------------------|-----------------------------------|
| `id`         | uuid         | `gen_random_uuid()` | Primary key                       |
| `thread_id`  | uuid         | —                   | İlişkili sohbet odası (FK → threads) |
| `sender_id`  | uuid         | —                   | Gönderen kullanıcı (FK → profiles) |
| `receiver_id`| uuid         | —                   | Alıcı kullanıcı (FK → profiles)   |
| `content`    | text         | —                   | Mesaj içeriği                     |
| `read`       | bool         | `false`             | Okundu mu?                        |
| `created_at` | timestamptz  | `now()`             | Oluşturulma zamanı                |

**`threads` Tablosu:**

| Kolon          | Tip          | Varsayılan          | Açıklama                         |
|---------------|-------------|---------------------|----------------------------------|
| `id`           | uuid         | `gen_random_uuid()` | Primary key                      |
| `listing_id`   | uuid         | nullable            | İlişkili ilan (FK → swap_listings) |
| `buyer_id`     | uuid         | —                   | Alıcı taraf (FK → profiles)      |
| `seller_id`    | uuid         | —                   | Satıcı taraf (FK → profiles)     |
| `type`         | text         | —                   | `'market'`, `'task'`, `'private'` |
| `last_message` | text         | nullable            | Son mesaj önizlemesi              |
| `updated_at`   | timestamptz  | `now()`             | Son güncelleme zamanı             |
| `created_at`   | timestamptz  | `now()`             | Oluşturulma zamanı                |

**`notifications` Tablosu:**

| Kolon       | Tip          | Varsayılan          | Açıklama                          |
|------------|-------------|---------------------|-----------------------------------|
| `id`        | uuid         | `gen_random_uuid()` | Primary key                       |
| `user_id`   | uuid         | —                   | Bildirim sahibi (FK → profiles)   |
| `type`      | text         | —                   | Bildirim tipi                     |
| `title`     | text         | —                   | Bildirim başlığı                  |
| `content`   | text         | —                   | Bildirim içeriği                  |
| `link`      | text         | —                   | Yönlendirme linki                 |
| `read`      | bool         | `false`             | Okundu mu?                        |
| `created_at`| timestamptz  | `now()`             | Oluşturulma zamanı                |

### Bildirim ve Badge Felsefesi

- **Zil ikonu (Bell):** Yalnızca platform bildirimleri (görev kabul, market hareketi vb.) gösterir. **Mesaj bildirimleri burada GÖSTERİLMEZ.**
- **Mesaj ikonu (MessageCircle - Header'da):** `messages` tablosundan `receiver_id = userId AND read = false` sayısını badge olarak gösterir.
- **Muhabbet sekmesi:** Grup sohbeti (broadcast) içindir. Birebir mesajlarla ilgisi yoktur, badge konulmaz.

**ÖNEMLİ:** Okunmamış mesaj sayısı artık `notifications` tablosundan DEĞİL, doğrudan `messages` tablosundan hesaplanır:
```sql
SELECT count(*) FROM messages WHERE receiver_id = '{userId}' AND read = false;
```

### Canlı Dinleme (Realtime)

**Mobil:** `TabNavigator.tsx` mount olduğunda `useNotificationStore.subscribe(userId)` çağrılır ve iki kanal açılır:
1. `notifications` tablosu (user_id filtresi)
2. `messages` tablosu (receiver_id filtresi)

**Web:** `useNotifications.ts` hook'u içinde aynı iki kanal açılır:
1. `user-notifications-{userId}` → notifications tablosu
2. `user-messages-web-{userId}` → messages tablosu

Her değişiklikte `fetchCounts(userId)` çağrılır → badge anında güncellenir.

### 🌍 Global Sohbet (Muhabbet) Ortak Altyapısı (Web & Mobil)

**ÖNEMLİ KILAVUZ (ŞABLON):** "Muhabbet" (Global Sohbet) kanalının Web ve Mobil platformlar arasında kesintisiz çapraz çalışabilmesi (interoperability) ve kullanıcıların karşılıklı olarak çevrimiçi durumlarını/mesajlarını görebilmesi için aşağıdaki veritabanı/kanal yapılandırması kullanılmalıdır. Sistemde sorun yaşarsanız hata ayıklarken **ilk bakacağınız referans kaynağı** burasıdır.

**1. Kanal ve Abonelik (Channel & Subscription)**
- Her iki platform da **aynı kanal ismini** (`public-chat`) kullanmak zorundadır. Kesinlikle `broadcast-genel` veya `presence-genel` gibi parçalanmış kanallar **kullanılmamalıdır**.
- Dinleyiciler (`on('broadcast')`, `on('presence')`) **mutlaka** kanal `subscribe()` komutu işletilmeden **önce** tanımlanmalıdır.

**2. Veri Şablonları (Payload Schemas & Merge Strategy)**
Farklı geliştirme evrelerinden ötürü Web ve Mobil platformlar farklı JSON anahtarları (schema) kullanmaktadır. Senkronizasyonun kopmaması için **mesaj ve presence takibi (track) sırasında her iki platformun beklediği anahtarlar birleştirilerek (merge)** iletilmelidir.

* **Çevrimiçi Takibi (Presence Track) Şablonu:**
  Web (`userId`, `name`, `avatar`) ve Mobil (`user_id`, `full_name`, `avatar_url`) yapılarının birleşimi:
  ```typescript
  await channel.track({
    userId: user.id,          // Web uyumu için şart
    user_id: user.id,         // Mobil uyumu için şart
    name: profile.full_name,  // Web uyumu için şart
    full_name: profile.full_name, // Mobil uyumu için şart
    avatar: profile.avatar_url,   // Web uyumu için şart
    avatar_url: profile.avatar_url, // Mobil uyumu için şart
    onlineAt: new Date().toISOString()
  });
  ```

* **Canlı Mesaj Yayını (Broadcast Payload) Şablonu:**
  Web (`text`, `senderId`, `senderName`, `senderAvatar`) ve Mobil (`content`, `sender_id`, `sender_name`, `avatar_url`) yapılarının birleşimi:
  ```typescript
  await channel.send({
    type: 'broadcast',
    event: 'message', // Web tarafı bazen 'image-share' veya 'audio-share' gönderebilir, yakalanmalıdır.
    payload: {
      id: message.id,
      // --- Web İçin Gereksinimler ---
      text: message.content,
      senderId: message.sender_id,
      senderName: message.sender_name,
      senderAvatar: message.avatar_url,
      timestamp: new Date().toISOString(),
      isBot: false,
      roomId: 'public-chat',
      // --- Mobil İçin Gereksinimler ---
      content: message.content,
      sender_id: message.sender_id,
      sender_name: message.sender_name,
      avatar_url: message.avatar_url,
      created_at: new Date().toISOString()
    }
  });
  ```
**NOT:** Dinleyiciler (listeners) gelen paketi okurken de aynı şekilde `payload.userId || payload.user_id` gibi bir fallback (yedekli) yaklaşımı kullanmalıdır. Bu yapılandırmaya uyulmazsa, çapraz platformlarda giren kullanıcılar "Kendisi/Anonim" görünür veya atılan mesajlar ortak ekrana düşmez.

**3. Kullanıcıya Çift Tıklayarak Özel Mesaj (Private Room) Açma Paritesi**
Global sohbet alanında (Muhabbet), bir kullanıcının represents (avatar veya ismi) üzerine çift tıklandığında (veya tıklandığında) çalışan akış **kesinlikle standart (Mesajlarım) veritabanı akışına GİRMEMELİDİR**. Bunun yerine **geçici (ephemeral) sohbet** olarak aynı `public-chat` kanalı üzerinden özel mesajlaşma yapılmalıdır.

Bu kurgunun amacı, kullanıcıların normal pazarlaşma/yardım mesajları ile anlık Muhabbet fısıldaşmalarını (whisper) ayırmaktır:
1. **Oda Kurulumu:** A kullanıcısı B'ye çift tıkladığında `activePrivateTab` (veya benzeri bir state) açılır ve UI "Özel Oda" moduna geçer.
2. **Davet Yayını (Invite Broadcast):** A kullanıcısı, B kullanıcısına `public-chat` üzerinden `private_invite` event'i ile davet fırlatır (`payload: { targetId: B_ID, inviter: A_PROFILE }`).
3. **Davet Kabulü:** B kullanıcısının UI sisteminde bir Banner veya Modal çıkar. "A size özel oda açtı" şeklinde. B kabul ederse o da `activePrivateTab` state'ini A'ya ayarlar.
4. **Mesaj Gönderimi:** A veya B birbirlerine mesaj atarken, bu mesaj `public-chat` üzerinden `private_message` event'i olarak `payload: { targetId, targetName, message }` yayınlanır ve iki taraf kendi ara belleğine alır.

Bu yapıya uyulmazsa, özel konuşmalar gereksiz yere veritabanındaki "Mesajlarım" menüsüne düşerek kullanıcı deneyimini bozar (Yanlış Kurgu).

---

## 📝 Standart Supabase Mesajlaşma Şablonu (Mobil & Web)

**DİKKAT:** Web ve Mobil platformlar arasında mesajlaşma senkronizasyonunun bozulmaması için anlık mesaj ve thread işlemleri *kesinlikle* aşağıdaki standart yapılandırmaya sadık kalınarak yapılmalıdır.

### 1. Thread Bulma veya Oluşturma (`findOrCreateThread`)
Her sohbet kanalı (`threads`), `buyer_id`, `seller_id` ve `type` parametreleri dikkate alınarak tekil olmalıdır. Ters yönlü sorgular da (A-B ve B-A) kontrol edilmelidir.
```typescript
// Yön 1: buyer_id = A, seller_id = B
let query = supabase.from('threads').select('*').eq('buyer_id', buyerId).eq('seller_id', sellerId).eq('type', moduleType);
// Yön 2: buyer_id = B, seller_id = A (Ters Yön Kontrolü)
// Eğer ikisinde de kayıt yoksa, yeni insert işlemi: { buyer_id, seller_id, type, listing_id, last_message: null }
```

### 2. Mesaj Gönderme (`sendMessage`)
Bir mesaj gönderildiğinde, ardışık olarak şu işlemler gerçekleşir:
1. **Mesajı Kaydet:** `messages` tablosuna `{ thread_id, sender_id, receiver_id, content }` insert edilir.
2. **Thread'i Güncelle:** `threads.last_message` son mesajla, `updated_at` anlık tarihle güncellenir.
3. **❌ Bildirim OLUŞTURULMAZ:** `notifications` tablosuna `new_message` kaydı **EKLENMEMELİDİR**. Badge zaten `messages` tablosundan hesaplanıyor.

**Optimistic UI:** Mesaj gönderildiğinde geçici ID ile listeye eklenir. Supabase'den dönen gerçek mesaj ID'si ile değiştirilir (silme işleminin çalışması için **şarttır**).

### 3. Mesaj Silme (`deleteMessage`)
```typescript
// 1. Mesajı sil (sadece gönderen silebilir)
await supabase.from('messages').delete().match({ id: messageId, sender_id: senderId });
// 2. Thread'in last_message'ını güncelle (bir önceki mesajla veya boşla)
const { data: lastMsgs } = await supabase.from('messages')
  .select('content').eq('thread_id', threadId)
  .order('created_at', { ascending: false }).limit(1);
const newLastMessage = lastMsgs?.length > 0 ? lastMsgs[0].content : '';
await supabase.from('threads').update({ last_message: newLastMessage }).eq('id', threadId);
```

**Mobilde:** Mesaj balonuna uzun basarak (Long Press) → Alert ile silme.
**Web'de:** Mesaj üzerine hover → Çöp kutusu ikonu ile silme.

### 4. Sohbet (Thread) Silme (`deleteThread`)
```typescript
await supabase.from('threads').delete().eq('id', threadId);
```

**Mobilde:** Sohbet listesinde uzun basarak (Long Press) → Alert ile silme.
**Web'de:** Sohbet listesinde hover → Çöp kutusu ikonu ile silme.

### 5. Mesajları Okundu İşaretleme (`markThreadMessagesAsRead`)
Sohbet ekranına girildiğinde tüm okunmamış mesajlar `read = true` olarak işaretlenir:
```typescript
await supabase.from('messages').update({ read: true })
  .eq('thread_id', threadId).eq('receiver_id', viewerId).eq('read', false);
```
Bu sayede web ve mobil platformlarda açık olan aynı hesap senkronize olarak badge'i anında siler.

### 6. Realtime Dinleme
Thread içi dinleme `event: '*'` (tüm olaylar) ile yapılmalıdır:
```typescript
supabase.channel(`thread-${threadId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, callback)
  .subscribe();
```
Bu sayede INSERT, UPDATE ve **DELETE** olayları yakalanır.

---

## 🔒 Supabase RLS (Row Level Security) Politikaları

**ÖNEMLİ:** Bu politikalar olmadan uygulama sessizce çalışmaz — hata fırlatmaz ama veri okuyamaz/yazamaz/silemez/güncelleyemez.

### `messages` Tablosu
```sql
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

-- SELECT: Kullanıcılar kendi mesajlarını okuyabilir
CREATE POLICY "messages_select" ON "public"."messages"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- INSERT: Kullanıcılar mesaj gönderebilir
CREATE POLICY "messages_insert" ON "public"."messages"
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (auth.uid() = sender_id);

-- UPDATE: Alıcı mesajları okundu olarak işaretleyebilir
CREATE POLICY "messages_update" ON "public"."messages"
AS PERMISSIVE FOR UPDATE TO public
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- DELETE: Gönderen kendi mesajını silebilir
CREATE POLICY "messages_delete" ON "public"."messages"
AS PERMISSIVE FOR DELETE TO public
USING (auth.uid() = sender_id);
```

### `threads` Tablosu
```sql
ALTER TABLE "public"."threads" ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "threads_select" ON "public"."threads"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- INSERT
CREATE POLICY "threads_insert" ON "public"."threads"
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- UPDATE
CREATE POLICY "threads_update" ON "public"."threads"
AS PERMISSIVE FOR UPDATE TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- DELETE
CREATE POLICY "threads_delete" ON "public"."threads"
AS PERMISSIVE FOR DELETE TO public
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

### `notifications` Tablosu
```sql
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "notifications_select" ON "public"."notifications"
AS PERMISSIVE FOR SELECT TO public
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "notifications_insert" ON "public"."notifications"
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (true);

-- UPDATE
CREATE POLICY "notifications_update" ON "public"."notifications"
AS PERMISSIVE FOR UPDATE TO public
USING (auth.uid() = user_id);
```

---

## ⚡ Supabase Realtime Yapılandırması

**Supabase Dashboard → Database → Publications (Replication) → `supabase_realtime`**

Aşağıdaki tablolar **AKTİF** olmalıdır:

| Tablo           | Realtime | Açıklama                                     |
|----------------|----------|----------------------------------------------|
| `messages`      | ✅ AÇIK   | Yeni mesaj, okundu işareti, silme olayları   |
| `threads`       | ✅ AÇIK   | Sohbet güncelleme/silme olayları             |
| `notifications` | ✅ AÇIK   | Bildirim güncelleme olayları                 |

**Bu açılmazsa:** Uygulama mesajları/bildirimleri anlık olarak alamaz, sayfa yenilenmesi gerekir.

---

## 🔧 Sorun Giderme Rehberi

| Sorun | Kök Neden | Çözüm |
|-------|-----------|-------|
| Mesaj siliniyor ama geri geliyor | `messages` DELETE RLS politikası eksik | `messages_delete` politikasını ekle |
| `read` kolonu false kalıyor | `messages` UPDATE RLS politikası eksik | `messages_update` politikasını ekle |
| Badge hiç güncellenmiyor | Realtime yayını kapalı | Publications'da tabloları aktif et |
| Badge sayfa yenilemeden güncellenmiyor (WEB) | `useNotifications.ts`'de `messages` kanalı eksik | `messages` tablosu için ikinci kanal ekle |
| Badge sayfa yenilemeden güncellenmiyor (MOBİL) | `subscribe()` çağrılmamış | `TabNavigator.tsx`'de `subscribe(userId)` çağır |
| Zil ikonunda gereksiz mesaj bildirimi | `sendMessage` içinde notification oluşturuluyor | `sendMessage`'dan notification INSERT'i sil |
| Sohbet listesinde silinen mesaj hala görünüyor | `deleteMessage`'da `threads.last_message` güncellenmiyor | `deleteMessage`'a last_message güncelleme ekle |
| Mesajlar ekranında sonsuz loading | `fetchThreads`'de try/catch/finally eksik | `fetchThreads`'e try/catch/finally ekle |

---

## ⚠️ Altın Kurallar

1. **`sendMessage` içinde asla `notifications` tablosuna INSERT yapma** — badge zaten `messages` tablosundan hesaplanıyor
2. **Muhabbet sekmesine mesaj badge'i koyma** — bu sekme grup sohbeti (broadcast) için
3. **Mesaj silindikten sonra `threads.last_message`'ı güncelle** — yoksa listede hayalet mesaj görünür
4. **Her Realtime dinleyicide `*` (tüm event'ler) kullan** — INSERT, UPDATE ve DELETE olaylarını yakalamak için
5. **Optimistic UI'da gerçek ID'yi yerine koy** — silme işleminin çalışması için `tempId` → `realId` dönüşümü şart
6. **`fetchThreads` ve `fetchMessages`'da `try/catch/finally` kullan** — RLS hatası sonsuz loading döngüsüne neden olur

---

## 🛠 Kurulum ve Çalıştırma

**Ön gereksinimler:** Node.js yüklü (Tercihen v18 veya v20). Android/iOS Emülatör ya da fiziksel cihazda `Expo Go` kurulu olmalı.

1. Bağımlılıkları Yükle:
```bash
npm install
```

2. Native modüller için ön yapılandırmayı oluştur (Prebuild):
```bash
npx expo prebuild --clean
```

3. Uygulamayı Başlat (Geliştirici Sunucusu):
```bash
npx expo start
```

Uygulamayı Android'de derlemek için `npm run android`, iOS ortamında ise `npm run ios` veya `npx expo run:ios` komutları kullanılabilir.