"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminAuthGate } from "@/components/AdminAuthGate";
import { AdminNav } from "@/components/AdminNav";
import { DropZone } from "@/components/DropZone";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface EventRow {
  id: string;
  name: string;
  starts_at: string | null;
}

interface ClientGalleryRow {
  id: string;
  event_id: string;
  name: string;
  access_code: string;
  customer_email: string;
  customer_phone: string;
}

export default function AdminPage() {
  return (
    <AdminAuthGate>
      {(photographer) => (
        <UploadScreen photographerId={photographer.id} displayName={photographer.displayName} />
      )}
    </AdminAuthGate>
  );
}

function UploadScreen({
  photographerId,
  displayName,
}: {
  photographerId: string;
  displayName: string;
}) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [galleries, setGalleries] = useState<ClientGalleryRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedGalleryId, setSelectedGalleryId] = useState("");
  const [newGalleryName, setNewGalleryName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingGalleries, setLoadingGalleries] = useState(false);
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(0);
  const { counts, isOnline, addPhotos } = useUploadQueue(photographerId);

  const selectedGallery = galleries.find((gallery) => gallery.id === selectedGalleryId);
  const canDrop = Boolean(selectedEventId && selectedGalleryId);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError(null);

    const supabase = createClient();
    const { data, error: eventError } = await supabase
      .from("photo_events")
      .select("id, name:event_name, starts_at:event_date")
      .order("created_at", { ascending: false })
      .limit(100);

    setLoadingEvents(false);

    if (eventError) {
      setEvents([]);
      setError(`Could not load events: ${eventError.message}`);
      return;
    }

    setEvents(data ?? []);
  }, []);

  const loadGalleries = useCallback(async (eventId: string) => {
    if (!eventId) {
      setGalleries([]);
      setSelectedGalleryId("");
      return;
    }

    setLoadingGalleries(true);
    setError(null);

    const supabase = createClient();
    const { data, error: galleryError } = await supabase
      .from("customer_galleries")
      .select("id, event_id, name:customer_name, access_code, customer_email, customer_phone")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(200);

    setLoadingGalleries(false);

    if (galleryError) {
      setGalleries([]);
      setSelectedGalleryId("");
      setError(`Could not load client galleries: ${galleryError.message}`);
      return;
    }

    setGalleries(data ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGalleries(selectedEventId);
  }, [selectedEventId, loadGalleries]);

  async function createGallery() {
    const name = newGalleryName.trim();
    if (!selectedEventId) {
      setStatus("Select an event first.");
      return;
    }
    if (!name) {
      setStatus("Enter the customer's name first.");
      return;
    }
    if (!customerEmail.trim() || !customerPhone.trim()) {
      setStatus("Enter the customer's email and phone number.");
      return;
    }

    setCreatingGallery(true);
    setStatus(null);
    setError(null);

    const supabase = createClient();
    let created: ClientGalleryRow | null = null;
    let createMessage = "Could not create the customer gallery.";
    for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
      const { data, error: createError } = await supabase
        .from("customer_galleries")
        .insert({
          event_id: selectedEventId,
          customer_name: name,
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.trim(),
        })
        .select(
          "id, event_id, name:customer_name, access_code, customer_email, customer_phone"
        )
        .single<ClientGalleryRow>();
      if (data) created = data;
      if (createError) {
        createMessage = createError.message;
        if (createError.code !== "23505") break;
      }
    }

    setCreatingGallery(false);

    if (!created) {
      setError(createMessage);
      return;
    }

    setGalleries((prev) => [created, ...prev]);
    setSelectedGalleryId(created.id);
    setNewGalleryName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setStatus(`Client gallery created. Access code: ${created.access_code}`);
  }

  return (
    <main className={styles.main}>
      <AdminNav displayName={displayName} active="upload" />

      <header className={styles.header}>
        <h1 className={styles.h1}>Upload</h1>
        <span className={`${styles.pill} ${isOnline ? styles.pillOnline : styles.pillOffline}`}>
          <span className={`${styles.dot} ${isOnline ? styles.dotOnline : styles.dotOffline}`} />
          {isOnline ? "Online" : "Offline"}
        </span>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Event</h2>
        <div className={styles.controlRow}>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setSelectedGalleryId("");
            }}
            disabled={loadingEvents}
            className={styles.select}
          >
            <option value="">{loadingEvents ? "Loading events..." : "Select event"}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadEvents()}
            disabled={loadingEvents}
            className={styles.secondaryButton}
          >
            Refresh
          </button>
        </div>
        {!loadingEvents && events.length === 0 && (
          <p className={styles.hint}>
            No events yet. Create one in{" "}
            <Link href="/admin/dashboard" className={styles.inlineLink}>
              Dashboard
            </Link>
            , then come back to upload.
          </p>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Customer Gallery</h2>
        <div className={styles.controlRow}>
          <select
            value={selectedGalleryId}
            onChange={(e) => setSelectedGalleryId(e.target.value)}
            disabled={!selectedEventId || loadingGalleries}
            className={styles.select}
          >
            <option value="">
              {loadingGalleries ? "Loading galleries..." : "Select customer gallery"}
            </option>
            {galleries.map((gallery) => (
              <option key={gallery.id} value={gallery.id}>
                {gallery.name} ({gallery.access_code})
              </option>
            ))}
          </select>
        </div>
        <div className={styles.controlRow}>
          <input
            value={newGalleryName}
            onChange={(e) => setNewGalleryName(e.target.value)}
            placeholder="Customer's full name"
            disabled={!selectedEventId}
            className={styles.textInput}
          />
        </div>
        <div className={styles.controlRow}>
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            autoComplete="email"
            disabled={!selectedEventId}
            className={styles.textInput}
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            autoComplete="tel"
            disabled={!selectedEventId}
            className={styles.textInput}
          />
        </div>
        <button
          type="button"
          onClick={() => void createGallery()}
          disabled={!selectedEventId || creatingGallery}
          className={styles.createCustomerButton}
        >
          {creatingGallery ? "Creating customer…" : "Create customer & generate code"}
        </button>
        {selectedGallery && (
          <p className={styles.accessCode}>
            Access code: <strong>{selectedGallery.access_code}</strong>
          </p>
        )}
      </section>

      {status && <p className={styles.success}>{status}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <DropZone
        disabled={!canDrop}
        onFiles={async (files) => {
          await addPhotos(files, selectedEventId, selectedGalleryId);
          setJustAdded(files.length);
          setTimeout(() => setJustAdded(0), 2000);
        }}
      />
      {!canDrop && <p className={styles.hint}>Select an event and client gallery before dropping photos.</p>}
      {justAdded > 0 && (
        <p className={styles.success}>
          Saved {justAdded} photo{justAdded > 1 ? "s" : ""} to this device.
        </p>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Queue on this device</h2>
        <div className={styles.statGrid}>
          <div>
            <div className={`${styles.statValue} ${styles.statValueAmber}`}>{counts.queued}</div>
            <div className={styles.statLabel}>Waiting</div>
          </div>
          <div>
            <div className={`${styles.statValue} ${styles.statValueBlue}`}>
              {counts.uploading}
            </div>
            <div className={styles.statLabel}>Uploading</div>
          </div>
          <div>
            <div className={`${styles.statValue} ${styles.statValueNeutral}`}>
              {counts.uploaded}
            </div>
            <div className={styles.statLabel}>Sent</div>
          </div>
        </div>
        {counts.queued > 0 && !isOnline && (
          <p className={styles.offlineNote}>
            No connection — photos are saved and will upload automatically once you&apos;re back
            online.
          </p>
        )}
      </section>
    </main>
  );
}
