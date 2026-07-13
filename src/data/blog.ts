import type { BlogPost, Locale } from "@/types";

export const blogCategories: Record<Locale, string[]> = {
  tr: ["Koruyucu Hekimlik", "Kedi Sağlığı", "Köpek Sağlığı", "Beslenme", "Acil Durum", "Bakım Rehberi"],
  en: ["Preventive Care", "Cat Health", "Dog Health", "Nutrition", "Emergency", "Care Guides"],
};

export const blogPosts: BlogPost[] = [
  {
    slug: "kedilerde-asi-takvimi-neden-onemlidir",
    locale: "tr",
    translationSlug: "why-vaccine-schedules-matter-for-cats",
    title: "Kedilerde Aşı Takvimi Neden Önemlidir?",
    description: "Aşı planının kedinizin yaşam evresi ve bireysel riskleri doğrultusunda veteriner hekimle birlikte nasıl ele alınması gerektiğini öğrenin.",
    image: "/images/blog/cat-vaccination.svg",
    imageAlt: "Koruyucu kalkan yanında stilize edilmiş kedi illüstrasyonu",
    featured: true,
    tags: ["aşı", "kedi", "koruyucu bakım"],
    publishedAt: "2026-06-12",
    updatedAt: "2026-07-10",
    author: "Onur Metehan Çakır",
    category: "Koruyucu Hekimlik",
    readingTime: "4 dk okuma",
    keywords: ["kedi aşısı", "kedi aşı takvimi", "koruyucu hekimlik", "Kuşadası veteriner"],
    tableOfContents: [
      { id: "neden-onemli", title: "Aşı planı neden önemlidir?" },
      { id: "bireysel-plan", title: "Her kedi için bireysel plan" },
      { id: "veterinere-danisin", title: "Ne zaman veteriner hekime danışılmalı?" },
    ],
    sections: [
      {
        id: "neden-onemli",
        title: "Aşı planı neden önemlidir?",
        paragraphs: [
          "Aşı takvimi, kedilerin belirli bulaşıcı hastalıklara karşı korunmasını destekleyen planlı koruyucu bakımın bir parçasıdır. Uygun zamanlama; yaş, önceki aşılar ve yaşam koşulları değerlendirilerek belirlenir.",
          "İnternetteki genel takvimler yol gösterici olabilir ancak kediniz için doğru programın yerine geçmez. Aşı öncesinde veteriner muayenesi, genel sağlık durumunun değerlendirilmesi açısından önemlidir.",
        ],
      },
      {
        id: "bireysel-plan",
        title: "Her kedi için bireysel plan",
        tone: "information",
        paragraphs: [
          "Evden dışarı çıkma, diğer hayvanlarla temas, yaş ve sağlık geçmişi risk değerlendirmesini değiştirir. Bu nedenle aşı türü ve zamanlaması veteriner hekim tarafından bireyselleştirilmelidir.",
          "Aşı kartını saklamak ve kontrol ziyaretlerine götürmek, geçmiş uygulamaların doğru izlenmesine yardımcı olur.",
        ],
      },
      {
        id: "veterinere-danisin",
        title: "Ne zaman veteriner hekime danışılmalı?",
        tone: "warning",
        paragraphs: [
          "Kediniz iyi görünmüyorsa, yakın zamanda hastalık geçirdiyse veya önceki uygulamalardan sonra beklenmeyen bir durum yaşandıysa aşı randevusundan önce veteriner hekime bilgi verin.",
          "Bu içerik muayenenin yerini tutmaz; kedinizin aşı planı yalnızca klinik değerlendirme sonrasında oluşturulmalıdır.",
        ],
      },
    ],
    relatedSlugs: ["yavru-kedilerde-ilk-veteriner-ziyareti", "evcil-hayvanlarda-acil-durum-belirtileri"],
  },
  {
    slug: "kopeklerde-duzenli-veteriner-kontrolu",
    locale: "tr",
    translationSlug: "why-regular-veterinary-checks-matter-for-dogs",
    title: "Köpeklerde Düzenli Veteriner Kontrolü",
    description: "Düzenli veteriner muayenelerinin köpeğinizin sağlık değişimlerini erken fark etmeye ve uzun vadeli bakım planlamaya katkısını inceleyin.",
    image: "/images/blog/dog-checkup.svg",
    imageAlt: "Stetoskop yanında stilize edilmiş köpek illüstrasyonu",
    featured: false,
    tags: ["köpek", "muayene", "sağlık takibi"],
    publishedAt: "2026-06-03",
    updatedAt: "2026-07-08",
    author: "Onur Metehan Çakır",
    category: "Köpek Sağlığı",
    readingTime: "5 dk okuma",
    keywords: ["köpek veteriner kontrolü", "köpek muayenesi", "koruyucu bakım", "Kuşadası veteriner"],
    tableOfContents: [
      { id: "duzenli-kontrol", title: "Düzenli kontrolün amacı" },
      { id: "muayenede-neler", title: "Muayenede neler değerlendirilir?" },
      { id: "erken-iletisim", title: "Kontrol tarihini beklememeniz gereken durumlar" },
    ],
    sections: [
      { id: "duzenli-kontrol", title: "Düzenli kontrolün amacı", paragraphs: ["Rutin kontroller; ağırlık, hareket, deri-tüy yapısı, ağız sağlığı ve davranış gibi alanlardaki değişimlerin zaman içinde izlenmesini sağlar.", "Kontrol sıklığı sabit bir kalıp değildir. Yaş, yaşam biçimi ve bilinen sağlık sorunları doğrultusunda veteriner hekimle planlanmalıdır."] },
      { id: "muayenede-neler", title: "Muayenede neler değerlendirilir?", tone: "information", paragraphs: ["Veteriner hekim genel fiziksel değerlendirmeyi yapar; beslenme, parazit koruması, aşı geçmişi ve günlük alışkanlıklar hakkında sorular sorabilir.", "Evde fark ettiğiniz değişiklikleri not almak görüşmenin daha verimli ilerlemesine yardımcı olur. Online bilgi bu fiziksel değerlendirmenin yerini tutmaz."] },
      { id: "erken-iletisim", title: "Kontrol tarihini beklememeniz gereken durumlar", tone: "warning", paragraphs: ["Solunum güçlüğü, bayılma, belirgin ağrı, tekrarlayan kusma veya ishal, ani karın şişliği ya da hızla kötüleşen genel durum varsa rutin kontrol gününü beklemeyin.", "Belirtinin önemini uzaktan kesinleştirmek mümkün değildir; uygun zamanlama için veteriner kliniğiyle iletişime geçin."] },
    ],
    relatedSlugs: ["kopeklerde-ic-ve-dis-parazit-korumasi", "evcil-hayvanlarda-yaz-sicaklarinda-dikkat-edilmesi-gerekenler"],
  },
  {
    slug: "evcil-hayvanlarda-acil-durum-belirtileri",
    locale: "tr",
    translationSlug: "warning-signs-that-need-urgent-veterinary-attention",
    title: "Evcil Hayvanlarda Acil Durum Belirtileri",
    description: "Hangi değişimlerin gecikmeden veteriner değerlendirmesi gerektirebileceğini ve güvenli biçimde nasıl hareket edebileceğinizi öğrenin.",
    image: "/images/blog/emergency-signs.svg",
    imageAlt: "Pati simgesi bulunan veteriner uyarı işareti illüstrasyonu",
    featured: false,
    tags: ["acil", "belirti", "güvenlik"],
    publishedAt: "2026-05-22",
    updatedAt: "2026-07-06",
    author: "Onur Metehan Çakır",
    category: "Acil Durum",
    readingTime: "6 dk okuma",
    keywords: ["evcil hayvan acil durum", "veteriner acil belirtileri", "köpek nefes darlığı", "kedi acil durum"],
    tableOfContents: [
      { id: "uyari-isaretleri", title: "Önemli uyarı işaretleri" },
      { id: "guvenli-hareket", title: "Güvenli biçimde hareket etmek" },
      { id: "hemen-iletisim", title: "Ne zaman hemen iletişim kurulmalı?" },
    ],
    sections: [
      { id: "uyari-isaretleri", title: "Önemli uyarı işaretleri", paragraphs: ["Solunum güçlüğü, bilinç değişikliği, bayılma, kontrol edilemeyen kanama, nöbet, ciddi travma veya hızla artan karın şişliği acil değerlendirme gerektirebilir.", "Tek bir belirti farklı nedenlerle ortaya çıkabilir. İnternetten tanı koymaya çalışmak yerine klinikle iletişime geçmek en güvenli yaklaşımdır."] },
      { id: "guvenli-hareket", title: "Güvenli biçimde hareket etmek", tone: "information", paragraphs: ["Hayvanı sakin, güvenli ve mümkün olduğunca az hareket ettirerek taşıyın. Bilinci etkilenmiş veya ağrılı hayvanlar istemeden ısırabilir; kendi güvenliğinizi de koruyun.", "Veteriner hekim önermeden ilaç, yiyecek veya sıvı vermeyin. İnsanlara yönelik ilaçlar hayvanlar için tehlikeli olabilir."] },
      { id: "hemen-iletisim", title: "Ne zaman hemen iletişim kurulmalı?", tone: "warning", paragraphs: ["Nefes alamama, tepkisizlik, sürekli nöbet, ciddi kanama, zehirlenme şüphesi veya ağır travmada gecikmeden bir veteriner sağlık kuruluşuna ulaşın.", "Bu liste eksiksiz değildir ve veteriner muayenesinin yerini tutmaz. Şüphede kaldığınızda profesyonel değerlendirme isteyin."] },
    ],
    relatedSlugs: ["evcil-hayvanlarda-yaz-sicaklarinda-dikkat-edilmesi-gerekenler", "kopeklerde-duzenli-veteriner-kontrolu"],
  },
  {
    slug: "yavru-kedilerde-ilk-veteriner-ziyareti",
    locale: "tr",
    translationSlug: "a-kittens-first-veterinary-visit",
    title: "Yavru Kedilerde İlk Veteriner Ziyareti",
    description: "Yavru kedinizin ilk veteriner ziyaretine nasıl hazırlanabileceğinizi ve muayenede hangi başlıkların konuşulabileceğini keşfedin.",
    image: "/images/blog/kitten-first-visit.svg",
    imageAlt: "Veteriner çantası yanında yavru kedi illüstrasyonu",
    featured: false,
    tags: ["yavru kedi", "ilk muayene", "bakım"],
    publishedAt: "2026-07-01",
    updatedAt: "2026-07-09",
    author: "Onur Metehan Çakır",
    category: "Kedi Sağlığı",
    readingTime: "5 dk okuma",
    keywords: ["yavru kedi ilk veteriner ziyareti", "yavru kedi muayenesi", "kedi bakımı", "Kuşadası veteriner"],
    tableOfContents: [
      { id: "ziyaret-oncesi", title: "Ziyaret öncesi hazırlık" },
      { id: "ilk-muayene", title: "İlk muayenede konuşulanlar" },
      { id: "beklemeden-basvurun", title: "Beklemeden danışılması gereken durumlar" },
    ],
    sections: [
      { id: "ziyaret-oncesi", title: "Ziyaret öncesi hazırlık", paragraphs: ["Güvenli bir taşıma çantası kullanın ve kedinin varsa önceki sağlık kayıtlarını yanınıza alın. Yeme, içme, tuvalet ve davranış düzenine ilişkin gözlemler de yararlıdır.", "Taşıma çantasını önceden erişilebilir bırakmak ve içine tanıdık bir örtü koymak yolculuk stresini azaltmaya yardımcı olabilir."] },
      { id: "ilk-muayene", title: "İlk muayenede konuşulanlar", tone: "information", paragraphs: ["Veteriner hekim büyüme, genel fiziksel durum, beslenme, parazitler, aşı planı ve ev güvenliği hakkında değerlendirme yapabilir.", "Plan yavru kedinin yaşı ve sağlık durumuna göre değişir. İnternetteki standart listeler muayene ile oluşturulan bireysel planın yerine geçmez."] },
      { id: "beklemeden-basvurun", title: "Beklemeden danışılması gereken durumlar", tone: "warning", paragraphs: ["Yememe, tekrarlayan kusma veya ishal, belirgin halsizlik, solunum güçlüğü ya da göz ve burundan yoğun akıntı varsa planlanan randevuyu beklemeden kliniğe danışın.", "Yavru hayvanların genel durumu daha hızlı değişebilir; zamanlama için veteriner hekim görüşü alın."] },
    ],
    relatedSlugs: ["kedilerde-asi-takvimi-neden-onemlidir", "evcil-hayvanlarda-acil-durum-belirtileri"],
  },
  {
    slug: "kopeklerde-ic-ve-dis-parazit-korumasi",
    locale: "tr",
    translationSlug: "internal-and-external-parasite-protection-for-dogs",
    title: "Köpeklerde İç ve Dış Parazit Koruması",
    description: "Parazit riskinin yaşam biçimine göre neden değiştiğini ve koruma planının veteriner hekimle nasıl oluşturulması gerektiğini okuyun.",
    image: "/images/blog/parasite-protection.svg",
    imageAlt: "Koruyucu daire içinde köpek illüstrasyonu",
    featured: false,
    tags: ["köpek", "parazit", "koruyucu bakım"],
    publishedAt: "2026-06-26",
    updatedAt: "2026-07-08",
    author: "Onur Metehan Çakır",
    category: "Koruyucu Hekimlik",
    readingTime: "5 dk okuma",
    keywords: ["köpek parazit koruması", "iç parazit", "dış parazit", "koruyucu veterinerlik"],
    tableOfContents: [
      { id: "riskler", title: "Riskler neden değişir?" },
      { id: "planlama", title: "Koruma planı nasıl belirlenir?" },
      { id: "belirtiler", title: "Veteriner değerlendirmesi gereken belirtiler" },
    ],
    sections: [
      { id: "riskler", title: "Riskler neden değişir?", paragraphs: ["Yaşanılan bölge, mevsim, dış ortamda geçirilen süre, seyahat ve diğer hayvanlarla temas parazit riskini etkileyebilir.", "Bazı parazitler belirgin bulgu oluşturmadan bulunabilir. Düzenli veteriner değerlendirmesi, uygun izlem yaklaşımının belirlenmesine yardımcı olur."] },
      { id: "planlama", title: "Koruma planı nasıl belirlenir?", tone: "information", paragraphs: ["Uygulama türü ve aralığı köpeğin yaşı, kilosu, sağlık geçmişi ve risklerine göre veteriner hekim tarafından belirlenmelidir.", "Reçeteli veya veteriner ürünü dahil hiçbir uygulamayı yalnızca çevrimiçi bilgiye dayanarak başlatmayın; yanlış ürün veya kullanım zararlı olabilir."] },
      { id: "belirtiler", title: "Veteriner değerlendirmesi gereken belirtiler", tone: "warning", paragraphs: ["Sürekli kaşıntı, tüy kaybı, cilt lezyonu, ishal, kusma, kilo kaybı veya dışkıda olağandışı görünüm varsa muayene planlayın.", "Belirtiler farklı hastalıklarda da görülebilir. Doğru değerlendirme için veteriner muayenesi gerekir."] },
    ],
    relatedSlugs: ["kopeklerde-duzenli-veteriner-kontrolu", "evcil-hayvanlarda-yaz-sicaklarinda-dikkat-edilmesi-gerekenler"],
  },
  {
    slug: "evcil-hayvanlarda-yaz-sicaklarinda-dikkat-edilmesi-gerekenler",
    locale: "tr",
    translationSlug: "keeping-pets-safe-in-summer-heat",
    title: "Evcil Hayvanlarda Yaz Sıcaklarında Dikkat Edilmesi Gerekenler",
    description: "Sıcak havalarda günlük rutini daha güvenli planlamak ve ısıya bağlı risk işaretlerini erken fark etmek için pratik öneriler.",
    image: "/images/blog/summer-heat.svg",
    imageAlt: "Güneş altında su kabı bulunan yaz güvenliği illüstrasyonu",
    featured: false,
    tags: ["yaz", "sıcak hava", "bakım"],
    publishedAt: "2026-06-19",
    updatedAt: "2026-07-07",
    author: "Onur Metehan Çakır",
    category: "Bakım Rehberi",
    readingTime: "6 dk okuma",
    keywords: ["evcil hayvan yaz bakımı", "köpek sıcak çarpması", "kedi sıcak hava", "yaz güvenliği"],
    tableOfContents: [
      { id: "gunluk-rutin", title: "Günlük rutini serin saatlere taşıyın" },
      { id: "su-ve-golge", title: "Su, gölge ve güvenli ortam" },
      { id: "isi-stresi", title: "Isı stresi belirtilerinde ne yapılmalı?" },
    ],
    sections: [
      { id: "gunluk-rutin", title: "Günlük rutini serin saatlere taşıyın", paragraphs: ["Yürüyüş ve oyun saatlerini sabah erken veya akşam daha serin zamanlara planlayın. Sıcak zeminin pati yüzeyine zarar verebileceğini unutmayın.", "Yoğun egzersizi azaltın ve hayvanın dinlenme ihtiyacına dikkat edin. Yaşlı, çok genç, fazla kilolu veya solunum sorunu olan hayvanlar daha hassas olabilir."] },
      { id: "su-ve-golge", title: "Su, gölge ve güvenli ortam", tone: "information", paragraphs: ["Taze suya sürekli erişim sağlayın ve doğrudan güneş almayan, havalandırılan bir dinlenme alanı oluşturun.", "Bir hayvanı kısa süre için bile park edilmiş araçta bırakmayın. Araç içi sıcaklık çok hızlı yükselebilir."] },
      { id: "isi-stresi", title: "Isı stresi belirtilerinde ne yapılmalı?", tone: "warning", paragraphs: ["Aşırı soluma, yoğun salya, güçsüzlük, sendeleme, kusma, çökme veya bilinç değişikliği acil veteriner değerlendirmesi gerektirebilir.", "Hayvanı serin bir alana alın ve derhal veteriner kliniğiyle iletişime geçin. Buzlu su uygulamayın ve çevrimiçi öneriler nedeniyle profesyonel yardımı geciktirmeyin."] },
    ],
    relatedSlugs: ["evcil-hayvanlarda-acil-durum-belirtileri", "kopeklerde-duzenli-veteriner-kontrolu"],
  },

  {
    slug: "why-vaccine-schedules-matter-for-cats",
    locale: "en",
    translationSlug: "kedilerde-asi-takvimi-neden-onemlidir",
    title: "Why Vaccine Schedules Matter for Cats",
    description: "Learn why vaccination planning should reflect your cat's life stage and individual risks in consultation with a veterinarian.",
    image: "/images/blog/cat-vaccination.svg",
    imageAlt: "Stylized cat beside a protective shield",
    featured: true,
    tags: ["vaccination", "cats", "preventive care"],
    publishedAt: "2026-06-12",
    updatedAt: "2026-07-10",
    author: "Onur Metehan Çakır",
    category: "Preventive Care",
    readingTime: "4 min read",
    keywords: ["cat vaccination", "cat vaccine schedule", "preventive veterinary care", "veterinarian in Kuşadası"],
    tableOfContents: [
      { id: "why-it-matters", title: "Why vaccination planning matters" },
      { id: "individual-plan", title: "An individual plan for every cat" },
      { id: "ask-a-vet", title: "When to speak with a veterinarian" },
    ],
    sections: [
      { id: "why-it-matters", title: "Why vaccination planning matters", paragraphs: ["A vaccination schedule is part of structured preventive care that supports protection against specific infectious diseases. Timing depends on age, previous vaccinations, and living conditions.", "General schedules online can provide context, but they cannot determine what is appropriate for an individual cat. A veterinary examination before vaccination helps assess current health."] },
      { id: "individual-plan", title: "An individual plan for every cat", tone: "information", paragraphs: ["Outdoor access, contact with other animals, age, and medical history all influence risk. A veterinarian should individualize vaccine selection and timing.", "Keeping vaccination records and bringing them to appointments supports accurate continuity of care."] },
      { id: "ask-a-vet", title: "When to speak with a veterinarian", tone: "warning", paragraphs: ["Tell your veterinarian before the appointment if your cat seems unwell, has recently been ill, or previously had an unexpected response after vaccination.", "This information does not replace an examination. Your cat's vaccination plan should be established after a clinical assessment."] },
    ],
    relatedSlugs: ["a-kittens-first-veterinary-visit", "warning-signs-that-need-urgent-veterinary-attention"],
  },
  {
    slug: "why-regular-veterinary-checks-matter-for-dogs",
    locale: "en",
    translationSlug: "kopeklerde-duzenli-veteriner-kontrolu",
    title: "Why Regular Veterinary Checks Matter for Dogs",
    description: "Explore how regular veterinary examinations can identify changes early and support long-term care planning for your dog.",
    image: "/images/blog/dog-checkup.svg",
    imageAlt: "Stylized dog beside a veterinary stethoscope",
    featured: false,
    tags: ["dogs", "examinations", "health monitoring"],
    publishedAt: "2026-06-03",
    updatedAt: "2026-07-08",
    author: "Onur Metehan Çakır",
    category: "Dog Health",
    readingTime: "5 min read",
    keywords: ["dog veterinary check", "dog examination", "preventive care", "veterinarian in Kuşadası"],
    tableOfContents: [
      { id: "purpose", title: "The purpose of regular checks" },
      { id: "what-is-reviewed", title: "What may be reviewed" },
      { id: "do-not-wait", title: "When not to wait for a routine visit" },
    ],
    sections: [
      { id: "purpose", title: "The purpose of regular checks", paragraphs: ["Routine examinations help track changes in weight, mobility, skin and coat, oral health, and behaviour over time.", "There is no single schedule for every dog. Frequency should be planned with a veterinarian according to age, lifestyle, and known health concerns."] },
      { id: "what-is-reviewed", title: "What may be reviewed", tone: "information", paragraphs: ["A veterinarian may perform a general physical assessment and discuss nutrition, parasite protection, vaccination history, and daily habits.", "Notes about changes observed at home can make the visit more useful. Online information cannot replace this hands-on assessment."] },
      { id: "do-not-wait", title: "When not to wait for a routine visit", tone: "warning", paragraphs: ["Do not wait for a scheduled check if your dog has difficulty breathing, collapses, shows marked pain, repeatedly vomits or has diarrhea, develops sudden abdominal swelling, or deteriorates quickly.", "The significance of a symptom cannot be confirmed remotely. Contact a veterinary clinic for appropriate timing and assessment."] },
    ],
    relatedSlugs: ["internal-and-external-parasite-protection-for-dogs", "keeping-pets-safe-in-summer-heat"],
  },
  {
    slug: "warning-signs-that-need-urgent-veterinary-attention",
    locale: "en",
    translationSlug: "evcil-hayvanlarda-acil-durum-belirtileri",
    title: "Warning Signs That Need Urgent Veterinary Attention",
    description: "Learn which changes may require prompt veterinary assessment and how to respond without delaying professional care.",
    image: "/images/blog/emergency-signs.svg",
    imageAlt: "Veterinary warning sign with a paw symbol",
    featured: false,
    tags: ["emergency", "warning signs", "safety"],
    publishedAt: "2026-05-22",
    updatedAt: "2026-07-06",
    author: "Onur Metehan Çakır",
    category: "Emergency",
    readingTime: "6 min read",
    keywords: ["pet emergency signs", "urgent veterinary attention", "dog breathing difficulty", "cat emergency"],
    tableOfContents: [
      { id: "warning-signs", title: "Important warning signs" },
      { id: "respond-safely", title: "Responding safely" },
      { id: "contact-now", title: "When to contact a veterinarian immediately" },
    ],
    sections: [
      { id: "warning-signs", title: "Important warning signs", paragraphs: ["Difficulty breathing, altered consciousness, collapse, uncontrolled bleeding, seizures, serious trauma, or rapidly increasing abdominal swelling may require emergency assessment.", "A single sign can have different causes. Contacting a clinic is safer than attempting to diagnose the problem online."] },
      { id: "respond-safely", title: "Responding safely", tone: "information", paragraphs: ["Keep the animal calm and transport them securely with as little movement as possible. Animals in pain or with altered awareness may bite unintentionally, so protect your own safety too.", "Do not give medicine, food, or fluids unless a veterinarian instructs you to. Human medicines can be dangerous for animals."] },
      { id: "contact-now", title: "When to contact a veterinarian immediately", tone: "warning", paragraphs: ["Seek veterinary help without delay for inability to breathe, unresponsiveness, ongoing seizures, severe bleeding, suspected poisoning, or major trauma.", "This list is not exhaustive and does not replace a veterinary examination. When uncertain, request professional assessment."] },
    ],
    relatedSlugs: ["keeping-pets-safe-in-summer-heat", "why-regular-veterinary-checks-matter-for-dogs"],
  },
  {
    slug: "a-kittens-first-veterinary-visit",
    locale: "en",
    translationSlug: "yavru-kedilerde-ilk-veteriner-ziyareti",
    title: "A Kitten's First Veterinary Visit",
    description: "Learn how to prepare for your kitten's first veterinary visit and which topics may be discussed during the examination.",
    image: "/images/blog/kitten-first-visit.svg",
    imageAlt: "Kitten beside a veterinary medical bag",
    featured: false,
    tags: ["kitten", "first examination", "care"],
    publishedAt: "2026-07-01",
    updatedAt: "2026-07-09",
    author: "Onur Metehan Çakır",
    category: "Cat Health",
    readingTime: "5 min read",
    keywords: ["kitten first vet visit", "kitten examination", "kitten care", "veterinarian in Kuşadası"],
    tableOfContents: [
      { id: "prepare", title: "Preparing for the visit" },
      { id: "first-exam", title: "Topics covered at a first examination" },
      { id: "seek-help", title: "When to seek advice sooner" },
    ],
    sections: [
      { id: "prepare", title: "Preparing for the visit", paragraphs: ["Use a secure carrier and bring any available health records. Observations about eating, drinking, toileting, and behaviour are also useful.", "Leaving the carrier accessible in advance and placing a familiar blanket inside may help reduce travel stress."] },
      { id: "first-exam", title: "Topics covered at a first examination", tone: "information", paragraphs: ["A veterinarian may review growth, general physical condition, nutrition, parasites, vaccination planning, and safety at home.", "The plan varies with the kitten's age and health. Standard online checklists do not replace an individual plan based on examination."] },
      { id: "seek-help", title: "When to seek advice sooner", tone: "warning", paragraphs: ["Contact a clinic before the planned visit if your kitten is not eating, repeatedly vomits or has diarrhea, is markedly lethargic, has difficulty breathing, or has heavy discharge from the eyes or nose.", "Young animals can deteriorate more quickly, so ask a veterinarian about appropriate timing."] },
    ],
    relatedSlugs: ["why-vaccine-schedules-matter-for-cats", "warning-signs-that-need-urgent-veterinary-attention"],
  },
  {
    slug: "internal-and-external-parasite-protection-for-dogs",
    locale: "en",
    translationSlug: "kopeklerde-ic-ve-dis-parazit-korumasi",
    title: "Internal and External Parasite Protection for Dogs",
    description: "Understand why parasite risk varies by lifestyle and how a veterinarian can establish an appropriate protection plan.",
    image: "/images/blog/parasite-protection.svg",
    imageAlt: "Dog illustration inside a protective circle",
    featured: false,
    tags: ["dogs", "parasites", "preventive care"],
    publishedAt: "2026-06-26",
    updatedAt: "2026-07-08",
    author: "Onur Metehan Çakır",
    category: "Preventive Care",
    readingTime: "5 min read",
    keywords: ["dog parasite protection", "internal parasites", "external parasites", "preventive veterinary care"],
    tableOfContents: [
      { id: "risk", title: "Why risk varies" },
      { id: "planning", title: "How protection is planned" },
      { id: "symptoms", title: "Signs that need veterinary assessment" },
    ],
    sections: [
      { id: "risk", title: "Why risk varies", paragraphs: ["Region, season, time outdoors, travel, and contact with other animals can all affect parasite exposure.", "Some parasites may be present without obvious signs. Regular veterinary assessment helps determine an appropriate monitoring approach."] },
      { id: "planning", title: "How protection is planned", tone: "information", paragraphs: ["A veterinarian should select the product type and interval based on age, weight, medical history, and individual risks.", "Do not start any product solely on the basis of online information. An unsuitable product or incorrect use may cause harm."] },
      { id: "symptoms", title: "Signs that need veterinary assessment", tone: "warning", paragraphs: ["Arrange an examination for persistent itching, hair loss, skin lesions, diarrhea, vomiting, weight loss, or unusual material in the stool.", "These signs can occur with other conditions too. A veterinary examination is needed for an appropriate assessment."] },
    ],
    relatedSlugs: ["why-regular-veterinary-checks-matter-for-dogs", "keeping-pets-safe-in-summer-heat"],
  },
  {
    slug: "keeping-pets-safe-in-summer-heat",
    locale: "en",
    translationSlug: "evcil-hayvanlarda-yaz-sicaklarinda-dikkat-edilmesi-gerekenler",
    title: "Keeping Pets Safe in Summer Heat",
    description: "Practical guidance for safer warm-weather routines and recognizing signs of heat-related distress early.",
    image: "/images/blog/summer-heat.svg",
    imageAlt: "Pet water bowl beneath a warm summer sun",
    featured: false,
    tags: ["summer", "warm weather", "care"],
    publishedAt: "2026-06-19",
    updatedAt: "2026-07-07",
    author: "Onur Metehan Çakır",
    category: "Care Guides",
    readingTime: "6 min read",
    keywords: ["pet summer care", "dog heatstroke signs", "cat warm weather safety", "pet heat safety"],
    tableOfContents: [
      { id: "routine", title: "Move routines to cooler hours" },
      { id: "water-shade", title: "Water, shade, and a safe environment" },
      { id: "heat-stress", title: "What to do when heat stress is suspected" },
    ],
    sections: [
      { id: "routine", title: "Move routines to cooler hours", paragraphs: ["Plan walks and play for the early morning or cooler evening hours. Remember that hot ground can injure paw pads.", "Reduce intense exercise and allow additional rest. Senior, very young, overweight, or respiratory-compromised animals may be more vulnerable."] },
      { id: "water-shade", title: "Water, shade, and a safe environment", tone: "information", paragraphs: ["Provide continuous access to fresh water and a ventilated resting area away from direct sunlight.", "Never leave an animal in a parked vehicle, even briefly. Interior temperatures can rise very quickly."] },
      { id: "heat-stress", title: "What to do when heat stress is suspected", tone: "warning", paragraphs: ["Excessive panting, heavy drooling, weakness, unsteadiness, vomiting, collapse, or altered awareness may require emergency veterinary assessment.", "Move the animal to a cooler area and contact a veterinary clinic immediately. Do not apply ice water or delay professional care because of online advice."] },
    ],
    relatedSlugs: ["warning-signs-that-need-urgent-veterinary-attention", "why-regular-veterinary-checks-matter-for-dogs"],
  },
];

export function getBlogPosts(locale: Locale) {
  return blogPosts
    .filter((post) => post.locale === locale)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPostBySlug(slug: string, locale: Locale) {
  return blogPosts.find((post) => post.slug === slug && post.locale === locale);
}

export function getFeaturedPost(locale: Locale) {
  return getBlogPosts(locale).find((post) => post.featured) ?? getBlogPosts(locale)[0];
}

export function getRelatedPosts(post: BlogPost) {
  const explicit = post.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug, post.locale))
    .filter((item): item is BlogPost => Boolean(item));

  return explicit.length > 0
    ? explicit.slice(0, 3)
    : getBlogPosts(post.locale).filter((item) => item.slug !== post.slug).slice(0, 3);
}

export function getAdjacentPosts(post: BlogPost) {
  const posts = getBlogPosts(post.locale);
  const index = posts.findIndex((item) => item.slug === post.slug);

  return {
    previous: index < posts.length - 1 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  };
}
