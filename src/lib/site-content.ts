export type Locale = "tr" | "en";

export const SITE_URL = "https://www.basarimuhendisi.com.tr";
export const ORDER_URL = `${SITE_URL}/siparis`;
export const INSTAGRAM_URL = "https://www.instagram.com/ziyasakir/";
export const LINKEDIN_URL = "https://www.linkedin.com/in/ziyayilmaz";
export const TELEGRAM_URL = "https://t.me/ziyasakiryilmaz";
export const WHATSAPP_URL = "https://wa.me/900000000000"; // Geçici: resmi davet bağlantısıyla değiştirilecek.
export const PRIMARY_EMAIL = "zsyilmaz@gmail.com";
export const TEST_CC_EMAIL = "dev.busraaktas@gmail.com";

const shared = {
  talks: [
    {
      title: "Bir Hayal Hikayesi",
      year: "2020",
      url: "https://www.ted.com/talks/ziya_sakir_yilmaz_bir_hayal_hikayesi",
    },
    {
      title: "Kendini Terk Etmenin Büyüsü",
      year: "2021",
      url: "https://www.ted.com/talks/ziya_sakir_yilmaz_kendini_terk_etmenin_buyusu",
    },
  ],
};

export const copy = {
  tr: {
    localeLabel: "TR",
    otherLocale: "EN",
    switchLabel: "English",
    title: "Ziya Şakir Yılmaz | Başarı Mühendisi, Eğitmen ve Yazar",
    description: "Satış, liderlik, girişimcilik, iletişim ve Başarı Mühendisliği alanlarında eğitimler, kurumsal konuşmalar ve mentorluk.",
    nav: [
      ["Yaklaşım", "#yaklasim"], ["Programlar", "#programlar"], ["TEDx", "#tedx"], ["Kitaplar", "#kitaplar"], ["İletişim", "#iletisim"],
    ],
    register: "Eğitime katıl",
    eyebrow: "Başarı Mühendisi · Eğitmen · Yazar",
    heroFixed: "BAŞARI ŞANSA BIRAKILMAZ.",
    heroWords: ["TASARLANIR", "ÖLÇÜLÜR", "İNŞA EDİLİR"],
    heroAria: "Başarı tasarlanır, ölçülür ve inşa edilir",
    heroBody: "Satıştan liderliğe, iletişimden girişimciliğe; insan ve kurumların potansiyelini ölçülebilir sonuçlara dönüştüren sistemler.",
    explore: "Programları keşfet",
    trust: "Canlı eğitim · Kurumsal program · Lider mentorluğu",
    imageAlt: "Ziya Şakir Yılmaz konuşma yaparken",
    stats: [
      ["84", "Ülke deneyimi"], ["90+", "İhracat yapılan ülke"], ["600.000", "Eğitim verilen insan"], ["75 BİN", "Kitap satışı"], ["15M+", "Video izlenmesi"],
    ],
    approachKicker: "01 · Yaklaşım",
    approachTitle: "İlham veren bir konuşmadan fazlası: uygulanabilir bir sistem.",
    approachBody: "Başarı Mühendisliği, motivasyonu geçici bir yükseliş olarak değil; hedef, davranış ve sonuç arasında kurulabilen bir disiplin olarak ele alır.",
    expertise: [
      ["Satış", "Güven kuran, ihtiyacı doğru okuyan ve sürdürülebilir büyüme yaratan satış yaklaşımı."],
      ["Liderlik", "İnsanları ortak bir hedefte buluşturan, sorumluluk ve kültür inşa eden liderlik."],
      ["Girişimcilik", "Fikri pazara, belirsizliği karara ve çabayı tekrarlanabilir sisteme dönüştürmek."],
      ["İletişim", "Sahne, ekip ve müşteri temasında açık, ikna edici ve insan odaklı iletişim."],
      ["Başarı Mühendisliği", "Potansiyeli ölçülebilir adımlara ve kalıcı davranış değişikliğine dönüştüren metodoloji."],
    ],
    programsKicker: "02 · Programlar",
    programsTitle: "Farklı hedefler için, aynı sonuç disiplini.",
    programs: [
      { type: "Canlı Eğitim", title: "Satış ve İş Ortağı Kazanma", body: "Müşteri bulma, güven oluşturma, itiraz yönetimi, kapanış ve takip için uygulamalı eğitim.", cta: "Kayıt ve ödeme", href: ORDER_URL },
      { type: "Kurumsal", title: "Keynote ve Ekip Programları", body: "Satış ekipleri, liderlik kadroları, bayi ağları ve kurum etkinlikleri için hedefe özel içerik.", cta: "Kurumsal teklif al", href: "#iletisim" },
      { type: "Birebir", title: "Lider Mentorluğu", body: "Girişimci ve yöneticiler için hedef, ekip, kişisel marka ve büyüme odağında birebir çalışma.", cta: "Görüşme talep et", href: "#iletisim" },
    ],
    tedKicker: "03 · TEDx",
    tedTitle: "Fikrin gücü, sahnenin ötesinde başlar.",
    tedBody: "İki TEDx konuşması; hayal kurmak, değişmek ve insanın kendisiyle kurduğu ilişki üzerine güçlü bir anlatı.",
    watch: "TED.com’da izle",
    booksKicker: "04 · Yayınlar",
    booksTitle: "Düşünceden davranışa uzanan iki kitap.",
    books: [
      ["Başarı Mühendisliği", "Başarıyı tesadüften çıkarıp tasarlanabilir bir sürece dönüştüren yol haritası."],
      ["Size Bir Sır Vereyim mi?", "İnsana inanmanın, paylaşmanın ve harekete geçmenin dönüştürücü gücü."],
    ],
    notesTitle: "Hayattan Notlar",
    notesBody: "Kısa fikirler, deneyimler ve her güne eşlik eden notlar. Tercih ettiğiniz topluluktan doğrudan katılın.",
    whatsapp: "WhatsApp’a katıl",
    telegram: "Telegram’a katıl",
    contactKicker: "05 · İletişim",
    contactTitle: "Doğru sahne, doğru içerik, gerçek etki.",
    contactBody: "Kurumsal eğitim, konuşma, mentorluk ve iş birlikleri için talebinizi iletin.",
    labels: { name: "Ad Soyad", email: "E-posta", subject: "Konu", message: "Mesajınız" },
    placeholders: { name: "Adınız ve soyadınız", email: "ornek@sirket.com", subject: "Kurumsal eğitim talebi", message: "Etkinlik, ekip ve hedefiniz hakkında kısa bilgi..." },
    send: "E-posta taslağını aç",
    formNote: "Gönder düğmesi e-posta uygulamanızda Ziya Bey’e ve test kopyasına hazır bir taslak açar.",
    requiredError: "Lütfen tüm alanları eksiksiz ve geçerli biçimde doldurun.",
    footer: "Satış · Liderlik · Girişimcilik · İletişim · Başarı Mühendisliği",
    rights: "Tüm hakları saklıdır.",
    themeLight: "Açık tema",
    themeDark: "Koyu tema",
    menu: "Menü",
  },
  en: {
    localeLabel: "EN",
    otherLocale: "TR",
    switchLabel: "Türkçe",
    title: "Ziya Şakir Yılmaz | Success Engineer, Speaker and Author",
    description: "Training, corporate keynotes and mentoring in sales, leadership, entrepreneurship, communication and Success Engineering.",
    nav: [["Approach", "#approach"], ["Programs", "#programs"], ["TEDx", "#tedx"], ["Books", "#books"], ["Contact", "#contact"]],
    register: "Join a program",
    eyebrow: "Success Engineer · Speaker · Author",
    heroFixed: "SUCCESS IS NEVER LEFT TO CHANCE.",
    heroWords: ["DESIGNED", "MEASURED", "BUILT"],
    heroAria: "Success is designed, measured and built",
    heroBody: "From sales to leadership, communication to entrepreneurship: systems that turn individual and organizational potential into measurable results.",
    explore: "Explore programs",
    trust: "Live training · Corporate programs · Leadership mentoring",
    imageAlt: "Ziya Şakir Yılmaz speaking on stage",
    stats: [["84", "Countries experienced"], ["90+", "Export markets"], ["600,000", "People trained"], ["75K", "Books sold"], ["15M+", "Video views"]],
    approachKicker: "01 · Approach",
    approachTitle: "More than an inspiring talk: an applicable system.",
    approachBody: "Success Engineering treats motivation not as a temporary high, but as a discipline connecting goals, behavior and outcomes.",
    expertise: [
      ["Sales", "A sales approach that builds trust, identifies real needs and creates sustainable growth."],
      ["Leadership", "Leadership that aligns people around a shared goal and builds responsibility and culture."],
      ["Entrepreneurship", "Turning ideas into markets, uncertainty into decisions and effort into repeatable systems."],
      ["Communication", "Clear, persuasive and human-centered communication across stages, teams and customer moments."],
      ["Success Engineering", "A methodology that translates potential into measurable steps and lasting behavioral change."],
    ],
    programsKicker: "02 · Programs",
    programsTitle: "Different goals. The same discipline of results.",
    programs: [
      { type: "Live Training", title: "Winning Customers and Business Partners", body: "Practical training in prospecting, trust, objections, closing and follow-up.", cta: "Register and pay", href: ORDER_URL },
      { type: "Corporate", title: "Keynotes and Team Programs", body: "Goal-specific content for sales teams, leadership groups, dealer networks and corporate events.", cta: "Request a proposal", href: "#contact" },
      { type: "One-to-one", title: "Leadership Mentoring", body: "Focused work for founders and executives across goals, teams, personal brand and growth.", cta: "Request a meeting", href: "#contact" },
    ],
    tedKicker: "03 · TEDx",
    tedTitle: "The power of an idea begins beyond the stage.",
    tedBody: "Two TEDx talks exploring dreams, transformation and the relationship we build with ourselves.",
    watch: "Watch on TED.com",
    booksKicker: "04 · Publications",
    booksTitle: "Two books, from thought to action.",
    books: [
      ["Başarı Mühendisliği", "A roadmap that turns success from chance into a process that can be designed."],
      ["Size Bir Sır Vereyim mi?", "On the transformative power of believing in people, sharing and taking action."],
    ],
    notesTitle: "Notes from Life",
    notesBody: "Short ideas, experiences and a note for every day. Join directly through your preferred community.",
    whatsapp: "Join on WhatsApp",
    telegram: "Join on Telegram",
    contactKicker: "05 · Contact",
    contactTitle: "The right stage, the right message, real impact.",
    contactBody: "Tell us about your corporate training, keynote, mentoring or collaboration request.",
    labels: { name: "Full name", email: "Email", subject: "Subject", message: "Your message" },
    placeholders: { name: "Your full name", email: "name@company.com", subject: "Corporate training request", message: "A short note about your event, team and goals..." },
    send: "Open email draft",
    formNote: "The button opens a prepared draft to Ziya and the temporary test copy in your email app.",
    requiredError: "Please complete every field with valid information.",
    footer: "Sales · Leadership · Entrepreneurship · Communication · Success Engineering",
    rights: "All rights reserved.",
    themeLight: "Light theme",
    themeDark: "Dark theme",
    menu: "Menu",
  },
} as const;

export { shared };
