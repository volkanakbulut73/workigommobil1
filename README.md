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
  - `useMuhabbetStore` (Global Sohbet + Ephemeral Özel Oda yönetimi)
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

# 🆕 Nisan 2026 Güncellemeleri
- 🆔 **SENTINEL ID Sistemi**: Market için `WRK-XXXX`, talepler için `REQ-XXXX` şeklinde benzersiz numaralandırma.
- ⏳ **30 Günlük İlan Döngüsü**: Tüm ilanlar ve talepler 30 gün sonunda otomatik pasife çekilir, "Yinele" butonu ile uzatılabilir.
- 🚀 **Performans Optimizasyonları**: Expo Image ve Supabase Realtime entegrasyonu.

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
   - Anlık özel mesajlaşma (Private Threads API — Mesajlarım sayfası).
   - "Muhabbet" sosyal global chat ekranı.
   - **Ephemeral Özel Oda (Whisper):** Muhabbet içinde çift tıklayarak açılan anlık özel sohbet. Veritabanına kayıt **AÇMAZ**, `public-chat` broadcast kanalı üzerinden çalışır.
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

**3. Workigom AI Bot Yapılandırması (Web & Mobil Ortak)**

> ⛔ **KRİTİK: Bu yapılandırma kesinleştirilmiştir. Her iki platformda da aynı mantık kullanılmalıdır.**

Workigom AI botu, Muhabbet (Global Sohbet) içinde kullanıcıların `@workigom` veya `/workigom` yazarak tetiklediği bir yapay zeka asistanıdır. Bot, Supabase Edge Function üzerinden Gemini API'yi çağırır.

**Tetikleme Koşulu:**
- Mesaj `@workigom` veya `/workigom` içeriyorsa bot tetiklenir.
- **Sadece Global Chat** (public-chat) odasında çalışır. Özel odalarda (private) tetiklenmez.

**Edge Function Çağrısı:**
```typescript
const response = await fetch('https://toqroogfufzgxsxemfeh.supabase.co/functions/v1/gemini-bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: msgText,           // Kullanıcının mesajı
    user_name: profile.full_name, // Kullanıcı adı
    previous_interaction_id: previousInteractionId // Konuşma bağlamı (opsiyonel)
  }),
});
```

**Yanıt Yapısı:**
```json
{
  "response": "Bot'un ürettiği yanıt metni",
  "interaction_id": "konuşma bağlamı için ID"
}
```

**Bot Mesaj Broadcast Şablonu (Merged Schema):**
```typescript
const botPayload = {
  // Mobil Schema
  id: Date.now().toString() + '-bot',
  sender_id: 'bot-1',
  sender_name: 'Workigom AI',
  avatar_url: '',
  content: botReply,
  created_at: new Date().toISOString(),
  // Web Schema
  text: botReply,
  senderId: 'bot-1',
  senderName: 'Workigom AI',
  senderAvatar: null,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  isBot: true,
  roomId: 'public-chat',
};
```

**Akış (Web & Mobile aynı):**
```
Kullanıcı "@workigom merhaba" yazar
  → Mesaj broadcast ile gönderilir
  → isBotTyping = true (typing indicator gösterilir)
  → Edge Function çağrılır (gemini-bot)
  → Yanıt alınır
  → Bot mesajı lokal listeye eklenir
  → Bot mesajı broadcast ile tüm istemcilere yayınlanır
  → isBotTyping = false
```

**Hata Durumu:** Edge Function başarısız olursa, kullanıcıya `"Sistem meşgul, lütfen daha sonra tekrar deneyin."` mesajı gösterilir.

**Dosya Referansları:**
- **Web:** `anti/src/pages/Muhabbet.tsx` → `handleSendMessage()` (satır ~383-450)
- **Mobil:** `mobile/src/screens/MuhabbetScreen.tsx` → `handleSend()` (bot trigger bloğu)

---

## 📝 Standart Supabase Mesajlaşma Şablonu (Mobil & Web)

**DİKKAT:** Web ve Mobil platformlar arasında mesajlaşma senkronizasyonunun bozulmaması için anlık mesaj ve thread işlemleri *kesinlikle* aşağıdaki standart yapılandırmaya sadık kalınarak yapılmalıdır.

