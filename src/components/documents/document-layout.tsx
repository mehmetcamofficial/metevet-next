import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ClinicalDocumentData } from "@/src/lib/admin/documents/document-data";
import { DocumentHeader } from "./document-header";
import { DocumentFooter } from "./document-footer";
import { PatientSummary } from "./patient-summary";
import { OwnerSummary } from "./owner-summary";

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingHorizontal: 34, paddingBottom: 55, fontFamily: "Helvetica", fontSize: 9, color: "#123A30" },
  owner: { marginTop: 6 }, section: { marginTop: 15 },
  heading: { fontSize: 11, fontWeight: 700, color: "#0D2922", borderBottom: "1 solid #E3DDD1", paddingBottom: 4 },
  row: { flexDirection: "row", paddingVertical: 5, borderBottom: "0.5 solid #EEE9E0" },
  label: { width: "28%", fontWeight: 700 }, value: { width: "72%", lineHeight: 1.4 },
});

export function ClinicalDocument({ data }: { data: ClinicalDocumentData }) {
  return <Document title={data.title} author="MeteVet Veteriner Kliniği"><Page size="A4" style={s.page}><DocumentHeader title={data.title} reference={data.reference} /><PatientSummary petName={data.petName} /><View style={s.owner}><OwnerSummary ownerName={data.ownerName} /></View>{data.sections.map((section, i) => <View key={`${section.title}-${i}`} style={s.section} wrap={false}><Text style={s.heading}>{section.title}</Text>{section.rows.length ? section.rows.map((row, j) => <View key={`${row.label}-${j}`} style={s.row}><Text style={s.label}>{row.label}</Text><Text style={s.value}>{row.value}</Text></View>) : <Text style={{ marginTop: 6, color: "#526A64" }}>Kayıt bulunmuyor.</Text>}</View>)}<DocumentFooter disclaimer={data.disclaimer} /></Page></Document>;
}
