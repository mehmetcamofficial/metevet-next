import type { ReminderChannel } from "@/src/types/database";
export interface ReminderDelivery { recipient: string; subject?: string; message: string }
export interface ReminderProviderAdapter { channel: ReminderChannel; configured: boolean; send(delivery: ReminderDelivery): Promise<{ providerMessageId?: string }> }
export const providerAvailabilityLabel = (channel: ReminderChannel) => channel === "whatsapp" ? "Manuel gönderim" : channel === "internal" ? "Dahili kanal" : "Provider yapılandırılmadı";
