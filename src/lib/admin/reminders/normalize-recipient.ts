export function normalizeRecipientPhone(value: string | null | undefined) {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return /^905\d{9}$/.test(digits) ? digits : null;
}
export function whatsappReminderUrl(phone: string | null | undefined, message: string) {
  const normalized = normalizeRecipientPhone(phone);
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : null;
}
