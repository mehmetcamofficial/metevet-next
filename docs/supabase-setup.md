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
SUPABASE_SERVICE_ROLE_KEY=server-only-placeholder
SUPABASE_AUTH_REDIRECT_URL=https://YOUR_DOMAIN/admin/reset-password
```

Gerçek anahtarları repoya commit etmeyin. Service role anahtarı yalnız personel
daveti ve Auth yönetimi için server-only modülde kullanılır. `NEXT_PUBLIC_`
önekine sahip olmamalı, Client Component içine import edilmemeli ve loglanmamalıdır.

## 2. Migration'ı uygulama

Supabase CLI ile projeyi bağladıktan sonra migration'ı uygulayın:

```bash
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

SQL Editor üzerinden yalnızca tek bir migration çalıştırmak desteklenmez; Phase 2
bağımlılıkları sıralıdır. CLI kullanılamıyorsa tüm migration dosyalarını dosya
adına göre sırayla, önce staging ortamında doğrulayarak uygulayın.

## 3. Rol test hesaplarını oluşturma

Public kayıt ekranı bilerek yoktur.

Supabase Dashboard > Authentication > Users alanından birbirinden ayrı üç kullanıcı oluşturun. Parolaları yalnız Dashboard/test parola kasasında tutun; SQL, terminal çıktısı, doküman veya commit içine yazmayın. Her kullanıcının UUID değerini aşağıdaki güvenilir SQL Editor işlemlerinde kullanın:

```sql
insert into public.profiles (id, full_name, role, status) values
  ('STAFF_AUTH_USER_UUID', 'Test Personeli', 'staff', 'active'),
  ('VETERINARIAN_AUTH_USER_UUID', 'Test Veterineri', 'veterinarian', 'active'),
  ('ADMIN_AUTH_USER_UUID', 'Test Yöneticisi', 'admin', 'active');

insert into public.personnel_private_profiles (id, email) values
  ('STAFF_AUTH_USER_UUID', 'STAFF_EMAIL_FROM_AUTH'),
  ('VETERINARIAN_AUTH_USER_UUID', 'VETERINARIAN_EMAIL_FROM_AUTH'),
  ('ADMIN_AUTH_USER_UUID', 'ADMIN_EMAIL_FROM_AUTH');
```

İlk profiller yalnızca güvenilir Dashboard/SQL ortamından oluşturulmalıdır. UUID değerlerinin doğru Auth kullanıcılarına ait olduğunu ikinci kez kontrol edin. Sonraki profil işlemleri RLS tarafından admin rolüyle sınırlandırılır ve kullanıcı kendi rolünü değiştiremez. `admin` rolü tek başına veteriner atfı sağlamaz; klinik kayıtlarda yalnız `veterinarian` profili seçilebilir.

## 4. Doğrulama

Uygulamayı çalıştırıp `/admin/login` adresinden oluşturduğunuz e-posta ve
şifreyle giriş yapın. Başarılı giriş `/admin` adresine yönlendirir. Korunan
yanıtlar `no-store` başlıkları ve `noindex` metadata kullanır.

Migration tüm klinik tablolarında RLS'yi etkinleştirir. Anonim erişim için
politika yoktur; personel okuyabilir, admin/veteriner klinik kayıtlarını
oluşturup güncelleyebilir ve yalnızca admin silebilir. Audit kayıtları normal
uygulama istemcilerinde append-only'dir.

Personel doğrulaması için parola veya token göstermeden şu sorguyu çalıştırın:

```sql
select p.id, p.full_name, private.email, p.role, p.status, p.created_at
from public.profiles p
join public.personnel_private_profiles private using(id)
order by p.created_at;
```

Yeni personel normalde `/admin/staff/invite` üzerinden davet edilir. Davet edilen
kullanıcı kendi şifresini e-posta bağlantısından belirler. Auth daveti oluşup
profil provision başarısız olursa admin detail ekranındaki onarım işlemi aynı
Auth UUID’siyle profili güvenli biçimde tamamlar.
