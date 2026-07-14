import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ClinicalDocumentData } from "@/src/lib/admin/documents/document-data";
import { registerPdfFonts } from "@/src/lib/admin/documents/pdf-fonts";
import {
  PdfClinicianSignature,
  PdfClinicalSummary,
  PdfEntries,
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

        <PdfSection title="Hayvan ve Sahip Özeti" minPresenceAhead={200}>
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

        {data.clinicalSummary ? (
          <PdfSection title="Klinik Özet" wrap={false}>
            <PdfClinicalSummary items={data.clinicalSummary} />
          </PdfSection>
        ) : null}

        {data.vitals && data.vitals.length ? (
          <PdfSection title="Vital Bulgular" wrap={false}>
            <PdfVitalTable items={data.vitals} />
          </PdfSection>
        ) : null}

        {data.sections.map((section, i) => {
          if (section.content) {
            return (
              <PdfSection key={`${section.title}-${i}`} title={section.title}>
                <Text style={baseStyles.content}>{section.content}</Text>
              </PdfSection>
            );
          }

          if (section.entries && section.entries.length) {
            return (
              <PdfSection key={`${section.title}-${i}`} title={section.title}>
                <PdfEntries entries={section.entries} />
              </PdfSection>
            );
          }

          const nonEmptyRows = (section.rows ?? []).filter(
            (row) => row.value && row.value.trim(),
          );
          if (!nonEmptyRows.length) return null;

          return (
            <PdfSection key={`${section.title}-${i}`} title={section.title}>
              {nonEmptyRows.map((row, j) => (
                <View
                  key={`${row.label}-${j}`}
                  style={baseStyles.row}
                >
                  <Text style={baseStyles.label}>{row.label}</Text>
                  <Text style={baseStyles.value}>{row.value}</Text>
                </View>
              ))}
            </PdfSection>
          );
        })}

        <View style={{ marginTop: 12 }}>
          {data.clinician ? (
            <PdfClinicianSignature
              name={data.clinician}
              registration={data.clinic.registration}
            />
          ) : null}
          <View
            style={{
              marginTop: data.clinician ? 12 : 0,
              padding: 8,
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
        </View>

        <DocumentFooter data={data} />
      </Page>
    </Document>
  );
}
