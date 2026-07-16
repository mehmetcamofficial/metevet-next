"use client";

import Link from "next/link";
import type { TimelineEvent } from "@/src/lib/admin/medical-record/medical-record-readers";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case "appointment": return "Randevu";
    case "examination": return "Muayene";
    case "vaccination": return "Aşı";
    case "parasite": return "Parazit";
    case "reminder": return "Hatırlatıcı";
    case "document": return "Belge";
    default: return type;
  }
}

function eventTypeIcon(type: string): string {
  switch (type) {
    case "appointment": return "📅";
    case "examination": return "🩺";
    case "vaccination": return "💉";
    case "parasite": return "🐛";
    case "reminder": return "⏰";
    case "document": return "📄";
    default: return "📋";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending": return "Bekliyor";
    case "confirmed": return "Onaylandı";
    case "completed": return "Tamamlandı";
    case "cancelled": return "İptal";
    case "no_show": return "Gelmedi";
    case "draft": return "Taslak";
    case "finalized": return "Onaylandı";
    case "archived": return "Arşivlendi";
    case "sent": return "Gönderildi";
    case "ready": return "Hazır";
    case "failed": return "Başarısız";
    default: return status;
  }
}

export function TimelineClient({
  events,
  eventType,
}: {
  events: TimelineEvent[];
  petId: string;
  dateStart: string;
  dateEnd: string;
  eventType: string;
}) {
  return (
    <div className="space-y-6">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4">
        <label htmlFor="event-type" className="text-sm font-medium">
          Olay Türü:
        </label>
        <select
          id="event-type"
          value={eventType}
          onChange={(e) => {
            const params = new URLSearchParams(window.location.search);
            if (e.target.value === "all") {
              params.delete("event_type");
            } else {
              params.set("event_type", e.target.value);
            }
            window.location.search = params.toString();
          }}
          className="rounded-lg border border-[#0d2922]/25 px-3 py-2 text-sm"
        >
          <option value="all">Tümü</option>
          <option value="appointment">Randevular</option>
          <option value="examination">Muayeneler</option>
          <option value="vaccination">Aşılar</option>
          <option value="parasite">Parazit</option>
          <option value="reminder">Hatırlatıcılar</option>
          <option value="document">Belgeler</option>
        </select>
        <span className="text-sm text-[#526a64]">
          {events.length} kayıt
        </span>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-[#526a64]">
          Bu dönem için kayıt bulunamadı.
        </div>
      ) : (
        <ol className="space-y-3" aria-label="Tıbbi zaman çizelgesi">
          {events.map((event) => (
            <li key={`${event.event_type}-${event.id}`}>
              <article className="rounded-xl border border-[#D1DBD5] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {eventTypeIcon(event.event_type)}
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        {eventTypeLabel(event.event_type)}
                      </h3>
                      <p className="mt-1 text-sm text-[#526a64]">
                        {formatDateTime(event.occurred_at)}
                      </p>
                      {event.description && (
                        <p className="mt-1 text-sm">{event.description}</p>
                      )}
                      {event.veterinarian_name && (
                        <p className="mt-1 text-xs text-[#526a64]">
                          👨‍⚕️ {event.veterinarian_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-[#DDE9E3] px-2 py-1 text-xs font-medium text-[#123A30]">
                      {statusLabel(event.status)}
                    </span>
                    {event.finalized && (
                      <span className="text-xs text-[#526a64]">✓ Onaylı</span>
                    )}
                    <Link
                      href={event.source_route}
                      className="text-sm text-[#123A30] underline hover:no-underline"
                    >
                      Detay
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}

      {/* Load more hint */}
      <div className="rounded-xl bg-[#f4f0e8] p-4 text-center text-sm text-[#526a64]">
        Daha eski kayıtları görüntülemek için tarih aralığını genişletin.
      </div>
    </div>
  );
}
