import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRecipientPhone, whatsappReminderUrl } from "../../src/lib/admin/reminders/normalize-recipient.ts";
import { canTransitionReminder, reminderDueState } from "../../src/lib/admin/reminders/reminder-status.ts";
import { renderReminderTemplate, templateVariablesAreValid } from "../../src/lib/admin/reminders/render-template.ts";
import { scheduleBefore } from "../../src/lib/admin/reminders/scheduling.ts";

test("normalizes supported Turkish mobile numbers and rejects invalid recipients", () => {
  assert.equal(normalizeRecipientPhone("0506 585 91 55"), "905065859155");
  assert.equal(normalizeRecipientPhone("+90 (506) 585-91-55"), "905065859155");
  assert.equal(normalizeRecipientPhone("123"), null);
  assert.equal(whatsappReminderUrl("123", "hello"), null);
});

test("WhatsApp URL safely encodes the complete message", () => {
  assert.equal(
    whatsappReminderUrl("05065859155", "Aşı & kontrol?"),
    "https://wa.me/905065859155?text=A%C5%9F%C4%B1%20%26%20kontrol%3F",
  );
});

test("unknown template variables fail safely", () => {
  assert.equal(templateVariablesAreValid("Merhaba {{owner_name}}"), true);
  assert.equal(templateVariablesAreValid("{{constructor}}"), false);
  assert.throws(() => renderReminderTemplate("{{unknown_value}}", {}), /Bilinmeyen/);
  assert.equal(renderReminderTemplate("Merhaba {{ owner_name }}", { owner_name: "Ayşe" }), "Merhaba Ayşe");
});

test("reminder status transitions keep terminal states immutable", () => {
  assert.equal(canTransitionReminder("pending", "ready"), true);
  assert.equal(canTransitionReminder("failed", "ready"), true);
  assert.equal(canTransitionReminder("sent", "failed"), false);
  assert.equal(canTransitionReminder("cancelled", "ready"), false);
});

test("due today, overdue, and future use Europe/Istanbul calendar boundaries", () => {
  const now = new Date("2026-07-14T20:30:00.000Z"); // 23:30 Istanbul
  assert.deepEqual(reminderDueState("2026-07-14T21:15:00.000Z", now), {
    overdue: false,
    dueToday: false,
    millisecondsUntilDue: 2_700_000,
  });
  assert.equal(reminderDueState("2026-07-14T19:00:00.000Z", now).overdue, true);
  assert.equal(reminderDueState("2026-07-14T20:45:00.000Z", now).dueToday, true);
});

test("lead-time scheduling is instant-based and DST-independent for Istanbul", () => {
  assert.equal(scheduleBefore("2026-07-20T09:00:00.000Z", 24), "2026-07-19T09:00:00.000Z");
});
