-- BBS AUTO · schema-v4.sql
-- Supabase > SQL Editor'de BİR KEZ çalıştırın (tekrar çalıştırmak zararsızdır).
-- İçerik: ürün kodu, KVKK onay kaydı, bildirim altyapısı, yorumlar, çeviriler,
-- çerezsiz ziyaretçi sayacı, 2 adımlı doğrulama koruması, yasal sayfa taslakları.

-- ============================================================ 1) küçük sütunlar
alter table public.products add column if not exists sku text;
alter table public.messages add column if not exists consent boolean default false;
alter table public.messages add column if not exists consent_at timestamptz;

-- ============================================================ 2) 2 adımlı doğrulama denetimi
-- Kullanıcı 2FA'yı etkinleştirdiyse, aal2 (kod doğrulanmış) olmayan oturum yazamaz.
create or replace function public.mfa_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified');
$$;
grant execute on function public.mfa_ok() to anon, authenticated;

-- ============================================================ 3) bildirim ayarları (yalnızca yönetici)
create table if not exists public.notify_config (key text primary key, value text);
alter table public.notify_config enable row level security;
drop policy if exists notify_admin on public.notify_config;
create policy notify_admin on public.notify_config for all to authenticated using (true) with check (true);
insert into public.notify_config(key, value)
  values ('webhook_secret', md5(random()::text || clock_timestamp()::text) || md5(clock_timestamp()::text))
  on conflict (key) do nothing;

-- Yeni kayıtta Edge Function'ı çağırır. fn_url boşsa hiçbir şey yapmaz (altyapı hazır, bildirim kapalı).
create or replace function public.notify_new_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare u text; s text;
begin
  select value into u from public.notify_config where key = 'fn_url';
  select value into s from public.notify_config where key = 'webhook_secret';
  if coalesce(u, '') = '' then return new; end if;
  begin
    perform net.http_post(
      url := u,
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(s, '')),
      body := jsonb_build_object('type', 'INSERT', 'table', TG_TABLE_NAME, 'record', to_jsonb(new)));
  exception when others then null;   -- bildirim hatası asla mesajın kaydını engellemesin
  end;
  return new;
end $$;

do $$ begin
  create extension if not exists pg_net with schema extensions;
exception when others then raise notice 'pg_net açılamadı: Database > Extensions bölümünden pg_net''i etkinleştirin.';
end $$;

-- ============================================================ 4) yorumlar
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  rating int not null check (rating between 1 and 5),
  service text check (char_length(service) <= 100),
  comment text not null check (char_length(comment) between 5 and 1000),
  consent boolean default false,
  published boolean not null default false,
  reply text
);
alter table public.reviews enable row level security;
drop policy if exists reviews_read on public.reviews;
drop policy if exists reviews_insert on public.reviews;
drop policy if exists reviews_admin on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated using (published = true);
create policy reviews_insert on public.reviews for insert to anon, authenticated with check (published = false and reply is null);
create policy reviews_admin on public.reviews for all to authenticated using (true) with check (true);

-- ============================================================ 5) çeviriler
create table if not exists public.translations (
  lang text not null,
  ref text not null,
  value text,
  updated_at timestamptz default now(),
  primary key (lang, ref)
);
alter table public.translations enable row level security;
drop policy if exists tr_read on public.translations;
drop policy if exists tr_admin on public.translations;
create policy tr_read on public.translations for select to anon, authenticated using (true);
create policy tr_admin on public.translations for all to authenticated using (true) with check (true);

-- ============================================================ 6) çerezsiz ziyaretçi sayacı
-- IP / tarayıcı bilgisi SAKLANMAZ. Yalnızca "günlük rastgele tuz + IP + tarayıcı" özeti tutulur;
-- tuz her gün değişir ve eskileri silinir, bu yüzden özet geri çözülemez ve günler arası eşleşmez.
create table if not exists public.visit_salts (day date primary key, s text not null);
create table if not exists public.visits (
  day date not null,
  visitor text not null,
  path text not null,
  ref text,
  device text,
  hits int not null default 1,
  primary key (day, visitor, path)
);
alter table public.visit_salts enable row level security;
alter table public.visits enable row level security;   -- politika yok: doğrudan erişim kapalı

