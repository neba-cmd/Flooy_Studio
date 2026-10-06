# Magic Portfolio

Magic Portfolio is a responsive photography portfolio and event photo delivery system that is created for Flooy Studio. It combines a public-facing portfolio with a protected workflow that lets photographers inside Flooy Studio organize events, create client galleries, upload photos, and control access to full-resolution downloads.

## What the system does

- Presents the photographer's profile, work, projects, and gallery in a customizable portfolio.
- Provides authenticated admin pages for photographers to create events and manage client galleries.
- Assigns an access code to each client gallery so clients can privately find their event photos.
- Stores preview and original images separately, allowing clients to browse previews before payment.
- Lets photographers mark a gallery as paid, which unlocks full-resolution photo downloads for the client.
- Supports queued, offline-friendly uploads with browser-side image processing and synchronization when connectivity returns.
- Includes responsive layouts, configurable content, SEO metadata, sitemap generation, and dynamic Open Graph images.

## Tech stack

- **Framework:** Next.js 
- **UI:** React Once UI
- **Language:** TypeScript
- **Styling:** Sass/SCSS, CSS Modules, and Once UI design tokens
- **Backend:** Supabase Postgres, Auth, Storage, Row Level Security, and database RPC functions
- **Offline storage and upload queue:** Dexie with IndexedDB
- **Content:** MDX, `next-mdx-remote`, and Gray Matter



### SEO
- Automatic open-graph and X image generation with next/og
- Automatic schema and metadata generation based on the content file

### Design
- Responsive layout optimized for all screen sizes
- Timeless design without heavy animations and motion
- Endless customization options through [data attributes](https://once-ui.com/docs/theming)
