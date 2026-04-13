/**
 * Market İlan Oluşturma — Konum Verileri
 * Sadece İstanbul (Anadolu/Avrupa), Ankara, İzmir
 */

// İstanbul Anadolu Yakası İlçeleri
const ISTANBUL_ANADOLU = [
  'Adalar', 'Ataşehir', 'Beykoz', 'Çekmeköy', 'Kadıköy', 'Kartal',
  'Maltepe', 'Pendik', 'Sancaktepe', 'Sultanbeyli', 'Şile', 'Tuzla',
  'Ümraniye', 'Üsküdar'
];

// İstanbul Avrupa Yakası İlçeleri
const ISTANBUL_AVRUPA = [
  'Arnavutköy', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy',
  'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beylikdüzü', 'Beyoğlu',
  'Büyükçekmece', 'Çatalca', 'Esenler', 'Esenyurt', 'Eyüpsultan',
  'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kağıthane', 'Küçükçekmece',
  'Sarıyer', 'Silivri', 'Sultangazi', 'Şişli', 'Zeytinburnu'
];

// Ankara İlçeleri
const ANKARA = [
  'Altındağ', 'Çankaya', 'Etimesgut', 'Gölbaşı', 'Keçiören',
  'Mamak', 'Pursaklar', 'Sincan', 'Yenimahalle', 'Çubuk',
  'Kahramankazan', 'Polatlı', 'Beypazarı', 'Elmadağ'
];

// İzmir İlçeleri
const IZMIR = [
  'Balçova', 'Bayraklı', 'Bornova', 'Buca', 'Çeşme', 'Çiğli',
  'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karşıyaka', 'Kemalpaşa',
  'Konak', 'Menemen', 'Narlıdere', 'Torbalı', 'Urla', 'Aliağa',
  'Bergama', 'Dikili', 'Foça', 'Menderes', 'Ödemiş', 'Seferihisar',
  'Selçuk', 'Tire'
];

export const MARKET_CITIES = ['İstanbul Anadolu', 'İstanbul Avrupa', 'Ankara', 'İzmir'] as const;

export type MarketCity = typeof MARKET_CITIES[number];

export const MARKET_DISTRICTS: Record<MarketCity, string[]> = {
  'İstanbul Anadolu': ISTANBUL_ANADOLU,
  'İstanbul Avrupa': ISTANBUL_AVRUPA,
  'Ankara': ANKARA,
  'İzmir': IZMIR,
};

export const getMarketDistricts = (city: MarketCity): string[] => {
  return (MARKET_DISTRICTS[city] || []).sort((a, b) => a.localeCompare(b, 'tr'));
};
