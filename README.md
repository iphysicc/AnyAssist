# AnyAssist - Akıllı Masaüstü Asistanı

<p align="center">
  <img src="public/logo.png" alt="AnyAssist Logo" width="150" />
</p>

AnyAssist, günlük görevlerinizi kolaylaştırmak için tasarlanmış, modern ve kullanımı kolay bir masaüstü yapay zeka asistanıdır. Gelişmiş AI modellerinin gücünü masaüstünüze taşıyarak size özel bir deneyim sunar.

## Özellikler

- 💬 **Çoklu Dil Desteği**: İngilizce ve Türkçe konuşma desteği
- 🧠 **Yapay Zeka Entegrasyonu**: Google Gemini AI ile entegre çalışma
- 🖥️ **Modern Arayüz**: Kullanıcı dostu, modern ve şık tasarım
- 🔄 **Otomatik Güncellemeler**: Uygulama içi güncelleme sistemi
- ⚡ **Yüksek Performans**: Tauri ve Rust altyapısı ile hızlı ve verimli çalışma
- 🔒 **Gizlilik Odaklı**: Verileriniz yerel cihazınızda tutulur
- 🌙 **Karanlık Mod**: Göz yormayan gece modu desteği
- 📱 **Çoklu Platform**: Windows, macOS ve Linux desteği

## Kurulum

### Son Kullanıcı İçin

1. [Releases](https://github.com/iphysicc/AnyAssist/releases) sayfasından işletim sisteminize uygun kurulum dosyasını indirin
2. İndirdiğiniz dosyayı çalıştırarak kurulumu tamamlayın
3. AnyAssist uygulamasını başlatın ve kullanmaya başlayın

### Geliştiriciler İçin

```bash
# Bağımlılıkları yükleyin
pnpm install

# Geliştirme modunda çalıştırın
pnpm tauri dev

# Dağıtım için derleyin
pnpm tauri build
```

## Proje Yapısı

- `/src` - Next.js arayüz kodları
- `/src-tauri` - Tauri/Rust backend kodları
- `/public` - Statik dosyalar
- `/dist` - Derlenen web arayüzü (otomatik oluşturulur)
- `/.github` - GitHub Actions yapılandırmaları

## Kullanım

1. **Başlangıç**: Uygulamayı açın ve Google Gemini API anahtarınızı girerek başlayın.
2. **Sohbet**: Sol panelde yeni bir sohbet başlatın veya mevcut bir sohbeti seçin.
3. **Komutlar**: Özel komutlar için `/` karakterini kullanabilirsiniz.
4. **Ayarlar**: Uygulama ayarlarına sağ üst köşedeki düğmeden erişebilirsiniz.

## Teknik Altyapı

- **Frontend**: Next.js 15, TailwindCSS 4, React 19
- **Backend**: Tauri 2.0, Rust
- **AI Modeli**: Google Gemini API
- **Güncelleme Sistemi**: Tauri Updater

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## İletişim

Projemize katkıda bulunmak, geri bildirim vermek veya destek almak için:

- [GitHub Issues](https://github.com/iphysicc/AnyAssist/issues)
- [Twitter: @iphysicc](https://twitter.com/iphysicc)

---

<p align="center">
  AnyAssist - Bilgisayarınızdaki yapay zeka arkadaşınız
</p>
