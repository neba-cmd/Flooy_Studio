"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
  customer_email: string;
  customer_phone: string;
}

interface PhotoRow {
  id: string;
  photographer_id: string;
  file_name: string;
  preview_path: string;
  original_path: string;
}

interface PhotographerRow {
  id: string;
  display_name: string;
  email: string;
  photo_count: number;
}

interface DashboardStats {
  galleries: number;
  photos: number;
  paidGalleries: number;
  paidPhotos: number;
}

const EMPTY_STATS: DashboardStats = {
  galleries: 0,
  photos: 0,
  paidGalleries: 0,
  paidPhotos: 0,
};

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
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [photographers, setPhotographers] = useState<PhotographerRow[]>([]);
  const [openGalleryId, setOpenGalleryId] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, PhotoRow[]>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loadingGallery, setLoadingGallery] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("photo_events")
      .select("id, name:event_name, starts_at:event_date")
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
      setStats(EMPTY_STATS);
      setPhotographers([]);
      return;
    }

    const term = search.trim().toUpperCase();
    setLoadingRows(true);
    const supabase = createClient();

    const { data: allGalleries, error: allGalleriesError } = await supabase
      .from("customer_galleries")
      .select(
        "id, event_id, name:customer_name, access_code, paid:is_paid, paid_at, customer_email, customer_phone"
      )
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (allGalleriesError || !allGalleries) {
      setRows([]);
      setStats(EMPTY_STATS);
      setStatus(
        `Could not load client galleries: ${allGalleriesError?.message ?? "No galleries returned"}`
      );
      setLoadingRows(false);
      return;
    }

    const ids = allGalleries.map((gallery) => gallery.id);
    const [photosResult, profilesResult] = await Promise.all([
      supabase
        .from("gallery_photos")
        .select("gallery_id, photographer_id")
        .in("gallery_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("photographer_profiles")
        .select("id, display_name, email")
        .order("display_name"),
    ]);

    if (photosResult.error || profilesResult.error) {
      setStatus(
        `Could not load company statistics: ${
          photosResult.error?.message ?? profilesResult.error?.message
        }`
      );
    }

    const photos = photosResult.data ?? [];
    const profiles = profilesResult.data ?? [];

    const counts = new Map<string, number>();
    const photographerCounts = new Map<string, number>();
    for (const photo of photos) {
      counts.set(photo.gallery_id, (counts.get(photo.gallery_id) ?? 0) + 1);
      if (photo.photographer_id) {
        photographerCounts.set(
          photo.photographer_id,
          (photographerCounts.get(photo.photographer_id) ?? 0) + 1
        );
      }
    }

    setPhotographers(
      profiles.map((profile) => ({
        ...profile,
        photo_count: photographerCounts.get(profile.id) ?? 0,
      }))
    );

    const galleries = term
      ? allGalleries.filter(
          (gallery) =>
            gallery.access_code.toUpperCase().includes(term) ||
            gallery.name.toUpperCase().includes(term)
        )
      : allGalleries;

    setStats({
      galleries: allGalleries.length,
      photos: photos.length,
      paidGalleries: allGalleries.filter((gallery) => gallery.paid).length,
      paidPhotos: allGalleries.reduce(
        (total, gallery) => total + (gallery.paid ? counts.get(gallery.id) ?? 0 : 0),
        0
      ),
    });
    setRows(
      galleries.map((gallery) => ({
        ...gallery,
        photo_count: counts.get(gallery.id) ?? 0,
      }))
    );
    setLoadingRows(false);
  }, [search, selectedEventId]);

  async function openGallery(row: GalleryRow) {
    if (openGalleryId === row.id) {
      setOpenGalleryId(null);
      return;
    }

    setOpenGalleryId(row.id);
    if (galleryPhotos[row.id]) return;

    setLoadingGallery(row.id);
    setStatus(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gallery_photos")
      .select(
        "id, photographer_id, file_name:original_file_name, preview_path:preview_storage_path, original_path:original_storage_path"
      )
      .eq("gallery_id", row.id)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(`Could not open ${row.name}: ${error.message}`);
      setLoadingGallery(null);
      return;
    }

    const photos = (data ?? []) as PhotoRow[];
    setGalleryPhotos((current) => ({ ...current, [row.id]: photos }));

    if (photos.length) {
      const { data: signed, error: signError } = await supabase.storage
        .from("photo-previews")
        .createSignedUrls(
          photos.map((photo) => photo.preview_path),
          3600
        );

      if (signError) {
        setStatus(`Gallery opened, but previews could not load: ${signError.message}`);
      } else {
        const urls: Record<string, string> = {};
        photos.forEach((photo, index) => {
          const url = signed?.[index]?.signedUrl;
          if (url) urls[photo.id] = url;
        });
        setPreviewUrls((current) => ({ ...current, ...urls }));
      }
    }
    setLoadingGallery(null);
  }

  async function downloadPhotos(row: GalleryRow, photos: PhotoRow[], photo?: PhotoRow) {
    const selected = photo ? [photo] : photos;
    if (!selected.length) return;

    setDownloading(photo?.id ?? row.id);
    setStatus(null);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("photo-originals")
      .createSignedUrls(
        selected.map((item) => item.original_path),
        300,
        { download: true }
      );

    if (error) {
      setStatus(`Could not prepare the download: ${error.message}`);
      setDownloading(null);
      return;
    }

    data?.forEach((item, index) => {
      if (!item.signedUrl) return;
      const signedUrl = item.signedUrl;
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = signedUrl;
        link.download = selected[index]?.file_name ?? "";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 250);
    });
    setStatus(
      selected.length === 1
        ? `Downloading ${selected[0].file_name}.`
        : `Starting ${selected.length} downloads from ${row.name}. Your browser may ask for permission to download multiple files.`
    );
    setDownloading(null);
  }

  async function deleteStorageFiles(photos: PhotoRow[]) {
    if (!photos.length) return;
    const supabase = createClient();
    const [previewResult, originalResult] = await Promise.all([
      supabase.storage
        .from("photo-previews")
        .remove(photos.map((photo) => photo.preview_path)),
      supabase.storage
        .from("photo-originals")
        .remove(photos.map((photo) => photo.original_path)),
    ]);

    if (previewResult.error || originalResult.error) {
      throw new Error(previewResult.error?.message ?? originalResult.error?.message);
    }
  }

  async function deletePhoto(row: GalleryRow, photo: PhotoRow) {
    if (
      !window.confirm(
        `Permanently delete "${photo.file_name}"? This removes the preview and original photo.`
      )
    ) {
      return;
    }

    setDeleting(photo.id);
    setStatus(null);
    try {
      await deleteStorageFiles([photo]);
      const supabase = createClient();
      const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);
      if (error) throw error;

      setGalleryPhotos((current) => ({
        ...current,
        [row.id]: (current[row.id] ?? []).filter((item) => item.id !== photo.id),
      }));
      setPreviewUrls((current) => {
        const next = { ...current };
        delete next[photo.id];
        return next;
      });
      setStatus(`Deleted ${photo.file_name}.`);
      await loadGalleries();
    } catch (error) {
      setStatus(
        `Could not completely delete the photo: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setDeleting(null);
    }
  }

  async function deleteGallery(row: GalleryRow, loadedPhotos: PhotoRow[]) {
    if (
      !window.confirm(
        `Permanently delete the "${row.name}" folder and all ${row.photo_count} photos inside it?`
      )
    ) {
      return;
    }

    setDeleting(row.id);
    setStatus(null);
    try {
      let photos = loadedPhotos;
      if (photos.length !== row.photo_count) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("gallery_photos")
          .select(
            "id, photographer_id, file_name:original_file_name, preview_path:preview_storage_path, original_path:original_storage_path"
          )
          .eq("gallery_id", row.id);
        if (error) throw error;
        photos = (data ?? []) as PhotoRow[];
      }

      await deleteStorageFiles(photos);
      const supabase = createClient();
      const { error } = await supabase.from("customer_galleries").delete().eq("id", row.id);
      if (error) throw error;

      setRows((current) => current.filter((gallery) => gallery.id !== row.id));
      setGalleryPhotos((current) => {
        const next = { ...current };
        delete next[row.id];
        return next;
      });
      setOpenGalleryId(null);
      setStatus(`Deleted the ${row.name} folder and its ${photos.length} photos.`);
      await loadGalleries();
    } catch (error) {
      setStatus(
        `Could not completely delete the folder: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setDeleting(null);
    }
  }

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
      .from("photo_events")
      .insert({ event_name: name, owner_id: photographerId })
      .select("id, name:event_name, starts_at:event_date")
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
      .from("customer_galleries")
      .update({
        is_paid: nextPaid,
        paid_at: paidAt,
      })
      .eq("id", row.id);

    if (!error) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, paid: nextPaid, paid_at: paidAt } : r))
      );
      setStats((current) => ({
        ...current,
        paidGalleries: current.paidGalleries + (nextPaid ? 1 : -1),
        paidPhotos: current.paidPhotos + (nextPaid ? row.photo_count : -row.photo_count),
      }));
    } else {
      setStatus(`Could not update payment status: ${error.message}`);
    }

    setUpdating(null);
  }

  return (
    <main className={styles.main}>
      <AdminNav displayName={displayName} active="dashboard" />

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Admin overview</p>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.subtitle}>
            {selectedEvent ? `Showing activity for ${selectedEvent.name}` : "Select an event to begin"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadGalleries()}
          disabled={!selectedEventId || loadingRows}
          className={styles.secondaryButton}
        >
          {loadingRows ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section className={styles.statsGrid} aria-label="Event statistics">
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Uploaded photos</span>
          <strong className={styles.statValue}>{stats.photos.toLocaleString()}</strong>
          <span className={styles.statDetail}>Full gallery total</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Paid galleries</span>
          <strong className={styles.statValue}>{stats.paidGalleries.toLocaleString()}</strong>
          <span className={styles.statDetail}>of {stats.galleries} galleries</span>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>Photos paid for</span>
          <strong className={styles.statValue}>{stats.paidPhotos.toLocaleString()}</strong>
          <span className={styles.statDetail}>Inside paid galleries</span>
        </article>
      </section>

      <section className={styles.teamSection} aria-labelledby="event-photographers">
        <div className={styles.galleryHeader}>
          <div>
            <h2 id="event-photographers" className={styles.sectionTitle}>
              Photographers
            </h2>
            <p className={styles.sectionSubtitle}>
              Company team activity for this event only.
            </p>
          </div>
        </div>
        <div className={styles.photographerGrid}>
          {photographers.map((photographer) => (
            <article key={photographer.id} className={styles.photographerCard}>
              <div>
                <strong className={styles.photographerName}>{photographer.display_name}</strong>
                <span className={styles.photographerEmail}>{photographer.email}</span>
              </div>
              <strong className={styles.photographerCount}>{photographer.photo_count}</strong>
              <span className={styles.photographerCountLabel}>photos</span>
            </article>
          ))}
        </div>
      </section>

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

      <div className={styles.galleryHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Client galleries</h2>
          <p className={styles.sectionSubtitle}>Open a gallery to preview or download its photos.</p>
        </div>
      </div>

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
              {rows.map((row) => {
                const photos = galleryPhotos[row.id] ?? [];
                const isOpen = openGalleryId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className={styles.row}>
                      <td className={styles.td}>
                        <button
                          type="button"
                          onClick={() => void openGallery(row)}
                          className={styles.galleryNameButton}
                          aria-expanded={isOpen}
                        >
                          <span>{row.name}</span>
                          <span className={styles.viewHint}>{isOpen ? "Close" : "View gallery"}</span>
                        </button>
                      </td>
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
                          onClick={() => void togglePaid(row)}
                          disabled={updating === row.id}
                          className={styles.toggleButton}
                        >
                          {updating === row.id ? "..." : row.paid ? "Mark unpaid" : "Mark paid"}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${row.id}-gallery`} className={styles.expandedRow}>
                        <td colSpan={5} className={styles.expandedCell}>
                          <div className={styles.expandedHeader}>
                            <div>
                              <h3 className={styles.expandedTitle}>{row.name}</h3>
                              <p className={styles.expandedMeta}>
                                {row.photo_count} {row.photo_count === 1 ? "photo" : "photos"} · Code{" "}
                                {row.access_code}
                              </p>
                              <p className={styles.expandedMeta}>
                                {row.customer_phone} · {row.customer_email}
                              </p>
                            </div>
                            <div className={styles.galleryActions}>
                              <button
                                type="button"
                                onClick={() => void downloadPhotos(row, photos)}
                                disabled={!photos.length || downloading === row.id}
                                className={styles.downloadAllButton}
                              >
                                {downloading === row.id ? "Preparing…" : "Download all"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteGallery(row, photos)}
                                disabled={deleting !== null}
                                className={styles.deleteButton}
                              >
                                {deleting === row.id ? "Deleting…" : "Delete folder"}
                              </button>
                            </div>
                          </div>
                          {loadingGallery === row.id ? (
                            <p className={styles.empty}>Loading gallery…</p>
                          ) : photos.length === 0 ? (
                            <p className={styles.empty}>This gallery has no uploaded photos yet.</p>
                          ) : (
                            <div className={styles.photoGrid}>
                              {photos.map((photo) => (
                                <article key={photo.id} className={styles.photoCard}>
                                  <div className={styles.photoFrame}>
                                    {previewUrls[photo.id] ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={previewUrls[photo.id]}
                                        alt={photo.file_name}
                                        className={styles.photo}
                                      />
                                    ) : (
                                      <span className={styles.photoPlaceholder}>Loading…</span>
                                    )}
                                  </div>
                                  <div className={styles.photoFooter}>
                                    <div className={styles.photoDetails}>
                                      <span className={styles.fileName} title={photo.file_name}>
                                        {photo.file_name}
                                      </span>
                                      <span className={styles.photoByline}>
                                        Taken by{" "}
                                        {photographers.find(
                                          (photographer) => photographer.id === photo.photographer_id
                                        )?.display_name ?? "Photographer"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => void downloadPhotos(row, photos, photo)}
                                      disabled={downloading === photo.id || deleting === photo.id}
                                      className={styles.iconButton}
                                      aria-label={`Download ${photo.file_name}`}
                                    >
                                      {downloading === photo.id ? "…" : "↓"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void deletePhoto(row, photo)}
                                      disabled={deleting !== null}
                                      className={styles.deleteIconButton}
                                      aria-label={`Delete ${photo.file_name}`}
                                    >
                                      {deleting === photo.id ? "…" : "×"}
                                    </button>
                                  </div>
                                </article>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
