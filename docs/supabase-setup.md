# MeteVet Supabase kurulumu

Bu aşama yalnızca yönetim panelinin Supabase temelini kurar. Public site ve
mevcut randevu akışları Supabase yapılandırılmadan da çalışmaya devam eder.

## 1. Projeyi bağlama

1. Supabase üzerinde yeni bir proje oluşturun.
2. `.env.example` dosyasını `.env.local` olarak kopyalayın.
3. Supabase Dashboard > Project Settings > API bölümündeki Project URL ve
   publishable key değerlerini yerel dosyaya ekleyin:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Gerçek anahtarları repoya commit etmeyin. Service role/secret key bu web
uygulamasında gerekli değildir ve browser ortamına kesinlikle eklenmemelidir.

## 2. Migration'ı uygulama

Supabase CLI ile projeyi bağladıktan sonra migration'ı uygulayın:

```bash
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

Alternatif olarak `supabase/migrations/20260713150000_phase_2_1_foundation.sql`
dosyasını Supabase SQL Editor içinde bir kez çalıştırabilirsiniz.

## 3. İlk yöneticiyi oluşturma

Public kayıt ekranı bilerek yoktur.

1. Supabase Dashboard > Authentication > Users alanından bir kullanıcı ekleyin.
2. Oluşan kullanıcının UUID değerini kullanarak SQL Editor'da profil oluşturun:

```sql
insert into public.profiles (id, full_name, role)
values ('AUTH_USER_UUID', 'Yönetici Adı', 'admin');
```

İlk profil yalnızca güvenilir Dashboard/SQL ortamından oluşturulmalıdır. Sonraki
profil işlemleri RLS tarafından admin rolüyle sınırlandırılır. Bir kullanıcı
kendi rolünü değiştiremez.

## 4. Doğrulama

Uygulamayı çalıştırıp `/admin/login` adresinden oluşturduğunuz e-posta ve
şifreyle giriş yapın. Başarılı giriş `/admin` adresine yönlendirir. Korunan
yanıtlar `no-store` başlıkları ve `noindex` metadata kullanır.

Migration tüm klinik tablolarında RLS'yi etkinleştirir. Anonim erişim için
politika yoktur; personel okuyabilir, admin/veteriner klinik kayıtlarını
oluşturup güncelleyebilir ve yalnızca admin silebilir. Audit kayıtları normal
uygulama istemcilerinde append-only'dir.
