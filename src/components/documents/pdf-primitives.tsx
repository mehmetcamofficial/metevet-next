import { StyleSheet, Text, View, Svg, Path } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { PDF_FONT_FAMILY } from "@/src/lib/admin/documents/pdf-fonts";
export const pdfColors = {
  green: "#0D2922",
  gold: "#A9853B",
  muted: "#526A64",
  line: "#DDD8CE",
  soft: "#F4F0E8",
  white: "#FFFFFF",
};
export const baseStyles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 34,
    paddingBottom: 72,
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    color: pdfColors.green,
    lineHeight: 1.45,
    backgroundColor: pdfColors.white,
  },
  section: {
    marginTop: 10,
    border: "0.7 solid #DDD8CE",
    borderRadius: 4,
    overflow: "hidden",
  },
  sectionTitle: {
    backgroundColor: pdfColors.soft,
    borderLeft: "3 solid #A9853B",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 10.5,
    fontWeight: 600,
  },
  sectionBody: { paddingHorizontal: 9, paddingVertical: 3 },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottom: "0.4 solid #E8E3DA",
  },
  label: {
    width: "30%",
    fontWeight: 600,
    color: pdfColors.muted,
    paddingRight: 8,
  },
  value: { width: "70%", lineHeight: 1.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 0 },
  field: { width: "50%", paddingVertical: 4, paddingRight: 8 },
  fieldLabel: { fontSize: 7.5, color: pdfColors.muted },
  fieldValue: { marginTop: 2, fontSize: 9, fontWeight: 500 },
  content: {
    fontSize: 9,
    lineHeight: 1.55,
    paddingVertical: 4,
  },
  entryTitle: {
    fontSize: 9.5,
    fontWeight: 600,
    paddingVertical: 5,
    borderBottom: "0.5 solid #DDD8CE",
  },
  entryRow: {
    flexDirection: "row",
    paddingVertical: 2.5,
    borderBottom: "0.3 solid #E8E3DA",
  },
  entryLabel: {
    width: "35%",
    fontSize: 7.5,
    fontWeight: 600,
    color: pdfColors.muted,
    paddingRight: 6,
  },
  entryValue: { width: "65%", fontSize: 9, lineHeight: 1.4 },
  entrySeparator: {
    marginTop: 8,
    borderBottom: "0.4 solid #DDD8CE",
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: "0.3 solid #E8E3DA",
  },
  summaryLabel: {
    width: "28%",
    fontSize: 8,
    fontWeight: 600,
    color: pdfColors.muted,
    paddingRight: 6,
  },
  summaryValue: { width: "72%", fontSize: 9, fontWeight: 500 },
});
export function PdfPageBackground() {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: pdfColors.white,
      }}
    />
  );
}
export function PdfLogo() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Svg width={27} height={27} viewBox="0 0 32 32">
        <Path
          d="M16 2C9 2 4 7 4 14c0 8 7 14 12 16 5-2 12-8 12-16C28 7 23 2 16 2Z"
          fill={pdfColors.green}
        />
        <Path d="M10 15h4v-4h4v4h4v4h-4v4h-4v-4h-4z" fill={pdfColors.gold} />
      </Svg>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginLeft: 7,
          color: pdfColors.green,
        }}
      >
        MeteVet
      </Text>
    </View>
  );
}
export function PdfSection({
  title,
  children,
  wrap = true,
  minPresenceAhead = 120,
}: {
  title: string;
  children: ReactNode;
  wrap?: boolean;
  minPresenceAhead?: number;
}) {
  return (
    <View style={baseStyles.section} wrap={wrap} minPresenceAhead={minPresenceAhead}>
      <Text style={baseStyles.sectionTitle}>{title}</Text>
      <View style={baseStyles.sectionBody}>{children}</View>
    </View>
  );
}
export function PdfField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={baseStyles.field}>
      <Text style={baseStyles.fieldLabel}>{label}</Text>
      <Text style={baseStyles.fieldValue}>{value}</Text>
    </View>
  );
}
export function PdfInfoGrid({ children }: { children: ReactNode }) {
  return <View style={baseStyles.grid}>{children}</View>;
}
export function PdfVitalTable({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      {items.map((x) => (
        <View
          key={x.label}
          style={{ width: "25%", padding: 7, borderRight: "0.4 solid #DDD8CE" }}
        >
          <Text style={{ fontSize: 7.5, color: pdfColors.muted }}>
            {x.label}
          </Text>
          <Text style={{ marginTop: 3, fontWeight: 600 }}>{x.value}</Text>
        </View>
      ))}
    </View>
  );
}
export function PdfClinicalSummary({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <View>
      {items.map((item, i) => (
        <View
          key={`${item.label}-${i}`}
          style={baseStyles.summaryRow}
        >
          <Text style={baseStyles.summaryLabel}>{item.label}</Text>
          <Text style={baseStyles.summaryValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}
export function PdfEntry({
  title,
  fields,
}: {
  title?: string;
  fields: Array<{ label: string; value: string }>;
}) {
  return (
    <View wrap={false} minPresenceAhead={40}>
      {title ? <Text style={baseStyles.entryTitle}>{title}</Text> : null}
      {fields.map((f, i) => (
        <View key={`${f.label}-${i}`} style={baseStyles.entryRow}>
          <Text style={baseStyles.entryLabel}>{f.label}</Text>
          <Text style={baseStyles.entryValue}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function PdfEntries({
  entries,
}: {
  entries: Array<{ title?: string; fields: Array<{ label: string; value: string }> }>;
}) {
  return (
    <View>
      {entries.map((entry, i) => (
        <View key={`${entry.title ?? "entry"}-${i}`}>
          {i > 0 ? <View style={baseStyles.entrySeparator} /> : null}
          <PdfEntry title={entry.title} fields={entry.fields} />
        </View>
      ))}
    </View>
  );
}
export function PdfClinicianSignature({
  name,
  registration,
}: {
  name: string;
  registration?: string | null;
}) {
  return (
    <View
      style={{ marginTop: 14, marginLeft: "55%", textAlign: "center" }}
      wrap={false}
    >
      <View style={{ borderTop: "0.7 solid #526A64", paddingTop: 5 }}>
        <Text style={{ fontWeight: 600 }}>{name}</Text>
        <Text style={{ fontSize: 8, color: pdfColors.muted }}>
          Veteriner Hekim
        </Text>
        {registration ? (
          <Text style={{ fontSize: 7.5, marginTop: 2 }}>{registration}</Text>
        ) : null}
        <Text style={{ fontSize: 7, marginTop: 3, color: pdfColors.muted }}>
          Elektronik olarak oluşturulmuştur
        </Text>
      </View>
    </View>
  );
}