### 1. Thread Bulma veya Oluşturma (`findOrCreateThread`)
### 2. Mesaj Gönderme (`sendMessage`)
### 3. Mesaj Silme (`deleteMessage`)
### 4. Sohbet (Thread) Silme (`deleteThread`)
### 5. Mesajları Okundu İşaretleme (`markThreadMessagesAsRead`)
### 6. Realtime Dinleme

---

## 🔒 Supabase RLS (Row Level Security) Politikaları — KESİNLEŞTİRİLMİŞ (10 Nisan 2026)

> ⛔ **KRİTİK UYARI: BU POLİTİKALAR KESİNLEŞTİRİLMİŞTİR. HİÇBİR KOŞULDA DEĞİŞTİRİLMEMELİ, SİLİNMEMELİ VEYA YENİDEN YAZILMAMALIDIR. Bu yapılandırma Web ve Mobile platformlarının ortak veritabanı üzerinde sorunsuz çalışmasını sağlayan tek doğru konfigürasyondur. Müdahale edilmesi durumunda her iki platformda da talep görünürlüğü, admin onay akışı ve iptal mekanizması BOZULUR.**

### `transactions` Tablosu RLS Politikaları

**SELECT — `"Islemleri Goruntuleme"`:**
```sql
CREATE POLICY "Islemleri Goruntuleme" ON public.transactions
  FOR SELECT USING (
    auth.uid() = seeker_id
    OR auth.uid() = supporter_id
    OR status = 'waiting-supporter'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```
**Açıklama:** Kullanıcılar kendi taleplerini (`seeker_id`) ve destekledikleri talepleri (`supporter_id`) görebilir. `waiting-supporter` statüsündeki talepler herkes tarafından görülür (eşleşme havuzu). Admin rolündeki kullanıcılar **tüm** talepleri (pending dahil) görebilir.

**INSERT — `"Talep Olusturma"`:**
```sql
CREATE POLICY "Talep Olusturma" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = seeker_id);
```

**UPDATE — `"Talep Guncelleme"`:**
```sql
CREATE POLICY "Talep Guncelleme" ON public.transactions
  FOR UPDATE USING (
    auth.uid() = seeker_id
    OR auth.uid() = supporter_id
    OR (supporter_id IS NULL AND status = 'waiting-supporter')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    auth.uid() = seeker_id
    OR auth.uid() = supporter_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```
**Açıklama:** Taraflar kendi işlemlerini güncelleyebilir. Destekçisi olmayan `waiting-supporter` talepleri herkes tarafından kabul edilebilir. Admin rolündeki kullanıcılar tüm talepleri güncelleyebilir (onay/red).

### 🔄 Talep Yaşam Döngüsü (Transaction Lifecycle)

> ⛔ **BU AKIŞ KESİNLEŞTİRİLMİŞTİR. DEĞİŞTİRİLMEMELİDİR.**

```
Kullanıcı talep oluşturur (Web veya Mobile)
        │
        ▼
   status = 'pending'  ←── Kullanıcı sadece kendi talebini görür
        │
        ▼
   Admin Paneli (SENTINEL) → "Onay Vitrini"nde görünür
        │
   ┌────┴────┐
   │ ONAYLA  │  REDDİ
   ▼         ▼
 'waiting-supporter'   'dismissed'
   │
   ▼
  Tüm kullanıcılar Talepler sayfasında görür (eşleşme havuzu)
   │
   ▼
  Supporter kabul eder → 'waiting-cash-payment'
   │
   ▼
  Seeker ödeme yapar → 'cash-paid'
   │
   ▼
  Supporter QR yükler → 'qr-uploaded'
   │
   ▼
  Seeker onaylar → 'completed' ✅
```

### 🚫 İptal Davranışı (Cancel Differentiation)

> ⛔ **BU MANTIK KESİNLEŞTİRİLMİŞTİR. DEĞİŞTİRİLMEMELİDİR.**

| Kim İptal Etti | Sonuç | Açıklama |
|----------------|-------|----------|
| **Seeker** (talep sahibi) | `status → 'cancelled'` | Talep kalıcı olarak iptal olur |
| **Supporter** (destekçi) | `status → 'waiting-supporter'`, `supporter_id → null` | Talep havuza geri döner, başka supporter aranır |

### 📡 Tracker Mimarisi (Web & Mobile Ortak)

> ⛔ **BU MİMARİ KESİNLEŞTİRİLMİŞTİR. DEĞİŞTİRİLMEMELİDİR.**