create or replace function public.track_visit(p_path text, p_ref text default null) returns void
language plpgsql security definer set search_path = public as $$
declare h json; ip text; ua text; salt text; v text; dev text;
begin
  h := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  ip := coalesce(nullif(h ->> 'cf-connecting-ip', ''), nullif(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), ''), '');
  ua := coalesce(h ->> 'user-agent', '');
  if ua ~* '(bot|crawl|spider|slurp|preview|headless|monitor)' then return; end if;
  select s into salt from public.visit_salts where day = current_date;
  if salt is null then
    insert into public.visit_salts(day, s) values (current_date, md5(random()::text || clock_timestamp()::text)) on conflict do nothing;
    select s into salt from public.visit_salts where day = current_date;
    delete from public.visit_salts where day < current_date;
  end if;
  v := md5(salt || '|' || ip || '|' || ua);
  dev := case when ua ~* 'ipad|tablet' then 'tablet' when ua ~* 'mobi|android|iphone' then 'mobil' else 'masaüstü' end;
  insert into public.visits(day, visitor, path, ref, device, hits)
    values (current_date, v, left(coalesce(p_path, '/'), 100), nullif(left(coalesce(p_ref, ''), 80), ''), dev, 1)
    on conflict (day, visitor, path) do update set hits = public.visits.hits + 1;
  if random() < 0.01 then delete from public.visits where day < current_date - 400; end if;
end $$;
revoke all on function public.track_visit(text, text) from public;
grant execute on function public.track_visit(text, text) to anon, authenticated;

create or replace function public.visit_stats(p_days int default 30) returns json
language plpgsql security definer set search_path = public as $$
declare r json; d0 date := current_date - (greatest(p_days, 1) - 1);
begin
  if auth.role() <> 'authenticated' or not public.mfa_ok() then raise exception 'yetkisiz'; end if;
  select json_build_object(
    'days', (select coalesce(json_agg(x order by x.day), '[]'::json) from (
        select g::date as day, count(distinct v.visitor) as visitors, coalesce(sum(v.hits), 0) as views
        from generate_series(d0, current_date, interval '1 day') g
        left join public.visits v on v.day = g::date group by g) x),
    'pages', (select coalesce(json_agg(x), '[]'::json) from (
        select path, sum(hits) as views, count(distinct visitor) as visitors from public.visits
        where day >= d0 group by path order by 2 desc limit 8) x),
    'refs', (select coalesce(json_agg(x), '[]'::json) from (
        select ref, count(distinct visitor) as visitors from public.visits
        where day >= d0 and ref is not null group by ref order by 2 desc limit 8) x),
    'devices', (select coalesce(json_agg(x), '[]'::json) from (
        select device, count(distinct visitor) as visitors from public.visits
        where day >= d0 group by device order by 2 desc) x)
  ) into r;
  return r;
end $$;
revoke all on function public.visit_stats(int) from public;
grant execute on function public.visit_stats(int) to authenticated;

-- ============================================================ 7) sahte mesaj/yorum seline karşı koruma
-- Bildirimler (WhatsApp/Telegram/e-posta) artık mesajla tetiklendiği için seli sınırlıyoruz.
create or replace function public.flood_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  execute format('select count(*) from public.%I where created_at > now() - interval ''10 minutes''', TG_TABLE_NAME) into n;
  if n >= 20 then raise exception 'rate_limit'; end if;
  return new;
end $$;

drop trigger if exists trg_flood_messages on public.messages;
create trigger trg_flood_messages before insert on public.messages for each row execute function public.flood_guard();
drop trigger if exists trg_flood_reviews on public.reviews;
create trigger trg_flood_reviews before insert on public.reviews for each row execute function public.flood_guard();

drop trigger if exists trg_notify_messages on public.messages;
create trigger trg_notify_messages after insert on public.messages for each row execute function public.notify_new_row();
drop trigger if exists trg_notify_reviews on public.reviews;
create trigger trg_notify_reviews after insert on public.reviews for each row execute function public.notify_new_row();

