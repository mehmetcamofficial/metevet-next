const allowed = new Set(["owner_name", "pet_name", "date", "time", "service", "clinic_name", "clinic_phone"]);
export type TemplateVariables = Partial<Record<"owner_name"|"pet_name"|"date"|"time"|"service"|"clinic_name"|"clinic_phone", string>>;
export function templateVariablesAreValid(body: string) {
  const tokens = [...body.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map((match) => match[1]);
  return tokens.every((token) => allowed.has(token));
}
export function renderReminderTemplate(body: string, variables: TemplateVariables) {
  if (!templateVariablesAreValid(body)) throw new Error("Bilinmeyen şablon değişkeni.");
  return body.replace(/{{\s*([a-z_]+)\s*}}/g, (_match, key: string) => variables[key as keyof TemplateVariables] ?? "");
}
export const sampleTemplateVariables: TemplateVariables = { owner_name: "Ayşe Yılmaz", pet_name: "Mavi", date: "20.07.2026", time: "14:30", service: "Genel Muayene", clinic_name: "MeteVet Veteriner Kliniği", clinic_phone: "+90 506 585 91 55" };