**Realtime Güncelleme Stratejisi (Çift Katmanlı + Polling):**

Her iki platform da Tracker ekranında aynı üç mekanizmayı **eş zamanlı** kullanır:

| # | Mekanizma | Açıklama |
|---|-----------|----------|
| 1 | **postgres_changes** | Supabase Realtime Replication açıksa `UPDATE` eventleri anında dinler |
| 2 | **broadcast** | `transaction_updated` event'ini dinler (karşı tarafın tetiklediği sinyaller) |
| 3 | **3s polling** | `setInterval(fetchTransaction, 3000)` — garanti güncelleme (Realtime kapalı olsa bile çalışır) |

**Veri Çekme (`getTransactionById`):**
*   `.maybeSingle()` kullanılır (`.single()` DEĞİL). Çünkü `.single()` sonuç yoksa `406 Not Acceptable` hatası fırlatır.
*   Nested profil verileri join ile çekilir: `seeker:profiles!seeker_id(full_name), supporter:profiles!supporter_id(full_name)`

**Var Olmayan Sütunlara Yazma Yasağı:**
*   `qr_uploaded_at` ve `completed_at` sütunları DB'de **mevcut değildir**. Bu alanlara yazma girişimi `PGRST204` hatasına neden olur.
*   Status güncellemelerinde sadece `status` + desteklenen alanlar (ör. `qr_url`) kullanılır.

### `transactions_archive` — Tamamlanmış İşlemler Arşivi
**Açıklama:**
Tamamlanan, iptal edilen veya reddedilen talepler otomatik olarak bu tabloya kopyalanır.

> ⛔ **BU TABLO VE TRİGGER KESİNLEŞTİRİLMİŞTİR. DEĞİŞTİRİLMEMELİDİR.**

**Otomatik Arşivleme Mekanizması:**
*   `transactions` tablosunda bir kayıt `completed`, `cancelled` veya `dismissed` statüsüne geçtiğinde, `trg_archive_transaction` trigger'ı otomatik olarak `transactions_archive` tablosuna kopyalar.
*   Aynı ID tekrar arşivlenirse `ON CONFLICT` ile güncellenir.

**Kolonlar:** `transactions` tablosuyla aynı yapıda + ek `archived_at` (timestamptz) sütunu.

**SQL Referans Dosyası:** `anti/database/create_transactions_archive.sql`

## ⚡ Supabase Realtime Yapılandırması

---

## 🔧 Sorun Giderme Rehberi

---

## ⚠️ Altın Kurallar

