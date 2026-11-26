// Çok dil altyapısı (site + panel ortak). Kaynak metin = Türkçe; sözlük anahtarı Türkçe metnin kendisidir.
// Çeviri kaynakları: 1) veritabanı "translations" tablosu (panelden düzenlenir)  2) aşağıdaki hazır sözlük.
(() => {
  const B = window.BBS;
  B.LANGS = { tr: "Türkçe", en: "English", nl: "Nederlands", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", pt: "Português", pl: "Polski", ro: "Română", bg: "Български", el: "Ελληνικά", ru: "Русский", ar: "العربية", sv: "Svenska", da: "Dansk" };
  const LOC = { tr: "tr-TR", en: "en-GB", nl: "nl-BE", fr: "fr-BE", de: "de-DE" };
  B.lang = "tr"; B.main = "tr"; B.langs = ["tr"]; B.trMap = {};
  B.loc = () => LOC[B.lang] || B.lang;

  // Çevrilebilir veritabanı alanları: tablo -> alanlar. Çeviri anahtarı: "tablo:id:alan" / "settings:anahtar" / "ui:Türkçe metin"
  B.TR = {
    tables: {
      slides: ["title", "text", "btn_text"], menu: ["label"], pages: ["title", "body"], services: ["title", "description"],
      products: ["title", "category", "description"], posts: ["title", "category", "excerpt", "body"], faq: ["question", "answer"],
    },
    settings: ["tagline", "announcement", "footer_text", "hours", "meta_desc", "hl_title", "hl_text", "hl_btn_text", "stat1_label", "stat2_label", "stat3_label",
      "sec_svc_title", "sec_svc_text", "sec_prod_title", "sec_prod_text", "sec_news_title", "sec_news_text", "sec_brands_title", "sec_brands_text",
      "sec_faq_title", "sec_faq_text", "sec_rev_title", "sec_rev_text", "sec_contact_title", "sec_find_title", "consent_label", "review_consent_label", "kvkk_link_text", "cookie_text"],
  };

  // ---- hazır arayüz sözlüğü: "Türkçe": [İngilizce, Felemenkçe, Fransızca]
  const IDX = { en: 0, nl: 1, fr: 2 };
  B.UI = {
    "İçeriğe geç": ["Skip to content", "Naar de inhoud", "Aller au contenu"],
    "Tüm ürünler": ["All products", "Alle producten", "Tous les produits"],
    "Online satış yoktur; fiyat ve stok bilgisi içindir.": ["No online sales; price and stock information only.", "Geen online verkoop; alleen informatie over prijs en voorraad.", "Pas de vente en ligne ; informations sur les prix et le stock uniquement."],
    "Ürün ara": ["Search products", "Producten zoeken", "Rechercher un produit"],
    "Kategori": ["Category", "Categorie", "Catégorie"],
    "Tüm kategoriler": ["All categories", "Alle categorieën", "Toutes les catégories"],
    "Stok": ["Stock", "Voorraad", "Stock"],
    "Tüm stok durumları": ["All stock statuses", "Alle voorraadstatussen", "Tous les stocks"],
    "Stokta": ["In stock", "Op voorraad", "En stock"],
    "Sınırlı stok": ["Limited stock", "Beperkte voorraad", "Stock limité"],
    "Tükendi": ["Out of stock", "Uitverkocht", "Épuisé"],
    "Sırala": ["Sort", "Sorteren", "Trier"],
    "En yeni": ["Newest", "Nieuwste", "Plus récents"],
    "Ada göre": ["By name", "Op naam", "Par nom"],
    "Fiyat: düşükten yükseğe": ["Price: low to high", "Prijs: laag naar hoog", "Prix : croissant"],
    "Fiyat: yüksekten düşüğe": ["Price: high to low", "Prijs: hoog naar laag", "Prix : décroissant"],
    "Filtreleri temizle": ["Clear filters", "Filters wissen", "Effacer les filtres"],
    "Detay": ["Details", "Details", "Détails"],
    "Bu sayfanın çalışması için JavaScript gerekir.": ["JavaScript is required for this page.", "Voor deze pagina is JavaScript nodig.", "JavaScript est requis pour cette page."],
    "Haberler & Blog": ["News & Blog", "Nieuws & Blog", "Actualités & Blog"],
    "En son paylaşılanlar en üstte.": ["Latest posts first.", "Nieuwste berichten bovenaan.", "Les plus récents en premier."],
    "Yazı ara": ["Search posts", "Berichten zoeken", "Rechercher un article"],
    "Daha fazla göster": ["Show more", "Meer tonen", "Afficher plus"],
    "Tüm hizmetler": ["All services", "Alle diensten", "Tous les services"],
    "Detay ve randevu için bir hizmeti seçin.": ["Choose a service for details and to book.", "Kies een dienst voor details en een afspraak.", "Choisissez un service pour les détails et un rendez-vous."],
    "Hizmet ara": ["Search services", "Diensten zoeken", "Rechercher un service"],
    "Diğer haberler": ["More news", "Ander nieuws", "Autres actualités"],
    "Okumaya devam edin.": ["Keep reading.", "Lees verder.", "Continuez la lecture."],
    "Öne çıkanlar": ["Highlights", "Uitgelicht", "À la une"],
    "Tüm ürünleri gör": ["View all products", "Alle producten bekijken", "Voir tous les produits"],
    "Tüm haberler": ["All news", "Al het nieuws", "Toutes les actualités"],
    "Ad soyad": ["Full name", "Volledige naam", "Nom complet"],
    "Telefon": ["Phone", "Telefoon", "Téléphone"],
    "E-posta": ["Email", "E-mail", "E-mail"],
    "Konu": ["Subject", "Onderwerp", "Sujet"],
    "(isteğe bağlı)": ["(optional)", "(optioneel)", "(facultatif)"],
    "Seçin": ["Select", "Kies", "Choisir"],
    "Mesajınız": ["Your message", "Uw bericht", "Votre message"],
    "Mesajı gönder": ["Send message", "Bericht verzenden", "Envoyer le message"],
    "Bu sayfa bulunamadı": ["Page not found", "Deze pagina is niet gevonden", "Page introuvable"],
    "Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.": ["The page you are looking for may have moved or never existed.", "De pagina die u zoekt is mogelijk verplaatst of bestaat niet.", "La page recherchée a peut-être été déplacée ou n'existe pas."],
    "Anasayfaya dön": ["Back to home", "Terug naar home", "Retour à l'accueil"],
    "Ürünlere bak": ["Browse products", "Bekijk producten", "Voir les produits"],
    "Hizmetler": ["Services", "Diensten", "Services"],
    "Haberler": ["News", "Nieuws", "Actualités"],
    "Ürünler": ["Products", "Producten", "Produits"],
    "Hizmetlerimiz": ["Our services", "Onze diensten", "Nos services"],
    "Haber": ["News", "Nieuws", "Actualité"],
    "Sayfa bulunamadı": ["Page not found", "Pagina niet gevonden", "Page introuvable"],
    "Yedek parça ve ürünlerimizin detay, fiyat ve stok bilgisi.": ["Details, prices and stock information for our spare parts and products.", "Details, prijzen en voorraadinformatie van onze onderdelen en producten.", "Détails, prix et stock de nos pièces et produits."],
    "Aracınızın bakımı ve oto servis hakkında pratik yazılar.": ["Practical articles about car maintenance and auto service.", "Praktische artikelen over autoonderhoud en garagewerk.", "Articles pratiques sur l'entretien automobile et le garage."],
    "BBS AUTO hizmet listesi: yağ değişimi, motor, fren, lastik, akü ve daha fazlası.": ["BBS AUTO services: oil change, engine, brakes, tyres, battery and more.", "BBS AUTO diensten: olieverversing, motor, remmen, banden, accu en meer.", "Services BBS AUTO : vidange, moteur, freins, pneus, batterie et plus."],
    "Menü": ["Menu", "Menu", "Menu"],
    "Ana menü": ["Main menu", "Hoofdmenu", "Menu principal"],
    "Yönetici girişi": ["Admin login", "Beheerderslogin", "Connexion administrateur"],
    "Sayfalar": ["Pages", "Pagina's", "Pages"],
    "İletişim": ["Contact", "Contact", "Contact"],
    "Ara": ["Call", "Bel", "Appeler"],
    "Yol tarifi": ["Directions", "Routebeschrijving", "Itinéraire"],
    "Sayfanın başına dön": ["Back to top", "Terug naar boven", "Retour en haut"],
    "WhatsApp ile yazın": ["Message us on WhatsApp", "Stuur ons een WhatsApp", "Écrivez-nous sur WhatsApp"],
    "Gündüz moduna geç": ["Switch to light mode", "Overschakelen naar lichte modus", "Passer au mode clair"],
    "Gece moduna geç": ["Switch to dark mode", "Overschakelen naar donkere modus", "Passer au mode sombre"],
    "Dil": ["Language", "Taal", "Langue"],
    "Kapat": ["Close", "Sluiten", "Fermer"],
    "Önceki görsel": ["Previous image", "Vorige afbeelding", "Image précédente"],
    "Sonraki görsel": ["Next image", "Volgende afbeelding", "Image suivante"],
    "Önceki": ["Previous", "Vorige", "Précédent"],
    "Sonraki": ["Next", "Volgende", "Suivant"],
    "Paylaş": ["Share", "Delen", "Partager"],
    "WhatsApp ile sor": ["Ask on WhatsApp", "Vraag via WhatsApp", "Demander sur WhatsApp"],
    "Fiyat için bizi arayın": ["Call us for the price", "Bel ons voor de prijs", "Appelez-nous pour le prix"],
    "Haberin tamamını oku": ["Read the full article", "Lees het volledige artikel", "Lire l'article complet"],
    "Randevu al": ["Book an appointment", "Afspraak maken", "Prendre rendez-vous"],
    "Öne çıkan": ["Featured", "Uitgelicht", "En vedette"],
    "Fiyat sorunuz": ["Ask for price", "Prijs op aanvraag", "Prix sur demande"],
    "Oku": ["Read", "Lezen", "Lire"],
    "Kod: {0}": ["Code: {0}", "Code: {0}", "Code : {0}"],
    "Bağlantı kopyalandı": ["Link copied", "Link gekopieerd", "Lien copié"],
    "Bağlantı kopyalanamadı": ["Could not copy link", "Link kopiëren mislukt", "Impossible de copier le lien"],
    "Henüz hizmet eklenmedi.": ["No services added yet.", "Nog geen diensten toegevoegd.", "Aucun service pour le moment."],
    "Henüz ürün eklenmedi.": ["No products added yet.", "Nog geen producten toegevoegd.", "Aucun produit pour le moment."],
    "Henüz yazı yok.": ["No posts yet.", "Nog geen berichten.", "Aucun article pour le moment."],
    "Aramanıza uyan ürün yok. Filtreleri değiştirin ya da temizleyin.": ["No products match your search. Change or clear the filters.", "Geen producten gevonden. Pas de filters aan of wis ze.", "Aucun produit ne correspond. Modifiez ou effacez les filtres."],
    "Aramanıza uyan yazı yok.": ["No posts match your search.", "Geen berichten gevonden.", "Aucun article ne correspond."],
    "Sonuç bulunamadı. Başka bir kelime deneyin.": ["No results. Try another word.", "Geen resultaten. Probeer een ander woord.", "Aucun résultat. Essayez un autre mot."],
    "Teşekkürler, en kısa sürede dönüş yapacağız.": ["Thank you, we will get back to you shortly.", "Bedankt, we nemen zo snel mogelijk contact met u op.", "Merci, nous vous répondrons très prochainement."],
    "Ad soyad ve mesaj alanlarını doldurun.": ["Please fill in your name and message.", "Vul uw naam en bericht in.", "Veuillez renseigner votre nom et votre message."],
    "Size dönebilmemiz için telefon ya da e-posta yazın.": ["Enter a phone number or email so we can reply.", "Geef een telefoonnummer of e-mailadres op zodat we kunnen antwoorden.", "Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre."],
    "E-posta adresi geçersiz görünüyor.": ["The email address looks invalid.", "Het e-mailadres lijkt ongeldig.", "L'adresse e-mail semble invalide."],
    "Çok sık gönderiyorsunuz, lütfen biraz bekleyin.": ["You are sending too often, please wait a moment.", "U verstuurt te vaak, wacht even.", "Vous envoyez trop souvent, veuillez patienter."],
    "Mesaj sistemi şu an bağlı değil, lütfen telefonla ulaşın.": ["The message system is unavailable, please call us.", "Het berichtensysteem is niet beschikbaar, bel ons alstublieft.", "Le système de messages est indisponible, veuillez nous appeler."],
    "Gönderiliyor…": ["Sending…", "Verzenden…", "Envoi…"],
    "Gönderilemedi, lütfen telefonla ulaşın.": ["Could not send, please call us.", "Verzenden mislukt, bel ons alstublieft.", "Échec de l'envoi, veuillez nous appeler."],
    "Mesajınız iletildi": ["Your message was sent", "Uw bericht is verzonden", "Votre message a été envoyé"],
    "Çalışma saatleri": ["Opening hours", "Openingstijden", "Horaires d'ouverture"],
    "Adres": ["Address", "Adres", "Adresse"],
    "Yol tarifi al": ["Get directions", "Routebeschrijving", "Obtenir l'itinéraire"],
    "Harita": ["Map", "Kaart", "Carte"],
    "Bu haber kaldırılmış ya da adres yanlış olabilir.": ["This article may have been removed or the address is wrong.", "Dit artikel is mogelijk verwijderd of het adres klopt niet.", "Cet article a peut-être été supprimé ou l'adresse est incorrecte."],
    "Haber bulunamadı": ["Article not found", "Artikel niet gevonden", "Article introuvable"],
    "Haberlere dön": ["Back to news", "Terug naar nieuws", "Retour aux actualités"],
    "Merhaba, {0} hakkında bilgi almak istiyorum.": ["Hello, I would like information about {0}.", "Hallo, ik wil graag informatie over {0}.", "Bonjour, je souhaite des informations sur {0}."],
    "Merhaba, {0} hizmeti hakkında bilgi almak istiyorum.": ["Hello, I would like information about the {0} service.", "Hallo, ik wil graag informatie over de dienst {0}.", "Bonjour, je souhaite des informations sur le service {0}."],
    "Merhaba, \"{0}\" yazınız hakkında yazıyorum.": ["Hello, I am writing about your article \"{0}\".", "Hallo, ik schrijf over uw artikel \"{0}\".", "Bonjour, je vous écris au sujet de votre article « {0} »."],
    "{0} ürün": ["{0} products", "{0} producten", "{0} produits"],
    "{0} hizmet": ["{0} services", "{0} diensten", "{0} services"],
    "{0} yazı": ["{0} posts", "{0} berichten", "{0} articles"],
    "Görsel {0}": ["Image {0}", "Afbeelding {0}", "Image {0}"],
    "Slayt {0}": ["Slide {0}", "Dia {0}", "Diapositive {0}"],
    "{0} görsel": ["{0} images", "{0} afbeeldingen", "{0} images"],
    "Yorum yaz": ["Write a review", "Schrijf een review", "Écrire un avis"],
    "Puanınız": ["Your rating", "Uw beoordeling", "Votre note"],
    "Adınız": ["Your name", "Uw naam", "Votre nom"],
    "Hizmet": ["Service", "Dienst", "Service"],
    "Yorumunuz": ["Your review", "Uw review", "Votre avis"],
    "Diğer": ["Other", "Overig", "Autre"],
    "Yorumu gönder": ["Submit review", "Review versturen", "Envoyer l'avis"],
    "Yorum gönderiliyor…": ["Submitting…", "Versturen…", "Envoi…"],
    "Yorumunuz alındı. Onaylandıktan sonra yayınlanacaktır. Teşekkürler!": ["Thank you! Your review was received and will be published after approval.", "Bedankt! Uw review is ontvangen en wordt na goedkeuring gepubliceerd.", "Merci ! Votre avis a été reçu et sera publié après validation."],
    "Lütfen bir puan seçin.": ["Please select a rating.", "Kies een beoordeling.", "Veuillez choisir une note."],
    "Lütfen adınızı yazın.": ["Please enter your name.", "Vul uw naam in.", "Veuillez saisir votre nom."],
    "Yorumunuz en az 5 karakter olmalı.": ["Your review must be at least 5 characters.", "Uw review moet minstens 5 tekens bevatten.", "Votre avis doit contenir au moins 5 caractères."],
    "Bugün zaten bir yorum gönderdiniz.": ["You have already submitted a review today.", "U heeft vandaag al een review verstuurd.", "Vous avez déjà envoyé un avis aujourd'hui."],
    "Yorum gönderilemedi, lütfen daha sonra tekrar deneyin.": ["The review could not be sent, please try again later.", "Review verzenden mislukt, probeer het later opnieuw.", "L'avis n'a pas pu être envoyé, veuillez réessayer plus tard."],
    "Henüz yorum yok. İlk yorumu siz yazın!": ["No reviews yet. Be the first to write one!", "Nog geen reviews. Schrijf de eerste!", "Pas encore d'avis. Soyez le premier !"],
    "Yanıtımız": ["Our reply", "Ons antwoord", "Notre réponse"],
    "{0} yorum": ["{0} reviews", "{0} reviews", "{0} avis"],
    "Tüm yorumları göster": ["Show all reviews", "Alle reviews tonen", "Afficher tous les avis"],
    "Google'da değerlendirin": ["Review us on Google", "Beoordeel ons op Google", "Évaluez-nous sur Google"],
    "Devam etmek için aydınlatma metnini onaylayın.": ["Please confirm the privacy notice to continue.", "Bevestig de privacyverklaring om door te gaan.", "Veuillez confirmer la notice de confidentialité pour continuer."],
    "Çerez bildirimi": ["Cookie notice", "Cookiemelding", "Avis sur les cookies"],
    "Tamam": ["OK", "OK", "OK"],
    "Çerez Politikası": ["Cookie Policy", "Cookiebeleid", "Politique de cookies"],
    "{link}'ni okudum, anladım.": ["I have read and understood the {link}.", "Ik heb de {link} gelezen en begrepen.", "J'ai lu et compris la {link}."],
    "KVKK Aydınlatma Metni": ["Privacy notice (KVKK)", "Privacyverklaring (KVKK)", "Notice de confidentialité (KVKK)"],
    "Adımın ve yorumumun sitede yayınlanmasını kabul ediyorum; {link}'ni okudum.": ["I agree to my name and review being published on the site; I have read the {link}.", "Ik ga akkoord met publicatie van mijn naam en review op de site; ik heb de {link} gelezen.", "J'accepte la publication de mon nom et de mon avis sur le site ; j'ai lu la {link}."],
    "Bu sitede reklam veya takip çerezi kullanılmaz; yalnızca tema ve dil tercihinizi hatırlayan zorunlu depolama vardır.": ["This site uses no advertising or tracking cookies; only essential storage that remembers your theme and language.", "Deze site gebruikt geen advertentie- of trackingcookies; alleen noodzakelijke opslag voor uw thema- en taalvoorkeur.", "Ce site n'utilise aucun cookie publicitaire ni de suivi ; seulement un stockage essentiel mémorisant votre thème et votre langue."],
    "Oto servis ve yedek parça": ["Auto service and spare parts", "Autogarage en onderdelen", "Garage automobile et pièces détachées"],
    "Atölyede en çok yaptığımız işler.": ["The jobs we do most in the workshop.", "De werkzaamheden die we het vaakst uitvoeren.", "Les travaux que nous réalisons le plus souvent."],
    "Öne Çıkan Ürünler": ["Featured Products", "Uitgelichte producten", "Produits à la une"],
    "Detay, fiyat ve stok durumu. Satış mağazada, sipariş için arayın.": ["Details, price and stock. Sold in store; call to order.", "Details, prijs en voorraad. Verkoop in de winkel; bel om te bestellen.", "Détails, prix et stock. Vente en magasin ; appelez pour commander."],
    "Aracınızın ömrünü uzatan pratik bilgiler.": ["Practical tips to extend the life of your car.", "Praktische tips om de levensduur van uw auto te verlengen.", "Conseils pratiques pour prolonger la vie de votre voiture."],
    "Randevu / Mesaj": ["Appointment / Message", "Afspraak / Bericht", "Rendez-vous / Message"],
    "Bizi bulun": ["Find us", "Vind ons", "Nous trouver"],
    "Neler yapıyoruz?": ["What we do", "Wat wij doen", "Ce que nous faisons"],
    "yıllık tecrübe": ["years of experience", "jaar ervaring", "ans d'expérience"],
    "servis edilen araç": ["vehicles serviced", "onderhouden voertuigen", "véhicules entretenus"],
    "şeffaf fiyat": ["transparent pricing", "transparante prijzen", "prix transparents"],
    "Hizmet Verdiğimiz Markalar": ["Brands We Service", "Merken waarvoor wij werken", "Marques que nous entretenons"],
    "Bu markaların servis ve yedek parça işlerini yapıyoruz.": ["We handle service and spare parts for these brands.", "Wij doen onderhoud en onderdelen voor deze merken.", "Nous assurons l'entretien et les pièces de ces marques."],
    "Sık Sorulan Sorular": ["Frequently Asked Questions", "Veelgestelde vragen", "Questions fréquentes"],
    "Aklınıza takılanların cevapları burada.": ["Answers to what you may be wondering.", "Antwoorden op uw vragen.", "Les réponses à vos questions."],
    "Müşteri Yorumları": ["Customer Reviews", "Klantreviews", "Avis clients"],
    "Hizmet alan müşterilerimizin görüşleri.": ["What our customers say.", "Wat onze klanten zeggen.", "Ce que disent nos clients."],
  };

  // ---- arama: veritabanı çevirisi > hazır sözlük
  const look = (s) => {
    if (B.lang === "tr") return B.trMap["ui:" + s];
    return B.trMap["ui:" + s] || (B.UI[s] && B.UI[s][IDX[B.lang]]) || undefined;
  };
  B.uiEff = (lang, s) => (lang === "tr" ? s : (B.uiDb && B.uiDb[lang] && B.uiDb[lang]["ui:" + s]) || (B.UI[s] && B.UI[s][IDX[lang]]) || "");
  B.t = (s, ...a) => { let v = look(s) || s; a.forEach((x, i) => { v = v.split("{" + i + "}").join(x); }); return v; };

  // ---- DOM çevirisi: tam eşleşen metin düğümleri ve placeholder/aria-label/title/alt öznitelikleri
  const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  B.startDom = (lookup) => {
    const fixText = (n) => {
      const p = n.parentNode; if (!p || SKIP.has(p.tagName) || p.isContentEditable || (p.closest && p.closest("[data-notr]"))) return;
      const s = n.nodeValue, k = s.trim(); if (k.length < 2) return;
      const v = lookup(k); if (v && v !== k) n.nodeValue = s.replace(k, v);
    };
    const fixAttrs = (el) => {
      if (el.closest && el.closest("[data-notr]")) return;
      ATTRS.forEach((a) => { const k = el.getAttribute && el.getAttribute(a); if (k && k.length > 1) { const v = lookup(k.trim()); if (v && v !== k) el.setAttribute(a, v); } });
    };
    const walk = (root) => {
      if (root.nodeType === 3) return fixText(root);
      if (root.nodeType !== 1) return;
      fixAttrs(root); root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(fixAttrs);
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const list = []; for (let n = tw.nextNode(); n; n = tw.nextNode()) list.push(n);
      list.forEach(fixText);
    };
    B.walkDom = walk;
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(walk))).observe(document.body, { childList: true, subtree: true });
  };

  // ---- site: dil seçimi + çevirileri yükle
  B.loadTr = async (db, lang) => {
    const m = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from("translations").select("ref,value").eq("lang", lang).order("ref").range(from, from + 999);
      if (error || !data) break;
      data.forEach((r) => { if (r.value) m[r.ref] = r.value; });
      if (data.length < 1000) break;
    }
    return m;
  };
  B.initLang = async (db, S) => {
    B.main = S.lang_main || "tr";
    const extra = String(S.langs || "").split(",").map((s) => s.trim()).filter(Boolean).filter((c) => c !== B.main);
    B.langs = [B.main, ...extra];
    let want = null;
    try { want = new URLSearchParams(location.search).get("lang") || localStorage.getItem("bbs_lang"); } catch (e) { }
    if (!want) want = (navigator.languages || [navigator.language || ""]).map((l) => String(l).slice(0, 2).toLowerCase()).find((c) => B.langs.includes(c));
    B.lang = B.langs.includes(want) ? want : B.main;
    document.documentElement.lang = B.lang;
    if (db && (B.lang !== B.main || B.lang !== "tr")) {
      // içerik çevirisi (ana dilden farklıysa) ve arayüz metni geçersiz kılmaları
      try { B.trMap = await B.loadTr(db, B.lang); } catch (e) { }
    }
    if (B.lang !== B.main) B.TR.settings.forEach((k) => { const v = B.trMap["settings:" + k]; if (v) S[k] = v; });
    B.startDom(look);
    // statik <title> ve meta açıklama
    document.title = document.title.split(" | ").map((p) => look(p.trim()) || p).join(" | ");
    const md = document.querySelector('meta[name="description"]'); if (md) { const v = look(md.content.trim()); if (v) md.content = v; }
  };
  B.trRows = (tb, rows) => {
    if (B.lang === B.main || !rows) return rows;
    const fs = B.TR.tables[tb]; if (!fs) return rows;
    return rows.map((x, i) => { let y = null; fs.forEach((f) => { const v = B.trMap[tb + ":" + (x.id ?? i) + ":" + f]; if (v) { y = y || { ...x }; y[f] = v; } }); return y || x; });
  };
})();
