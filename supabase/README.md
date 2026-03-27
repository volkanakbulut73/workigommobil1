# Workigom Supabase Yapılandırma Rehberi

Bu dosya, projenin backend tarafındaki kritik yapılandırmaları ve RLS (Satır Bazlı Güvenlik) politikalarını dokümante eder.

## 🤖 Gemini AI Bot (Edge Function)

- **Model:** `gemini-2.5-flash`
- **Endpoint:** `v1beta/models/gemini-2.5-flash:generateContent`
- **Geliştirme Modu:** `verify_jwt = false` (CORS ve manuel fetch uyumu için).
- **Deployment:** 
  ```bash
  npx supabase functions deploy gemini-bot --no-verify-jwt --project-ref [REF]
  ```

## 💬 Mesajlaşma & Bildirim Sistemi

### RLS Politikaları
Mesajlaşma ve bildirimlerin çalışması için aşağıdaki RLS politikalarının uygulanmış olması gerekir:

**`notifications` Tablosu:**
```sql
-- Bildirim oluşturma izni (Mesaj gönderildiğinde tetiklenir)
create policy "Bildirim Olusturma" on public.notifications for insert with check (true);

-- Bildirimleri görüntüleme ve okundu işaretleme
create policy "Bildirimleri Goruntuleme" on public.notifications for select using (auth.uid() = user_id);
create policy "Bildirim Guncelleme" on public.notifications for update using (auth.uid() = user_id);
```

**`threads` Tablosu:**
```sql
-- Sadece alıcı veya satıcı görebilir/oluşturabilir
create policy "Mesajlasmalari Goruntuleme" on public.threads for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Mesajlasma Olusturma" on public.threads for insert with check (auth.uid() = buyer_id or auth.uid() = seller_id);
```

### Zengin Mesajlaşma Bağlamı
Market ilanları üzerinden başlatılan sohbetlerde ilk mesaj otomatik olarak ilan bilgisini içerir:
`[İlan: İlan Başlığı] Merhaba, bu ilanınızla ilgileniyorum...`

---
*Son Güncelleme: 28 Mart 2026 - Antigravity AI*
