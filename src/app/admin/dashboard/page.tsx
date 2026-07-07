"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminAuthGate } from "@/components/AdminAuthGate";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface EventRow {
  id: string;
  name: string;
  starts_at: string | null;
}

interface GalleryRow {
  id: string;
  event_id: string;
  name: string;
  access_code: string;
  paid: boolean;
  paid_at: string | null;
  photo_count: number;
}

export default function DashboardPage() {
  return (
    <AdminAuthGate>
      {(photographer) => (
        <DashboardScreen photographerId={photographer.id} displayName={photographer.displayName} />
      )}
    </AdminAuthGate>
  );
}

function DashboardScreen({
  photographerId,
  displayName,
}: {
  photographerId: string;
  displayName: string;
}) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, name, starts_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setStatus(`Could not load events: ${error.message}`);
    }

    setEvents(data ?? []);
    setLoadingEvents(false);

    if (!selectedEventId && data?.[0]) {
      setSelectedEventId(data[0].id);
    }
  }, [selectedEventId]);

  const loadGalleries = useCallback(async () => {
    if (!selectedEventId) {
      setRows([]);
      return;
    }

    const term = search.trim().toUpperCase();
    setLoadingRows(true);
    const supabase = createClient();

    let query = supabase
      .from("client_galleries")
      .select("id, event_id, name, access_code, paid, paid_at")
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (term) {
      query = supabase
        .from("client_galleries")
        .select("id, event_id, name, access_code, paid, paid_at")
        .eq("event_id", selectedEventId)
        .or(`access_code.ilike.%${term}%,name.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(100);
    }

    const { data: galleries, error } = await query;
    if (error || !galleries) {
      setRows([]);
      setStatus(`Could not load client galleries: ${error?.message ?? "No galleries returned"}`);
      setLoadingRows(false);
      return;
    }

    const ids = galleries.map((gallery) => gallery.id);
    const { data: photos } = await supabase
      .from("photos")
      .select("gallery_id")
      .in("gallery_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const counts = new Map<string, number>();
    for (const photo of photos ?? []) {
      counts.set(photo.gallery_id, (counts.get(photo.gallery_id) ?? 0) + 1);
    }

    setRows(
      galleries.map((gallery) => ({
        ...gallery,
        photo_count: counts.get(gallery.id) ?? 0,
      }))
    );
    setLoadingRows(false);
  }, [search, selectedEventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGalleries();
  }, [loadGalleries]);

  async function createEvent() {
    const name = eventName.trim();
    if (!name) {
      setStatus("Enter an event name first.");
      return;
    }

    setCreatingEvent(true);
    setStatus(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({ name, photographer_id: photographerId })
      .select("id, name, starts_at")
      .single();

    setCreatingEvent(false);

    if (error || !data) {
      setStatus(`Could not create the event: ${error?.message ?? "No event returned"}`);
      return;
    }

    setEvents((prev) => [data, ...prev]);
    setSelectedEventId(data.id);
    setEventName("");
    setStatus(`Event created: ${data.name}`);
  }

  async function togglePaid(row: GalleryRow) {
    setUpdating(row.id);
    const supabase = createClient();
    const nextPaid = !row.paid;
    const paidAt = nextPaid ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("client_galleries")
      .update({
        paid: nextPaid,
        paid_at: paidAt,
        paid_by: nextPaid ? photographerId : null,
      })
      .eq("id", row.id);

    if (!error) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, paid: nextPaid, paid_at: paidAt } : r))
      );
    }

    setUpdating(null);
  }

  return (
    <main className={styles.main}>
      <AdminNav displayName={displayName} active="dashboard" />

      <h1 className={styles.h1}>Events</h1>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Event</div>
        <div className={styles.cardBody}>
          <div className={styles.inlineRow}>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={loadingEvents}
              className={styles.select}
            >
              <option value="">{loadingEvents ? "Loading events..." : "Select an event"}</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inlineRow}>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="New event name"
              className={styles.searchInput}
            />
            <button
              type="button"
              onClick={() => void createEvent()}
              disabled={creatingEvent}
              className={styles.searchButton}
            >
              {creatingEvent ? "Creating..." : "Create event"}
            </button>
          </div>
        </div>
      </div>

      {status && <p className={styles.status}>{status}</p>}

      <div className={styles.searchRow}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && loadGalleries()}
          placeholder="Search gallery or access code..."
          className={styles.searchInput}
        />
        <button type="button" onClick={() => void loadGalleries()} className={styles.searchButton}>
          Search
        </button>
      </div>

      {loadingRows ? (
        <p className={styles.empty}>Loading...</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No client galleries found.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Gallery</th>
                <th className={styles.th}>Access Code</th>
                <th className={styles.th}>Photos</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  <td className={styles.td}>{row.name}</td>
                  <td className={styles.tdCode}>{row.access_code}</td>
                  <td className={styles.tdCount}>{row.photo_count}</td>
                  <td className={styles.td}>
                    <span className={row.paid ? styles.badgePaid : styles.badgeUnpaid}>
                      {row.paid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className={styles.tdRight}>
                    <button
                      type="button"
                      onClick={() => togglePaid(row)}
                      disabled={updating === row.id}
                      className={styles.toggleButton}
                    >
                      {updating === row.id ? "..." : row.paid ? "Mark unpaid" : "Mark paid"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
