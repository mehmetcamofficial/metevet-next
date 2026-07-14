import { Text, View } from "@react-pdf/renderer";
import type { ClinicalDocumentData } from "@/src/lib/admin/documents/document-data";
import { PdfLogo, pdfColors } from "./pdf-primitives";
export function DocumentHeader({ data }: { data: ClinicalDocumentData }) {
  const contact = [
    data.clinic.authorizedVeterinarian,
    data.clinic.phone,
    data.clinic.website,
    data.clinic.address,
  ].filter(Boolean);
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: 10,
          borderBottom: "1.2 solid #A9853B",
        }}
      >
        <View>
          <PdfLogo />
          <Text style={{ marginTop: 2, fontSize: 8, color: pdfColors.muted }}>
            {data.clinic.name || "Veteriner Kliniği"}
          </Text>
        </View>
        {contact.length ? (
          <Text
            style={{
              width: "48%",
              textAlign: "right",
              fontSize: 7.5,
              color: pdfColors.muted,
              lineHeight: 1.55,
            }}
          >
            {contact.join("\n")}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          marginTop: 14,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ width: "68%" }}>
          <Text style={{ fontSize: 17, fontWeight: 700 }}>{data.title}</Text>
          <Text style={{ fontSize: 8, color: pdfColors.muted, marginTop: 3 }}>
            Klinik kayıt özeti
          </Text>
        </View>
        <View
          style={{ width: "30%", padding: 7, backgroundColor: pdfColors.soft }}
        >
          <Text style={{ fontSize: 7, color: pdfColors.muted }}>BELGE NO</Text>
          <Text style={{ fontSize: 8, fontWeight: 600, marginTop: 2 }}>
            {data.reference}
          </Text>
          <Text style={{ fontSize: 7, color: pdfColors.muted, marginTop: 4 }}>
            OLUŞTURULMA
          </Text>
          <Text style={{ fontSize: 8, marginTop: 2 }}>{data.generatedAt}</Text>
        </View>
      </View>
    </View>
  );
}
