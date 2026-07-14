import React from "react";
import { writeFile } from "node:fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import { ClinicalDocument } from "../src/components/documents/document-layout";
import type { ClinicalDocumentData } from "../src/lib/admin/documents/document-data";

const clinic = {
  name: "Kuşadası Veteriner Kliniği",
  authorizedVeterinarian: "Veteriner Hekim Onur Metehan Çakır",
  phone: "+90 506 585 91 55",
  website: "https://metevet.com.tr",
  address: "Kuşadası / Aydın",
  registration: "Veteriner Hekim Sicil No: 12345",
};

const patient = {
  name: "Sütlaç",
  species: "Kedi" as string | null,
  breed: "Ankara Kedisi" as string | null,
  sex: "Dişi",
  birthDate: "12 Mayıs 2021",
  age: "5 yaş 2 ay",
  microchip: "900123456789012" as string | null,
};

const examinationFixture: ClinicalDocumentData = {
  type: "examination_summary",
  title: "Muayene Özeti",
  subtitle: "Muayene ve klinik değerlendirme kaydı",
  footerLabel: "Klinik belge",
  reference: "MV-20260714-56ED78AD",
  generatedAt: "14 Temmuz 2026 13:15",
  ownerId: null,
  petId: null,
  appointmentId: null,
  examinationId: null,
  ownerName: "Onur Çakır",
  petName: "Sütlaç",
  patient,
  clinic,
  clinician: "Onur Metehan Çakır",
  vitals: [
    { label: "Ağırlık", value: "4.8 kg" },
    { label: "Sıcaklık", value: "38.4 °C" },
    { label: "Kalp Hızı", value: "140 atım/dk" },
    { label: "Solunum Hızı", value: "28 solunum/dk" },
  ],
  clinicalSummary: [
    { label: "Ziyaret Türü", value: "Genel Muayene" },
    { label: "Tanı", value: "Gastrointestinal sistem rahatsızlığı - ön değerlendirme" },
    { label: "Kontrol Tarihi", value: "17 Temmuz 2026" },
    { label: "Veteriner Hekim", value: "Onur Metehan Çakır" },
  ],
  sections: [
    {
      title: "Ziyaret Bilgileri",
      rows: [
        { label: "Ziyaret Türü", value: "Genel Muayene" },
        { label: "Muayene Tarihi", value: "14 Temmuz 2026 11:30" },
        { label: "Kontrol Tarihi", value: "17 Temmuz 2026" },
      ],
    },
    {
      title: "Başlıca Şikâyet",
      content: "Üç gündür iştahsızlık ve aralıklı kusma.",
    },
    {
      title: "Öykü",
      content:
        "Hayvan sahibinin beyanına göre son üç gündür iştah azalmış, su tüketimi devam etmiştir.",
    },
    {
      title: "Muayene Bulguları",
      content:
        "Genel durum stabil. Abdominal palpasyonda hafif hassasiyet kaydedildi.",
    },
    {
      title: "Değerlendirme",
      content:
        "Gastrointestinal yakınmalar açısından klinik takip planlandı.",
    },
    {
      title: "Tanı",
      content: "Gastrointestinal sistem rahatsızlığı - ön değerlendirme",
    },
    {
      title: "Uygulanan İşlemler",
      content: "Antiemetik ve destekleyici sıvı tedavisi uygulaması.",
    },
    {
      title: "Tedavi Planı",
      content:
        "Veteriner hekim tarafından kayıt altına alınan destekleyici tedavi planı uygulandı.",
    },
    {
      title: "Öneriler",
      content:
        "Kontrol muayene üç gün sonra. Diyet değişikliği ve probiyotik kullanımına devam.",
    },
  ],
  disclaimer:
    "Bu belge, belirtilen tarihte gerçekleştirilen veteriner hekim muayenesine ait kayıt özetidir. Acil durumlarda veya hayvanın klinik durumunda değişiklik olduğunda veteriner hekiminizle iletişime geçiniz.",
};

