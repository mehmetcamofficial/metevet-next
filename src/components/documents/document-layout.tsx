import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ClinicalDocumentData } from "@/src/lib/admin/documents/document-data";
import { registerPdfFonts } from "@/src/lib/admin/documents/pdf-fonts";
import {
  PdfClinicianSignature,
  PdfEmptyValue,
  PdfField,
  PdfInfoGrid,
  PdfPageBackground,
  PdfSection,
  PdfVitalTable,
  baseStyles,
  pdfColors,
} from "./pdf-primitives";
import { DocumentHeader } from "./document-header";
import { DocumentFooter } from "./document-footer";
registerPdfFonts();
export function ClinicalDocument({ data }: { data: ClinicalDocumentData }) {
  return (
    <Document
      title={data.title}
      author={data.clinic.name || "MeteVet Veteriner Kliniği"}
      subject={data.title}
    >
      <Page size="A4" style={baseStyles.page} wrap>
        <PdfPageBackground />
        <DocumentHeader data={data} />
        <PdfSection title="Hayvan ve Sahip Özeti" wrap={false}>
          <PdfInfoGrid>
            <PdfField label="Hayvan" value={data.patient.name} />
            <PdfField label="Hayvan Sahibi" value={data.ownerName} />
            <PdfField label="Tür" value={data.patient.species} />
            <PdfField label="Irk" value={data.patient.breed} />
            <PdfField label="Cinsiyet" value={data.patient.sex} />
            <PdfField
              label="Doğum Tarihi / Yaş"
              value={[data.patient.birthDate, data.patient.age]
                .filter(Boolean)
                .join(" / ")}
            />
            <PdfField label="Mikroçip" value={data.patient.microchip} />
          </PdfInfoGrid>
        </PdfSection>
        {data.vitals ? (
          <PdfSection title="Vital Bulgular" wrap={false}>
            <PdfVitalTable items={data.vitals} />
          </PdfSection>
        ) : null}
        {data.sections.map((section, i) => (
          <PdfSection key={`${section.title}-${i}`} title={section.title}>
            <>
              {section.rows.length ? (
                section.rows.map((row, j) => (
                  <View
                    key={`${row.label}-${j}`}
                    style={baseStyles.row}
                  >
                    <Text style={baseStyles.label}>{row.label}</Text>
                    <Text style={baseStyles.value}>
                      {row.value || "Bilgi girilmemiş"}
                    </Text>
                  </View>
                ))
              ) : (
                <PdfEmptyValue />
              )}
            </>
          </PdfSection>
        ))}
        {data.clinician ? (
          <PdfClinicianSignature
            name={data.clinician}
            registration={data.clinic.registration}
          />
        ) : null}
        <View
          style={{
            marginTop: 16,
            padding: 9,
            backgroundColor: pdfColors.soft,
            borderRadius: 3,
          }}
          wrap={false}
        >
          <Text
            style={{ fontSize: 7.5, color: pdfColors.muted, lineHeight: 1.5 }}
          >
            {data.disclaimer}
          </Text>
        </View>
        <DocumentFooter data={data} />
      </Page>
    </Document>
  );
}
