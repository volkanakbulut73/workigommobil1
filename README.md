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

**1. Veri Yapısı ve Tablolar:**
- **`threads` (Sohbet Kanalları):** Alıcı ve satıcı arasındaki her bir ilan veya özel görüşme için benzersiz bir kanal oluşturulur. `buyer_id` ve `seller_id` üzerinden çift yönlü kontrol yapılır (Aynı iki kişi için tek thread).
- **`messages` (Mesajlar):** Her thread'e bağlı mesajlar burada saklanır. Gönderen (`sender_id`) ve alıcı (`receiver_id`) bilgileri ile `read` (okundu) durumu tutulur.
- **`notifications` (Bildirimler):** Bir mesaj gönderildiğinde, alıcı için otomatik olarak `type='new_message'` tipinde bir bildirim kaydı oluşturulur. Okunmamış mesaj sayıları bu tablo üzerinden hesaplanır.

**2. Canlı Dinleme (Realtime):**
- **Supabase Realtime**: Uygulama açıkken gelen yeni mesajlar ve bildirimler anlık olarak (WebSocket üzerinden) dinlenir. 
- **Zustand Store (`useMessageStore` & `useNotificationStore`)**: Gelen veriler merkezi store'da güncellenerek tüm ekranların (Tab Menu, Thread Listesi, Chat Ekranı) anında güncellenmesi sağlanır.

**3. Bildirim ve Badge Yönetimi:**
- **Tab Bar Badge**: Alt menüdeki mesaj ikonunda, okunmamış bildirim sayısı kadar kırmızı bir işaret (badge) gösterilir.
- **Thread Listesi**: Okunmamış mesajı olan sohbetlerin yanında görsel bir işaret (mavi nokta) belirir.
- **Web Senkronizasyonu**: Mesaj mobilden okunduğunda, web versiyonundaki bildirim sayısı ve tarayıcı sekme başlığı (örn: `(3) Workigom`) otomatik olarak güncellenir.

## 📝 Standart Supabase Mesajlaşma Şablonu (Mobil & Web)

**DİKKAT:** Web ve Mobil platformlar arasında mesajlaşma senkronizasyonunun bozulmaması için anlık mesaj ve thread işlemleri *kesinlikle* aşağıdaki standart yapılandırmaya sadık kalınarak yapılmalıdır. Kod üzerinde herhangi bir yanlışlık yapıldığında düzeltmeler doğrudan bu şablona göre yapılacaktır:

### 1. Thread (Sohbet Kanalı) Bulma veya Oluşturma (`findOrCreateThread`)
Her sohbet kanalı (`threads`), `buyer_id`, `seller_id` ve `type` parametreleri dikkate alınarak tekil olmalıdır. Ters yönlü sorgular da (A-B ve B-A) kontrol edilmelidir.
```typescript
// Yön 1: buyer_id = A, seller_id = B
let query = supabase.from('threads').select('*').eq('buyer_id', buyerId).eq('seller_id', sellerId).eq('type', moduleType);
// Yön 2: buyer_id = B, seller_id = A (Ters Yön Kontrolü)
// Eğer ikisinde de kayıt yoksa, yeni insert işlemi: { buyer_id, seller_id, type, listing_id, last_message: null }
```

### 2. Mesaj Gönderme ve Bildirim Oluşturma (`sendMessage`)
Bir mesaj gönderildiğinde, daima ardışık olarak şu 3 işlem gerçekleşmelidir:
1. **Mesajı Kaydet:** `messages` tablosuna `{ thread_id, sender_id, receiver_id, content }` insert edilir.
2. **Thread'i Güncelle:** `threads` tablosundaki `last_message` sütunu son atılan mesajın metniyle ve `updated_at` sütunu anlık tarihle güncellenir.
3. **Bildirim Yarat:** Alıcı (receiver) için `notifications` tablosuna `{ user_id: receiverId, type: 'new_message', content, thread_id, read: false }` datası eklenir. (Okunmamış sayaçları bu tablo üzerinden eşleşir).

### 3. Mesajları Çekme ve Optimistic UI
- **Canlı Dinleme:** Supabase Realtime (`postgres_changes`) ile `messages` tablosundaki `INSERT` eventleri dinlenir.
- **Optimistic UI:** Kullanıcı bir metin gönderdiğinde cevap beklemeden mesaj anında ekranda gösterilir (State array'e temp message eklenir). Realtime socket üzerinden aynı mesaj geri geldiğinde `sender_id !== user.id` kontrolü ile çiftleme (duplicate) engellenir. Sadece karşı tarafın attığı mesajlar state'e dahil edilir.

### 4. Mesajları Okundu İşaretleme (`markThreadMessagesAsRead`)
Canlı sohbet ekranına girildiğinde veya sohbet esnasında, thread'deki okuyucu bizsek (`receiver_id === user.id`) tüm mevcut mesajlar `read = true` olarak işaretlenir. Bu sayede web ve mobil platformlarda açık olan aynı hesap senkronize olarak bildirim işaretini anında siler.

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