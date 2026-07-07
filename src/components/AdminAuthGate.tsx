"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Photographer {
  id: string;
  displayName: string;
  isAdmin: boolean;
}

interface PhotographerProfile {
  display_name: string | null;
  is_admin: boolean;
}

/**
 * Wraps any /admin page. Redirects to /admin/login if there's no
 * session. Passes the signed-in photographer down via render props
 * so pages can use the real id instead of a placeholder.
 */
export function AdminAuthGate({
  children,
}: {
  children: (photographer: Photographer) => React.ReactNode;
}) {
  const router = useRouter();
  const [photographer, setPhotographer] = useState<Photographer | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        setChecked(true);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .rpc("ensure_photographer_profile")
        .single<PhotographerProfile>();

      if (profileError) {
        console.error("Could not create photographer profile:", profileError.message);
      }

      setPhotographer({
        id: user.id,
        displayName: profile?.display_name ?? user.email ?? "Photographer",
        isAdmin: profile?.is_admin ?? false,
      });
      setChecked(true);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!checked || !photographer) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8a8a8a",
          background: "#0a0a0a",
        }}
      >
        <p style={{ fontSize: "0.875rem" }}>Checking session…</p>
      </main>
    );
  }

  return <>{children(photographer)}</>;
}
