"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

/**
 * Fallback when Supabase redirects with tokens in the URL hash (implicit flow).
 * Server routes cannot read the hash; this page finishes the session client-side.
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando tu cuenta…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const href = window.location.href;
      const url = new URL(href);

      // Query params (token_hash) — in case we landed here from server handoff
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as "signup" | "email" | "magiclink" | "recovery" | "invite" | "email_change",
          token_hash: tokenHash,
        });
        if (cancelled) return;
        if (error) {
          setMessage("No se pudo confirmar. Probá el link de nuevo o pedí otro mail.");
          return;
        }
        router.replace("/pasajero");
        return;
      }

      // Hash tokens: #access_token=...&refresh_token=...
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (error) {
            setMessage("No se pudo confirmar. Probá el link de nuevo.");
            return;
          }
          // Clear hash from address bar
          window.history.replaceState(null, "", "/auth/confirm");
          router.replace("/pasajero");
          return;
        }
      }

      // detectSessionInUrl on browser client may already have parsed the hash
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        router.replace("/pasajero");
        return;
      }

      setMessage("No encontramos datos de confirmación. Abrí el link del mail otra vez.");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 overflow-y-auto overscroll-y-contain px-5">
      <p className="text-center text-sm font-medium text-foreground">{message}</p>
    </main>
  );
}