1. **`sendMessage` içinde asla `notifications` tablosuna INSERT yapma**
2. **Muhabbet sekmesine mesaj badge'i koyma**
3. **Mesaj silindikten sonra `threads.last_message`'ı güncelle**
4. **Her Realtime dinleyicide `*` (tüm event'ler) kullan**
5. **Optimistic UI'da gerçek ID'yi yerine koy**
6. **`fetchThreads` ve `fetchMessages`'da `try/catch/finally` kullan**

---

## 🛠 Kurulum ve Çalıştırma

---

## 🚨 Kritik Supabase Yapılandırma Uyarıları

---

## 👤 Profil İsmi Yapılandırması (Kayıt → Sohbet Gösterimi)

---

## 📋 Değişiklik Günlüğü (Changelog)

### v2.13.0 — 13 Nisan 2026, 02:07 (UTC+3)
**🛍️ Market İlan Filtreleme Düzeltmesi — Web ile Eşitlik:**

- **Sorun:** Mobil Market sayfasında oluşturulan ilanlar `pending` statüsünde olmasına rağmen Pazar sekmesinde herkese görünüyordu. Admin onayı beklenmeden yayınlanıyordu.
- **Çözüm:** `useMarketStore.ts` içindeki `fetchListings` fonksiyonu Web versiyonuyla aynı filtreleme mantığına kavuşturuldu:
  - **Pazar sekmesi:** Sadece `status === 'active'` VE süresi dolmamış ilanlar gösteriliyor.
  - **İlanlarım sekmesi:** Kullanıcının kendi ilanları (`pending` dahil, `completed` hariç) gösteriliyor.

**Değişen Dosyalar:**
- `useMarketStore.ts`: `marketListings` filtresi eklendi (`status === 'active'` + `expiry_date` kontrolü).

### v2.12.0 — 13 Nisan 2026, 01:14 (UTC+3)
**🤖 Workigom AI Bot — Mobil Muhabbet Entegrasyonu:**

- **AI Bot Tetikleme:** Mobil Muhabbet ekranında `@workigom` veya `/workigom` yazıldığında Supabase Edge Function (`gemini-bot`) çağrılarak yapay zeka yanıtı alınıyor.
- **Typing Indicator:** Bot yanıt üretirken "Workigom AI düşünüyor..." animasyonu gösteriliyor.
- **Çapraz Platform Yayın:** Bot yanıtı hem Web hem Mobil schema'sı ile broadcast ediliyor (merged payload).
- **Konuşma Bağlamı:** `previousInteractionId` state'i ile bot önceki etkileşimleri hatırlayabiliyor.
- **Hata Yönetimi:** Edge Function başarısız olduğunda kullanıcıya hata mesajı gösteriliyor.
- **Placeholder Güncelleme:** Global chat input'u "AI için @workigom yazın..." placeholder'ı ile rehberlik sağlıyor.

**Değişen Dosyalar:**
- `MuhabbetScreen.tsx`: `handleSend()` fonksiyonuna AI bot trigger bloğu eklendi.
- `README.md`: Workigom AI Bot Yapılandırması dokümantasyonu eklendi.

### v2.11.0 — 11 Nisan 2026, 02:10 (UTC+3)
**Bildirim Sistemi Yeniden Yapilandirmasi — Web ve Mobil Esitlik:**

**Bildirim Akisi (Web + Mobile ayni mantik):**
- Admin panelinden gonderilen `system` ve `transaction` tipi bildirimler artik kullanicinin **Mesajlar (Gelen Kutusu)** ekraninda gorunur.
- Bildirimler, sohbet listesinin **ustunde** "SISTEM MESAJLARI" bolumu olarak gruplanir.
- Kullanici mesaj kutusunu actiginda okunmamis bildirimler otomatik `read: true` olarak isaretlenir.
- Badge (rozet) sayaci sifirlanir.

**Degisen Dosyalar:**
- `MessagesListScreen.tsx`: `notifications` tablosundan admin mesajlari cekilip gelen kutusunun ustunde gosteriliyor. Her bildirim tip etiketli (SISTEM/ISLEM).
- `Header.tsx`: Mesaj ikonu badge = `unreadMessageCount + unreadCount`. Bell ikonu badge kaldirildi.
- Ekran acildiginda okunmamis bildirimler otomatik `read: true` yapiliyor, `fetchCounts` ile badge guncelleniyor.

**Badge Hesaplama (Web ile ayni):**
```
totalInboxCount = unreadMessageCount (messages) + unreadCount (notifications)
```

**Veri Akisi:**
```
Admin -> notifications INSERT (type: system/transaction)
  -> Realtime subscription tetiklenir
  -> Badge artar (mesaj ikonu)
  -> Kullanici mesaj kutusunu acar
  -> Sistem Mesajlari bolumunde gorur
  -> Otomatik read: true -> Badge sifirlanir
```

### v2.10.0 — 11 Nisan 2026, 01:40 (UTC+3)
**Admin Panel Genisletmesi ve Capraz Platform Esitligi:**

**Kullanici Detay Ekrani (`UserDetailScreen.tsx`) [YENI]:**
- Navigasyon: `navigation.navigate('UserDetail', { userId })` ile erisim.
- Supabase Joins: `Promise.all` ile `profiles` + `transactions` + `swap_listings` es zamanli sorgusu.
- GUVEN_SKORU: `(tamamlanan / toplam) x 100` — Neon progress bar.
  - `>=80` = GUVENILIR | `>=50` = ORTA_RISK | `<50` = YUKSEK_RISK
- 4 Operasyon Sekmesi:
  1. GENEL — Profil verileri + Finansal ozet
  2. ISLEMLER — Tum transactions (SEEKER/SUPPORTER rolu, Tracker'a hizli gecis)
  3. ILANLAR — swap_listings (MarketDetail'a hizli gecis)
  4. AKTIVITE — Kronolojik timeline (islemler + ilanlar birlesik)
- `MainStack.tsx`: `UserDetail` route eklendi.
- `linking.ts`: `user/:userId` deep link eklendi.

**Web Admin Degisiklikleri (anti repo v3.5.0 ile senkron):**
- `AdminFinance.tsx`: SENTINEL Financial Operations arayuzu (gercek veri).
- `AdminUserDetail.tsx` [YENI]: Kullanici detay sayfasi (4 sekme + GUVEN_SKORU).
- `AdminUsers.tsx`: Gercek Supabase verisi, arama, navigasyon.
- `AdminMessages.tsx` [YENI]: Tek/toplu kullanici bildirim gonderme sistemi.

### v2.9.0 — 10 Nisan 2026, 08:00 (UTC+3)
**Arsiv Sistemi:**

- **`transactions_archive` Tablosu**: Tamamlanan/iptal edilen/reddedilen talepler otomatik olarak arşiv tablosuna kopyalanır (DB trigger ile).
- **Admin Operasyon Geçmişi**: Web admin paneli artık `transactions_archive` tablosundan veri çeker.
- **SQL Referans Dosyası**: `anti/database/create_transactions_archive.sql` oluşturuldu.

### v2.8.0 — 10 Nisan 2026, 05:00 (UTC+3)
**🔒 Çapraz Platform Veritabanı Uyum & RLS Kesinleştirmesi:**

- **RLS Politika Düzeltmesi**: `transactions` tablosunun SELECT ve UPDATE politikaları admin rolü desteği ile yeniden yapılandırıldı. Admin artık `pending` talepleri görebilir ve onay/red yapabilir.
- **Admin Onay Akışı**: `createTransactionRequest` başlangıç statüsü `'waiting-supporter'` → `'pending'` olarak düzeltildi. Tüm talepler admin onayı gerektiriyor.
- **İptal Farklılaştırması**: Mobile'daki `cancelTransactionBySeeker` ve `cancelTransactionBySupporter` mantığı Web'e de taşındı, çapraz platform eşitliği sağlandı.
- **Tip Senkronizasyonu**: `Profile` tipine `role: string | null` eklendi. `SwapListing` tipinden deprecated `user_id` kaldırıldı.
- **RLS Referans SQL**: `anti/database/fix_rls_admin_policies.sql` oluşturuldu.

### v2.7.0 — 09 Nisan 2026, 22:50 (UTC+3)
**🛠️ Web Platformu — ESLint & Kod Kalitesi Düzeltme Raporu:**

Web (`anti`) projesinde tespit edilen **22 adet ESLint hatası/uyarısı** tamamen giderildi:

- **State Yönetimi:** `Home.tsx` ve `Tracker.tsx` dosyalarındaki `useEffect` içinde `setState` çağrıları düzeltildi (türetilmiş değişken ve `useRef` kullanımı).
- **Tip Güvenliği:** `services.ts`, `Profile.tsx`, `AdminDirectLogin.tsx` dosyalarındaki `any` tip atamaları `unknown`, `Record<>` ve spesifik tipler ile değiştirildi.
- **Admin Paneli:** `AdminMarket.tsx` (×7) ve `AdminRequests.tsx` dosyalarındaki gereksiz `as any` tip atamaları interface'den direkt erişim ile temizlendi.
- **Güvenlik:** `supabase.ts` dosyasındaki `@ts-ignore` → `@ts-expect-error` güncellendi.
- **Kod Temizliği:** `TaleplerCreate.tsx` kullanılmayan değişken, `SwapCreate.tsx` non-null assertion düzeltildi.

**Sonuç:** ESLint ✅ 0 hata · TypeScript (tsc --noEmit) ✅ 0 hata

### v2.6.0 — 09 Nisan 2026
**🔧 Senkronizasyon ve Modernizasyon:**
- **GitHub Sync**: Web ve Mobil repoları en güncel sürümlerle senkronize edildi.
- **Şema Birleştirme**: Mobil projeye `listing_id` (SENTINEL) ve `expiry_date` (30 gün) alanları entegre edildi, yerel konum verileri korundu.
- **dbService Optimizasyonu**: `createTransactionRequest` ve `renewListing` fonksiyonları SENTINEL standartlarına göre güncellendi.
- **Tip Güvenliği**: `Transaction` ve `SwapListing` tipleri çapraz platform uyumlu hale getirildi.

### v2.5.0 — 02 Nisan 2026
... (eski kayıtlar)

---
*Son Guncelleme: 13 Nisan 2026, 02:07 (UTC+3)*