const vaccineFixture: ClinicalDocumentData = {
  type: "vaccination_card",
  title: "Aşı Karnesi",
  subtitle: "Aşı uygulamaları ve takip planı",
  footerLabel: "Veteriner sağlık belgesi",
  reference: "MV-20260714-A51C0001",
  generatedAt: "14 Temmuz 2026 13:15",
  ownerId: null,
  petId: null,
  appointmentId: null,
  examinationId: null,
  ownerName: "Onur Çakır",
  petName: "Sütlaç",
  patient,
  clinic,
  clinician: "Onur Metehan Çakır",
  vitals: null,
  clinicalSummary: null,
  sections: [
    {
      title: "Aşı Geçmişi",
      entries: [
        {
          title: "Kuduz Aşısı",
          fields: [
            { label: "Uygulama Tarihi", value: "14 Temmuz 2026 11:30" },
            { label: "Üretici", value: "Merial" },
            { label: "Parti No", value: "ÇĞİŞ-12" },
            { label: "Seri No", value: "RV-2026-001" },
            { label: "Doz", value: "1" },
            { label: "Durum", value: "Tamamlandı" },
            { label: "Veteriner Hekim", value: "Onur Metehan Çakır" },
            { label: "Sonraki Uygulama", value: "14 Temmuz 2027" },
          ],
        },
        {
          title: "Karma Aşı",
          fields: [
            { label: "Uygulama Tarihi", value: "1 Mart 2026 09:00" },
            { label: "Üretici", value: "Boehringer" },
            { label: "Doz", value: "2" },
            { label: "Durum", value: "Tamamlandı" },
            { label: "Veteriner Hekim", value: "Onur Metehan Çakır" },
            { label: "Sonraki Uygulama", value: "1 Mart 2027" },
          ],
        },
      ],
    },
  ],
  disclaimer:
    "Bu belge, kayıtlı aşı uygulamalarını ve planlanan takip tarihlerini gösterir. Aşı takvimi, hayvanın sağlık durumuna göre veteriner hekim tarafından değiştirilebilir.",
};

const preventiveFixture: ClinicalDocumentData = {
  type: "preventive_care_history",
  title: "Koruyucu Sağlık Geçmişi",
  subtitle: "Aşı ve parazit uygulama geçmişi",
  footerLabel: "Veteriner sağlık kaydı",
  reference: "MV-20260714-CAFE0002",
  generatedAt: "14 Temmuz 2026 13:15",
  ownerId: null,
  petId: null,
  appointmentId: null,
  examinationId: null,
  ownerName: "Onur Çakır",
  petName: "Sütlaç",
  patient,
  clinic,
  clinician: "Onur Metehan Çakır",
  vitals: null,
  clinicalSummary: null,
  sections: [
    {
      title: "Aşı Geçmişi",
      entries: [
        {
          title: "Kuduz Aşısı",
          fields: [
            { label: "Uygulama Tarihi", value: "14 Temmuz 2026 11:30" },
            { label: "Doz", value: "1" },
            { label: "Durum", value: "Tamamlandı" },
            { label: "Veteriner Hekim", value: "Onur Metehan Çakır" },
            { label: "Sonraki Uygulama", value: "14 Temmuz 2027" },
          ],
        },
        {
          title: "Karma Aşı",
          fields: [
            { label: "Uygulama Tarihi", value: "1 Mart 2026 09:00" },
            { label: "Doz", value: "2" },
            { label: "Durum", value: "Tamamlandı" },
            { label: "Veteriner Hekim", value: "Onur Metehan Çakır" },
            { label: "Sonraki Uygulama", value: "1 Mart 2027" },
          ],
        },
      ],
    },
    {
      title: "Parazit Uygulamaları",
      entries: [
        {
          title: "Profender",
          fields: [
            { label: "Uygulama Türü", value: "İç ve Dış Parazit" },
            { label: "Uygulama Tarihi", value: "1 Haziran 2026 10:00" },
            { label: "Durum", value: "Tamamlandı" },
            { label: "Veteriner Hekim", value: "Onur Metehan Çakır" },
            { label: "Sonraki Uygulama", value: "1 Haziran 2027" },
          ],
        },
      ],
    },
  ],
  disclaimer:
    "Bu belge, kayıtlı aşı ve parazit uygulamalarının geçmişini gösterir. Sonraki uygulama tarihleri takip amaçlıdır ve veteriner hekim değerlendirmesinin yerini almaz.",
};

const fixtures = [
  { file: "output/pdf/muayene-ozeti-sutlac-v2.pdf", data: examinationFixture },
  { file: "output/pdf/asi-karnesi-sutlac-v2.pdf", data: vaccineFixture },
  { file: "output/pdf/koruyucu-saglik-sutlac-v2.pdf", data: preventiveFixture },
];

async function main() {
  const selected = process.argv[2]
    ? fixtures.filter((x) => x.file.includes(process.argv[2]))
    : fixtures;
  for (const x of selected) {
    const buffer = await renderToBuffer(<ClinicalDocument data={x.data} />);
    await writeFile(x.file, buffer);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
