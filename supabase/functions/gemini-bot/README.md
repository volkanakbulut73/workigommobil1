# Workigom Gemini Bot (v2.5 Flash)

Bu doküman, Workigom ekosistemindeki (Web & Mobil) Gemini yapay zeka entegrasyonunun nasıl yapılandırıldığını ve korunduğunu açıklar.

## 🚀 Model ve API Yapılandırması

- **Model:** `gemini-2.5-flash` (En güncel ve hızlı sürüm)
- **Endpoint:** `v1beta/models/gemini-2.5-flash:generateContent`
- **İşlev:** Sadece metin tabanlı sohbet (Text-only).
- **Karakter:** Cyberpunk/Neon temalı "Workigom AI" asistanı.

## 🛠 Supabase Ayarları (`config.toml`)

Geliştirme aşamasında 401 (Unauthorized) hatalarını önlemek için JWT doğrulaması devre dışı bırakılmıştır:

```toml
[functions.gemini-bot]
enabled = true
verify_jwt = false
import_map = "./functions/gemini-bot/deno.json"
entrypoint = "./functions/gemini-bot/index.ts"
```

## 🔑 Environment Variables (Secrets)

Fonksiyonun çalışması için Supabase üzerinde `GEMINI_API_KEY` tanımlı olmalıdır.
Komut satırından ayarlamak için:
```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSy..." --project-ref toqroogfufzgxsxemfeh
```

## 🚢 Deployment (Dağıtım)

Fonksiyonu deploy ederken `--no-verify-jwt` flag'ini kullanmak kritik bir önem taşır:

```bash
npx supabase functions deploy gemini-bot --no-verify-jwt --project-ref toqroogfufzgxsxemfeh
```

## 💻 Frontend Entegrasyonu (Manuel Fetch)

Supabase SDK (`invoke`) bazen JWT doğrulaması kapalıyken header hataları verebilir. Bu yüzden hem Web hem Mobil tarafta **manuel fetch** yöntemi tercih edilmiştir:

```typescript
const response = await fetch('https://toqroogfufzgxsxemfeh.supabase.co/functions/v1/gemini-bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: content, 
    user_name: profile.full_name 
  }),
});
```

## ⚠️ Dikkat Edilmesi Gerekenler

1. **Güvenlik:** Proje yayına (Production) alınırken `verify_jwt = true` yapılmalı ve frontend tarafında standart auth header'ları eklenmelidir.
2. **Endpoint:** `interactions` API'si yerine `generateContent` kullanılarak en yüksek hız ve basitlik ("Nokta Atışı") hedeflenmiştir.
3. **Deno:** Fonksiyon Deno runtime üzerinde çalışır (`deno.json` üzerinden bağımlılıklar yönetilir).

---
*Created by Antigravity AI for Workigom Project.*
