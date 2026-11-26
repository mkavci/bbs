// Yönetim paneli arayüz dili. Sözlükte olmayan (uzun açıklama) metinler Türkçe kalır.
// Yeni metin eklemek için aşağıya  "Türkçe metin": ["English", "Nederlands", "Français"]  satırı eklemeniz yeterli.
(() => {
  const B = window.BBS, IDX = { en: 0, nl: 1, fr: 2 };
  B.ADM_LANGS = { tr: "Türkçe", en: "English", nl: "Nederlands", fr: "Français" };
  B.UI_ADM = {
    "Panel": ["Dashboard", "Dashboard", "Tableau de bord"], "Slider": ["Slider", "Slider", "Diaporama"], "Menü": ["Menu", "Menu", "Menu"],
    "Sayfalar": ["Pages", "Pagina's", "Pages"], "Hizmetler": ["Services", "Diensten", "Services"], "Ürünler": ["Products", "Producten", "Produits"],
    "Haberler / Blog": ["News / Blog", "Nieuws / Blog", "Actualités / Blog"], "Yorumlar": ["Reviews", "Reviews", "Avis"],
    "Sosyal Medya": ["Social media", "Sociale media", "Réseaux sociaux"], "Sık Sorulan Sorular": ["FAQ", "Veelgestelde vragen", "FAQ"],
    "Markalar": ["Brands", "Merken", "Marques"], "Mesajlar": ["Messages", "Berichten", "Messages"], "Bildirimler": ["Notifications", "Meldingen", "Notifications"],
    "Diller": ["Languages", "Talen", "Langues"], "Güvenlik": ["Security", "Beveiliging", "Sécurité"], "Site Ayarları": ["Site settings", "Site-instellingen", "Paramètres du site"],
    "Siteyi gör": ["View site", "Bekijk site", "Voir le site"], "Çıkış": ["Log out", "Uitloggen", "Déconnexion"], "Yönetim paneli": ["Admin panel", "Beheerpaneel", "Panneau d'administration"],
    "BBS AUTO site yönetimi": ["BBS AUTO site management", "BBS AUTO sitebeheer", "Gestion du site BBS AUTO"],
    "Yönetici girişi": ["Admin login", "Beheerderslogin", "Connexion administrateur"], "E-posta": ["Email", "E-mail", "E-mail"], "Şifre": ["Password", "Wachtwoord", "Mot de passe"],
    "Giriş yap": ["Log in", "Inloggen", "Se connecter"], "E-posta ya da şifre hatalı.": ["Wrong email or password.", "E-mail of wachtwoord onjuist.", "E-mail ou mot de passe incorrect."],
    "Günaydın": ["Good morning", "Goedemorgen", "Bonjour"], "İyi günler": ["Good afternoon", "Goedemiddag", "Bon après-midi"], "İyi akşamlar": ["Good evening", "Goedenavond", "Bonsoir"], "İyi geceler": ["Good night", "Goedenacht", "Bonne nuit"],
    "+ Ürün ekle": ["+ Add product", "+ Product toevoegen", "+ Ajouter un produit"], "+ Haber ekle": ["+ Add post", "+ Bericht toevoegen", "+ Ajouter un article"],
    "Slider düzenle": ["Edit slider", "Slider bewerken", "Modifier le diaporama"], "Site ayarları": ["Site settings", "Site-instellingen", "Paramètres du site"],
    "Son mesajlar": ["Latest messages", "Laatste berichten", "Derniers messages"], "Tümünü gör": ["View all", "Alles bekijken", "Tout voir"], "Henüz mesaj yok.": ["No messages yet.", "Nog geen berichten.", "Aucun message."],
    "+ Yeni ekle": ["+ Add new", "+ Nieuw toevoegen", "+ Ajouter"], "Düzenle": ["Edit", "Bewerken", "Modifier"], "Sil": ["Delete", "Verwijderen", "Supprimer"], "Oku": ["Read", "Lezen", "Lire"],
    "CSV indir": ["Download CSV", "CSV downloaden", "Télécharger CSV"], "Henüz kayıt yok.": ["No records yet.", "Nog geen records.", "Aucun enregistrement."], "Evet": ["Yes", "Ja", "Oui"], "Hayır": ["No", "Nee", "Non"], "Yeni": ["New", "Nieuw", "Nouveau"],
    "Başlık": ["Title", "Titel", "Titre"], "Açıklama": ["Description", "Beschrijving", "Description"], "Görsel": ["Image", "Afbeelding", "Image"], "Buton yazısı": ["Button text", "Knoptekst", "Texte du bouton"],
    "Buton bağlantısı": ["Button link", "Knoplink", "Lien du bouton"], "Sıra": ["Order", "Volgorde", "Ordre"], "Yayında": ["Published", "Gepubliceerd", "Publié"], "Menü adı": ["Menu label", "Menunaam", "Nom du menu"],
    "Bağlantı": ["Link", "Link", "Lien"], "Görünür": ["Visible", "Zichtbaar", "Visible"], "İçerik": ["Content", "Inhoud", "Contenu"], "Kategori": ["Category", "Categorie", "Catégorie"], "Fiyat": ["Price", "Prijs", "Prix"],
    "Stok durumu": ["Stock status", "Voorraadstatus", "État du stock"], "Öne çıkan": ["Featured", "Uitgelicht", "En vedette"], "Yazar": ["Author", "Auteur", "Auteur"], "Özet": ["Summary", "Samenvatting", "Résumé"],
    "Ad": ["Name", "Naam", "Nom"], "Telefon": ["Phone", "Telefoon", "Téléphone"], "Mesaj": ["Message", "Bericht", "Message"], "Tarih": ["Date", "Datum", "Date"], "Soru": ["Question", "Vraag", "Question"], "Cevap": ["Answer", "Antwoord", "Réponse"],
    "İkon": ["Icon", "Pictogram", "Icône"], "Ürün kodu": ["Product code", "Productcode", "Code produit"], "Puan": ["Rating", "Beoordeling", "Note"], "KVKK onayı": ["Privacy consent", "Privacytoestemming", "Consentement"],
    "Stokta": ["In stock", "Op voorraad", "En stock"], "Sınırlı stok": ["Limited stock", "Beperkte voorraad", "Stock limité"], "Tükendi": ["Out of stock", "Uitverkocht", "Épuisé"],
    "Kaydet": ["Save", "Opslaan", "Enregistrer"], "Vazgeç": ["Cancel", "Annuleren", "Annuler"], "Kaydedildi": ["Saved", "Opgeslagen", "Enregistré"], "Silindi": ["Deleted", "Verwijderd", "Supprimé"],
    "Kapat": ["Close", "Sluiten", "Fermer"], "Ayarlar kaydedildi": ["Settings saved", "Instellingen opgeslagen", "Paramètres enregistrés"], "Kopyalandı": ["Copied", "Gekopieerd", "Copié"],
    "Genel": ["General", "Algemeen", "Général"], "Renk paletleri": ["Color palettes", "Kleurenpaletten", "Palettes de couleurs"], "Yazı, boyut ve boşluk": ["Fonts, size and spacing", "Lettertypen, grootte en ruimte", "Polices, taille et espacement"],
    "Bölümler": ["Sections", "Secties", "Sections"], "Anasayfa metinleri": ["Home page texts", "Teksten startpagina", "Textes de l'accueil"], "İletişim ve sosyal": ["Contact and social", "Contact en sociaal", "Contact et réseaux"],
    "Yasal ve gizlilik": ["Legal and privacy", "Juridisch en privacy", "Mentions légales et confidentialité"], "Gelişmiş": ["Advanced", "Geavanceerd", "Avancé"], "Canlı önizleme": ["Live preview", "Live voorbeeld", "Aperçu en direct"],
    "Site bilgileri": ["Site information", "Site-informatie", "Informations du site"], "Site başlığı": ["Site title", "Sitetitel", "Titre du site"], "Slogan": ["Tagline", "Slogan", "Slogan"], "Logo": ["Logo", "Logo", "Logo"],
    "Alt bilgi yazısı": ["Footer text", "Voettekst", "Texte du pied de page"], "Adres": ["Address", "Adres", "Adresse"], "Çalışma saatleri": ["Opening hours", "Openingstijden", "Horaires d'ouverture"],
    "Ticari ünvan": ["Company name", "Bedrijfsnaam", "Raison sociale"], "Müşteri yorumları": ["Customer reviews", "Klantreviews", "Avis clients"],
    "Ürünleri toplu yükle / indir": ["Bulk import / export products", "Producten bulk importeren / exporteren", "Import / export en masse"],
    "Excel/CSV içe aktar": ["Import Excel/CSV", "Excel/CSV importeren", "Importer Excel/CSV"], "Dışa aktar": ["Export", "Exporteren", "Exporter"], "Şablonu indir": ["Download template", "Sjabloon downloaden", "Télécharger le modèle"],
    "Excel (.xlsx) indir": ["Download Excel (.xlsx)", "Excel (.xlsx) downloaden", "Télécharger Excel (.xlsx)"], "CSV indir ": ["Download CSV", "CSV downloaden", "Télécharger CSV"],
    "Dosya nasıl hazırlanır?": ["How to prepare the file", "Hoe bereid ik het bestand voor?", "Comment préparer le fichier"], "İçe aktar": ["Import", "Importeren", "Importer"],
    "Dosya seçin": ["Choose a file", "Kies een bestand", "Choisir un fichier"], "Önizleme": ["Preview", "Voorbeeld", "Aperçu"], "Hata raporunu indir": ["Download error report", "Foutenrapport downloaden", "Télécharger le rapport d'erreurs"],
    "Bildirim ayarları": ["Notification settings", "Meldingsinstellingen", "Paramètres de notification"], "Test gönder": ["Send test", "Test versturen", "Envoyer un test"],
    "E-posta bildirimi": ["Email notification", "E-mailmelding", "Notification par e-mail"], "Telegram bildirimi": ["Telegram notification", "Telegram-melding", "Notification Telegram"], "WhatsApp bildirimi": ["WhatsApp notification", "WhatsApp-melding", "Notification WhatsApp"],
    "İki adımlı doğrulama": ["Two-factor authentication", "Tweestapsverificatie", "Authentification à deux facteurs"], "Doğrulama kodu": ["Verification code", "Verificatiecode", "Code de vérification"], "Doğrula": ["Verify", "Verifiëren", "Vérifier"],
    "Etkinleştir": ["Enable", "Inschakelen", "Activer"], "Kaldır": ["Remove", "Verwijderen", "Supprimer"], "Şifreyi değiştir": ["Change password", "Wachtwoord wijzigen", "Changer le mot de passe"],
    "Ziyaretçiler": ["Visitors", "Bezoekers", "Visiteurs"], "Bugün": ["Today", "Vandaag", "Aujourd'hui"], "Son 7 gün": ["Last 7 days", "Laatste 7 dagen", "7 derniers jours"], "Son 30 gün": ["Last 30 days", "Laatste 30 dagen", "30 derniers jours"],
    "En çok bakılan sayfalar": ["Top pages", "Meest bekeken pagina's", "Pages les plus vues"], "Nereden geldiler": ["Referrers", "Verwijzers", "Sources"], "Cihazlar": ["Devices", "Apparaten", "Appareils"],
    "Dil ayarları": ["Language settings", "Taalinstellingen", "Paramètres de langue"], "Ana dil": ["Main language", "Hoofdtaal", "Langue principale"], "Site dilleri": ["Site languages", "Sitetalen", "Langues du site"],
    "Dil ekle": ["Add language", "Taal toevoegen", "Ajouter une langue"], "Çeviri tablosu": ["Translation table", "Vertaaltabel", "Tableau de traduction"], "Çevirileri dışa aktar": ["Export translations", "Vertalingen exporteren", "Exporter les traductions"],
    "Çevirileri içe aktar": ["Import translations", "Vertalingen importeren", "Importer les traductions"], "Yalnızca eksikler": ["Missing only", "Alleen ontbrekend", "Manquants seulement"], "Ara": ["Search", "Zoeken", "Rechercher"],
    "Panel dili": ["Panel language", "Paneeltaal", "Langue du panneau"],
  };
  const PAT = [[/^(\d+) kayıt$/, ["$1 records", "$1 records", "$1 enregistrements"]], [/^%(\d+) çevrildi$/, ["$1% translated", "$1% vertaald", "$1 % traduit"]]];
  let lang = "tr"; try { lang = localStorage.getItem("bbs_adm_lang") || "tr"; } catch (e) { }
  B.admLang = lang; document.documentElement.lang = lang;
  if (IDX[lang] !== undefined) B.startDom((s) => {
    const d = B.UI_ADM[s] || B.UI[s]; if (d) return d[IDX[lang]];
    for (const [re, v] of PAT) { const m = s.match(re); if (m) return v[IDX[lang]].replace("$1", m[1]); }
  });
})();
