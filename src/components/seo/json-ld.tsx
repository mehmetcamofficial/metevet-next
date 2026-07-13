import Script from "next/script";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
