# Mobil & Web Uyum Rehberi (Workigom)

Bu doküman, Workigom projesinin mobil (React Native) ve web (Vite) uygulamalarının aynı Supabase backend'i üzerinde sorunsuz çalışması için uyulması gereken mimari standartları içerir.

## 1. Supabase Yapılandırması
Her iki uygulama da aynı Supabase projesini kullanmalıdır:
- **Project URL**: `https://toqroogfufzgxsxemfeh.supabase.co`
- **Bucketlar**: `images`, `qr-codes`, `avatars` (Büyük/küçük harf duyarlı).

## 2. Veritabanı Şeması ve Alan İsimleri
Uyumsuzlukları önlemek için aşağıdaki alan isimleri standartlaştırılmıştır:

### `swap_listings` Tablosu
- `owner_id`: İlanı açan kullanıcının ID'si (Eskiden `user_id` idi).
- `required_balance`: İlan edilen ürün karşılığında beklenen bakiye (Eskiden `price` idi).
- `photo_url`: Virgülle ayrılmış fotoğraf URL'leri (Eskiden `image_url` ve tek fotoğraf idi).

### `transactions` Tablosu
- `seeker_id`: Talebi açan (Yararlanıcı).
- `supporter_id`: Talebi kabul eden (Destekçi).

## 3. Güçlü Sorgu Mimarlığı (Robust Joins)
Supabase (PostgREST) sorgularında dış anahtar isimleri (fkey constraints) yerine **sütun bazlı ipuçları** kullanılmalıdır. Bu sayede veritabanındaki constraint isim değişikliklerinden etkilenmezsiniz.

**Örnek (KÖTÜ - Kırılgan):**
```typescript
.select('*, profiles!transactions_seeker_id_fkey(full_name)')
```

**Örnek (İYİ - Güçlü):**
```typescript
.select('*, profiles!seeker_id(full_name)')
```

## 4. Kimlik Doğrulama ve Profil Senkronizasyonu (JIT)
Kullanıcının Supabase Auth ile giriş yapması, public şemada profilinin oluştuğu anlamına gelmez. Bu nedenle **Just-In-Time (JIT)** profil oluşturma mantığı uygulanmalıdır.
- Her oturum başlangıcında `profiles` tablosu kontrol edilir.
- Eğer profil yoksa otomatik olarak (varsayılan avatar ile) oluşturulur.
- Mobil: `useAuthStore.ts` içinde `DBService.ensureUserProfile` çağrılır.
- Web: `AuthContext.tsx` içinde `DBService.ensureUserProfile` çağrılır.

## 5. Medya ve Fotoğraflar
- **Çoklu Fotoğraf**: `photo_url` alanı virgülle ayrılmış text yapısındadır. Uygulamalarda gösterim yaparken `.split(',')` kullanılmalıdır.
- **Avatarlar**: `picsum.photos` servisinin kararsızlığı nedeniyle `ui-avatars.com` standart olarak belirlenmiştir.

## 6. Route Koruması
Özel rotalara (Private Routes) sadece:
1. Oturum açmış,
2. E-postası onaylanmış,
3. Profili oluşturulmuş
kullanıcıların erişimine izin verilmelidir.

---
*Son Güncelleme: 25 Mart 2026*
