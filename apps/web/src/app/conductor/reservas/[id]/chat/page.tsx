import {
  ensureChatThreadAction,
  sendChatMessageAction,
} from "@/application/chat/actions";
import {
  AppHeader,
  AppShell,
  BtnPrimary,
  EmptyHint,
} from "@/components/design";
import { redactBypassContent } from "@/domain/chat/bypass-filter";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ConductorChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile({ area: "drive" });
  const { id: reservaId } = await params;
  const supabase = await createClient();

  const { data: res } = await supabase
    .from("reserva")
    .select("id, estado, viaje_id, viaje:viaje!inner(conductor_id)")
    .eq("id", reservaId)
    .maybeSingle();

  const viaje = res
    ? Array.isArray(res.viaje)
      ? res.viaje[0]
      : res.viaje
    : null;
  if (!res || !viaje || viaje.conductor_id !== profile.id) {
    redirect("/conductor");
  }
  if (!["confirmada", "verificada", "abordada"].includes(res.estado)) {
    redirect(`/conductor/viajes/${res.viaje_id}`);
  }

  const ensured = await ensureChatThreadAction(reservaId);
  if (ensured.error || !ensured.threadId) {
    return (
      <AppShell>
        <AppHeader
          showBack
          backHref={`/conductor/viajes/${res.viaje_id}`}
          roleLabel="Conducir"
        />
        <EmptyHint message={ensured.error ?? "Chat no disponible"} />
      </AppShell>
    );
  }

  const { data: messages } = await supabase
    .from("chat_message")
    .select("id, body, sender_id, created_at, flagged_bypass")
    .eq("thread_id", ensured.threadId)
    .order("created_at", { ascending: true });

  return (
    <AppShell>
      <AppHeader
        showBack
        backHref={`/conductor/viajes/${res.viaje_id}`}
        roleLabel="Conducir"
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="px-5 py-2 text-xs text-muted-foreground">
          Único canal de contacto. No compartas WhatsApp ni teléfonos.
        </p>
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-3">
          {(messages ?? []).map((m) => {
            const mine = m.sender_id === profile.id;
            const text = m.flagged_bypass
              ? redactBypassContent(m.body)
              : m.body;
            return (
              <li
                key={m.id}
                className={
                  mine
                    ? "ml-8 rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-8 rounded-2xl bg-muted px-3 py-2 text-sm text-foreground"
                }
              >
                {text}
              </li>
            );
          })}
        </ul>
        <form
          action={sendChatMessageAction}
          className="flex gap-2 border-t border-border p-3"
        >
          <input type="hidden" name="threadId" value={ensured.threadId} />
          <input type="hidden" name="reservaId" value={reservaId} />
          <input
            name="body"
            required
            maxLength={2000}
            placeholder="Escribí un mensaje…"
            className="h-12 flex-1 rounded-xl border border-border bg-card px-3 text-sm"
          />
          <BtnPrimary type="submit" className="w-auto shrink-0 px-4">
            Enviar
          </BtnPrimary>
        </form>
      </div>
    </AppShell>
  );
}
