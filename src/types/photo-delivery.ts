export interface PhotographerProfile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface PhotoEvent {
  id: string;
  owner_id: string;
  event_name: string;
  event_date: string | null;
  venue: string | null;
  created_at: string;
}

export interface CustomerGallery {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  access_code: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  upload_key: string;
  gallery_id: string;
  original_file_name: string;
  preview_storage_path: string;
  original_storage_path: string;
  status: "uploading" | "ready" | "failed";
  captured_at: string | null;
  created_at: string;
}
