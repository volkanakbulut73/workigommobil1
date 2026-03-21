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