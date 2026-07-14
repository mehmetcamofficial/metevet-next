import "server-only";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "node:crypto";
import { ClinicalDocument } from "@/src/components/documents/document-layout";
import type { ClinicalDocumentData } from "./document-data";

export async function generateClinicalPdf(data: ClinicalDocumentData) {
  const element = React.createElement(ClinicalDocument, { data }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(element);
  return { buffer: Buffer.from(buffer), checksum: createHash("sha256").update(buffer).digest("hex") };
}
