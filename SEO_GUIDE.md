# Grohn Fabrics SEO Rehberi

## Yapılanlar ✅

### 1. Teknik SEO
- **sitemap.xml** - `/sitemap.xml` adresinde otomatik oluşturulur
- **robots.txt** - `/robots.txt` adresinde arama motorları için kurallar
- **Canonical URL'ler** - Her sayfada canonical tag
- **Lang attribute** - `<html lang="tr">`

### 2. Metadata Optimizasyonu
- **Title template** - `Sayfa Adı | Grohn Fabrics` formatı
- **Meta description** - Her sayfa için özgün açıklama
- **Keywords** - İlgili anahtar kelimeler

### 3. Open Graph & Twitter Cards
- Facebook/LinkedIn paylaşımları için Open Graph
- Twitter için Twitter Cards
- 1200x630 boyutunda `/images/og-image.jpg` gerekli

### 4. Structured Data (JSON-LD)
- **Organization** - Şirket bilgileri
- **WebSite + SearchAction** - Google arama kutusunda site içi arama

---

## Yapılacaklar 📋

### 1. Google Search Console Kurulumu
1. [Google Search Console](https://search.google.com/search-console) açın
2. Domain veya URL prefix ile site ekleyin
3. Doğrulama kodunu `src/app/layout.js` içindeki `verification.google`'a ekleyin
4. Sitemap gönder: `https://grohnfabrics.com/sitemap.xml`

### 2. Bing Webmaster Tools
1. [Bing Webmaster Tools](https://www.bing.com/webmasters) açın
2. Site ekleyin ve doğrulayın
3. Sitemap gönderin

### 3. Google Analytics / Tag Manager
```html
<!-- layout.js <head> içine ekleyin -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
```

### 4. Görsel Optimizasyonları
- `/public/images/og-image.jpg` - 1200x630 sosyal medya görseli
- `/public/favicon.ico` - Site favicon
- `/public/apple-touch-icon.png` - 180x180 Apple ikonu
- Tüm ürün görsellerine `alt` tag ekleyin

### 5. Performance
- Next.js Image componenti kullanın (otomatik lazy loading)
- Font'ları preconnect ile yükleyin (zaten yapıldı)
- Core Web Vitals'ı izleyin

---

## Anahtar Kelime Stratejisi 🎯

### Ana Anahtar Kelimeler
- kumaş, fabric, tekstil
- ipek kumaş, silk fabric
- keten kumaş, linen fabric
- pamuk kumaş, cotton fabric
- kumaş mağazası, kumaş satış

### Uzun Kuyruk
- istanbul kumaş mağazası
- online kumaş satın al
- toptan kumaş fiyatları
- elbiselik kumaş çeşitleri
- doğal kumaş türleri

---

## İçerik Önerileri 📝

1. **Blog Sayfası** - Kumaş bakımı, trend kumaşlar, DIY projeleri
2. **Kumaş Rehberi** - Kumaş türleri ve kullanım alanları
3. **Müşteri Yorumları** - Sosyal kanıt
4. **Video İçerikler** - Kumaş tanıtımları (YouTube için)

---

## Performans Kontrolü 🔍

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
