import type { UserRole } from "@/src/types/database";
export type ExaminationStatus = "draft" | "finalized" | "archived";
export type VisitType = "general_exam" | "follow_up" | "vaccination" | "emergency" | "surgery_control" | "dental" | "other";
export const examinationStatuses: ExaminationStatus[] = ["draft", "finalized", "archived"];
export const visitTypes: VisitType[] = ["general_exam", "follow_up", "vaccination", "emergency", "surgery_control", "dental", "other"];
export const examinationStatusLabels: Record<ExaminationStatus,string> = { draft:"Taslak", finalized:"Final", archived:"Arşivlenmiş" };
export const visitTypeLabels: Record<VisitType,string> = { general_exam:"Genel Muayene", follow_up:"Kontrol", vaccination:"Aşılama", emergency:"Acil", surgery_control:"Cerrahi Kontrol", dental:"Diş", other:"Diğer" };
export function canWriteExamination(role: UserRole) { return role === "admin" || role === "veterinarian"; }
export function isExaminationEditable(status: ExaminationStatus, role: UserRole) { return status === "draft" && canWriteExamination(role); }
export function canTransitionExamination(from: ExaminationStatus, to: ExaminationStatus, role: UserRole) { if(from===to)return true;if(from==="draft"&&to==="finalized")return canWriteExamination(role);return role==="admin"&&((from==="finalized"&&to==="draft")||(to==="archived")||(from==="archived"&&to==="draft")); }
export function validateVitals(v:{weight:number|null;temperature:number|null;heartRate:number|null;respiratoryRate:number|null}) { const errors:Record<string,string>={};if(v.weight!==null&&v.weight<=0)errors.weight="Ağırlık pozitif olmalıdır.";if(v.temperature!==null&&(v.temperature<30||v.temperature>45))errors.temperature="Sıcaklık 30–45 °C arasında olmalıdır.";if(v.heartRate!==null&&v.heartRate<=0)errors.heartRate="Kalp hızı pozitif olmalıdır.";if(v.respiratoryRate!==null&&v.respiratoryRate<=0)errors.respiratoryRate="Solunum hızı pozitif olmalıdır.";return errors; }
export function formatFollowUp(value:string|null){return value?new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"—";}