-- ============================================================ 8) 2FA koruma politikaları
do $$ declare t text; begin
  foreach t in array array['slides','menu','pages','services','products','posts','socials','faq','brands','settings','translations','reviews','notify_config','messages'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists mfa_ins on public.%I', t);
      execute format('drop policy if exists mfa_upd on public.%I', t);
      execute format('drop policy if exists mfa_del on public.%I', t);
      execute format('create policy mfa_ins on public.%I as restrictive for insert to authenticated with check (public.mfa_ok())', t);
      execute format('create policy mfa_upd on public.%I as restrictive for update to authenticated using (public.mfa_ok()) with check (public.mfa_ok())', t);
      execute format('create policy mfa_del on public.%I as restrictive for delete to authenticated using (public.mfa_ok())', t);
    end if;
  end loop;
  foreach t in array array['messages','notify_config'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists mfa_sel on public.%I', t);
      execute format('create policy mfa_sel on public.%I as restrictive for select to authenticated using (public.mfa_ok())', t);
    end if;
  end loop;
end $$;

-- Görsel deposu (media) için de aynı koruma; izin yoksa atlanır.
do $$ begin
  execute 'drop policy if exists mfa_media_w on storage.objects';
  execute 'create policy mfa_media_w on storage.objects as restrictive for all to authenticated using (bucket_id <> ''media'' or public.mfa_ok()) with check (bucket_id <> ''media'' or public.mfa_ok())';
exception when others then raise notice 'storage.objects politikası eklenemedi (atlandı).';
end $$;

-- ============================================================ 9) yasal sayfa TASLAKLARI (yayında DEĞİL)
-- Metinleri bir avukata kontrol ettirin, Site Ayarları > Yasal bölümünü doldurun, sonra "Yayında" yapın.
insert into public.pages(title, slug, body, published)
select 'KVKK Aydınlatma Metni', 'kvkk', $kvkk$
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) m.10 uyarınca, kişisel verileriniz aşağıda açıklanan kapsamda işlenmektedir.</p>
<h2>1. Veri sorumlusu</h2>
<p><strong>{{legal_name}}</strong> ({{site_title}})<br>Adres: {{address}}<br>Vergi / MERSİS no: {{legal_tax}}<br>Telefon: {{phone}} · E-posta: {{legal_email}}</p>
<h2>2. İşlenen kişisel veriler</h2>
<ul><li>Kimlik ve iletişim: ad soyad, telefon, e-posta</li><li>Müşteri işlemi: iletişim formundaki konu ve mesaj içeriği, randevu talebi</li><li>Yorum formu: ad, puan, yorum metni, aldığınız hizmet</li><li>İşlem güvenliği: aydınlatma metnini okuduğunuza dair onay bilgisi ve zamanı</li></ul>
<h2>3. İşleme amaçları</h2>
<ul><li>Mesaj ve randevu taleplerinize dönüş yapmak, teklif ve bilgi vermek</li><li>Sunduğumuz hizmetleri yürütmek ve müşteri ilişkilerini yönetmek</li><li>Onayınızla yorumunuzu sitede yayımlamak</li><li>Hukuki yükümlülüklerimizi yerine getirmek, site güvenliğini sağlamak</li></ul>
<h2>4. Toplama yöntemi ve hukuki sebep</h2>
<p>Verileriniz, web sitesindeki formlar aracılığıyla elektronik ortamda toplanır. Hukuki sebepler: KVKK m.5/2-c (bir sözleşmenin kurulması veya ifası), m.5/2-ç (hukuki yükümlülük), m.5/2-f (meşru menfaat); yorumların yayımı için m.5/1 (açık rıza).</p>
<h2>5. Aktarım</h2>
<p>Verileriniz; barındırma ve veri tabanı hizmeti ({{site_title}} sitesinin altyapı sağlayıcısı Supabase), bildirim hizmetleri (e-posta, Telegram, WhatsApp bildirimi) ve yetkili kamu kurumları ile, yukarıdaki amaçlarla sınırlı olarak paylaşılabilir. Bazı hizmet sağlayıcıların sunucuları yurt dışında bulunabilir; aktarım KVKK m.9 hükümlerine uygun olarak yapılır.</p>
<h2>6. Saklama süresi</h2>
<p>Mesajlar, talebinizin sonuçlanmasından itibaren en fazla [2] yıl; yorumlar, siz silinmesini isteyene kadar saklanır. Yasal saklama süreleri saklıdır.</p>
<h2>7. Haklarınız (KVKK m.11)</h2>
<p>Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini, silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, otomatik analiz sonucu aleyhinize bir sonuca itiraz etme ve kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme haklarına sahipsiniz.</p>
<h2>8. Başvuru</h2>
<p>Taleplerinizi <strong>{{legal_email}}</strong> adresine veya yukarıdaki adrese yazılı olarak iletebilirsiniz. Başvurunuz en geç 30 gün içinde sonuçlandırılır.</p>
<p><small>Son güncelleme: {{legal_updated}}</small></p>
$kvkk$, false
where not exists (select 1 from public.pages where slug = 'kvkk');

