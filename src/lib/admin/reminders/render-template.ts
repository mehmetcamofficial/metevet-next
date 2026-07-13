const allowed = new Set(["owner_name", "pet_name", "date", "time", "service", "clinic_name", "clinic_phone"]);
export type TemplateVariables = Partial<Record<"owner_name"|"pet_name"|"date"|"time"|"service"|"clinic_name"|"clinic_phone", string>>;
export function renderReminderTemplate(body: string, variables: TemplateVariables) {
  return body.replace(/{{\s*([a-z_]+)\s*}}/g, (match, key: string) => allowed.has(key) ? variables[key as keyof TemplateVariables] ?? "" : match);
}
export const sampleTemplateVariables: TemplateVariables = { owner_name: "Ayşe Yılmaz", pet_name: "Mavi", date: "20.07.2026", time: "14:30", service: "Genel Muayene", clinic_name: "MeteVet Veteriner Kliniği", clinic_phone: "+90 506 585 91 55" };
