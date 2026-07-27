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
    let isMounted = true;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // A missing session is the normal signed-out state, especially after
        // moving to a new Supabase project. Redirect without logging it as an
        // application error or making an unnecessary Auth request.
        if (!session) {
          if (isMounted) {
            router.replace("/admin/login");
            setChecked(true);
          }
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError && userError.name !== "AuthSessionMissingError") {
          console.error("Could not read admin session:", userError.message);
        }

        if (!user) {
          if (isMounted) {
            router.replace("/admin/login");
            setChecked(true);
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .rpc("ensure_photographer_profile")
          .single<PhotographerProfile>();

        if (profileError) {
          console.error("Could not create photographer profile:", profileError.message);
        }

        if (isMounted) {
          setPhotographer({
            id: user.id,
            displayName: profile?.display_name ?? user.email ?? "Photographer",
            isAdmin: profile?.is_admin ?? false,
          });
          setChecked(true);
        }
      } catch (err) {
        console.error("Admin auth initialization failed:", err);
        if (isMounted) {
          setChecked(true);
          setPhotographer(null);
          router.replace("/admin/login");
        }
      }
    }

    load();

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") router.replace("/admin/login");
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error("Admin auth listener setup failed:", err);
      return () => {
        isMounted = false;
      };
    }
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