insert into public.pages(title, slug, body, published)
select 'Gizlilik Politikası', 'gizlilik', $giz$
<p>{{site_title}} olarak ziyaretçilerimizin gizliliğine saygı duyuyoruz. Bu politika, bu web sitesinde hangi bilgilerin nasıl kullanıldığını özetler. Ayrıntılı bilgi için <a href="sayfa.html?s=kvkk">KVKK Aydınlatma Metni</a>’ne bakın.</p>
<h2>Topladığımız bilgiler</h2>
<ul><li><strong>Formlar:</strong> İletişim ve yorum formlarına yazdığınız bilgiler (ad, telefon, e-posta, mesaj). Yalnızca size dönüş yapmak ve yorumunuzu yayımlamak için kullanılır.</li><li><strong>Ziyaret istatistikleri:</strong> Sitenin kullanımını anlamak için çerez kullanmayan, anonim bir sayaç çalışır. IP adresiniz ve tarayıcı bilginiz saklanmaz; yalnızca günlük değişen, geri çözülemeyen bir özet ile ziyaret edilen sayfa tutulur.</li></ul>
<h2>Paylaşım</h2>
<p>Bilgilerinizi satmaz, pazarlama amacıyla üçüncü kişilere vermeyiz. Yalnızca site altyapısını sağlayan hizmet sağlayıcılarla (barındırma/veri tabanı, bildirim hizmetleri) ve yasal zorunluluk hâlinde yetkili kurumlarla paylaşılır.</p>
<h2>Üçüncü taraf kaynaklar</h2>
<p>Sayfalar; yazı tipleri (Google Fonts), yazılım kütüphaneleri (jsDelivr) ve harita (OpenStreetMap) gibi dış kaynakları yükleyebilir. Bu kaynaklara bağlanırken IP adresiniz ilgili sağlayıcıya iletilir.</p>
<h2>Güvenlik ve haklarınız</h2>
<p>Verileriniz şifreli bağlantı (HTTPS) ile iletilir ve erişimi yetkili kişilerle sınırlıdır. Verilerinizle ilgili taleplerinizi {{legal_email}} adresine iletebilirsiniz.</p>
<p><small>Son güncelleme: {{legal_updated}}</small></p>
$giz$, false
where not exists (select 1 from public.pages where slug = 'gizlilik');

insert into public.pages(title, slug, body, published)
select 'Çerez Politikası', 'cerez', $cer$
<p>Bu sitede <strong>reklam, analiz veya takip amaçlı çerez kullanılmaz</strong>. Yalnızca sitenin çalışması ve tercihlerinizin hatırlanması için tarayıcı depolaması (localStorage / sessionStorage) kullanılır; bunlar zorunlu depolama kapsamındadır.</p>
<h2>Kullanılan depolama</h2>
<ul><li><strong>theme:</strong> gündüz/gece modu tercihiniz</li><li><strong>bbs_lang:</strong> seçtiğiniz dil</li><li><strong>bbs_css, bbs_logo:</strong> sayfanın titremeden açılması için son tasarım ayarları</li><li><strong>bbs_splash:</strong> açılış ekranının oturumda bir kez gösterilmesi</li><li><strong>bbs_sent, bbs_rev:</strong> form ve yorum gönderimlerinde art arda gönderimi sınırlamak için zaman bilgisi</li><li><strong>bbs_cn:</strong> bu bilgilendirmeyi kapattığınız bilgisi</li></ul>
<h2>Ziyaretçi sayacı</h2>
<p>Çerez veya tarayıcıya yazılan bir tanımlayıcı kullanmaz; kişisel olarak sizi tanımaz. Tarayıcınızın “İzlemeyi reddet (Do Not Track)” ayarı açıksa sayılmazsınız.</p>
<h2>Dış kaynaklar</h2>
<p>Yazı tipleri, harita ve bazı yazılım dosyaları üçüncü taraf sunuculardan yüklenir (Google Fonts, jsDelivr, OpenStreetMap). Bu sunucular, istek sırasında IP adresinizi görebilir.</p>
<h2>Nasıl kontrol edersiniz?</h2>
<p>Tarayıcınızın ayarlarından site verilerini silebilir veya engelleyebilirsiniz; bu durumda tema ve dil tercihiniz her ziyarette sıfırlanır.</p>
<p><small>Son güncelleme: {{legal_updated}}</small></p>
$cer$, false
where not exists (select 1 from public.pages where slug = 'cerez');
