export interface Event {
  id: string;
  photographer_id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientGallery {
  id: string;
  event_id: string;
  photographer_id: string;
  name: string;
  access_code: string;
  notes: string | null;
  paid: boolean;
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  client_id: string;
  event_id: string;
  gallery_id: string;
  photographer_id: string;
  file_name: string;
  preview_path: string;
  original_path: string;
  upload_status: string;
  taken_at: string | null;
  created_at: string;
}
