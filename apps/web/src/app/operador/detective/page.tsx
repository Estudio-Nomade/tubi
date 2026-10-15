import Link from "next/link";

import { resolveDetectiveSignalAction } from "@/application/operador/detective-actions";
import {
  AppHeader,
  BtnDanger,
  BtnPrimary,
  BtnSecondary,
  EmptyHint,
  StatusPill,
  TabBar,
} from "@/components/design";
import { createClient } from "@/lib/supabase/server";

function kindLabel(kind: string): string {
  switch (kind) {
    case "bypass_chat":
      return "Bypass chat (tel/WhatsApp)";
    case "cancel_pair":
      return "Cancelaciones en par";
    case "cancel_rate":
      return "Tasa de cancelación";
    case "commission_overdue":
      return "Comisión vencida";
    default:
      return kind;
  }
}

export default async function OperadorDetectivePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: signals } = await supabase
    .from("detective_signal")
    .select("id, kind, payload, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = signals ?? [];

  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
      <AppHeader roleLabel="Operador" />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="font-heading text-[28px] font-semibold text-foreground">
            Detective
          </h1>
          <Link
            href="/operador"
            className="text-sm font-medium text-primary"
          >
            Señas
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Señales abiertas (bypass, cancelaciones, comisión).
        </p>

        {sp.error ? (
          <p className="text-sm text-destructive" role="alert">
            {sp.error}
          </p>
        ) : null}
        {sp.ok ? (
          <p className="text-sm text-primary" role="status">
            Señal resuelta
          </p>
        ) : null}

        {!rows.length ? (
          <EmptyHint message="No hay señales abiertas." />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">
                    {kindLabel(s.kind)}
                  </p>
                  <StatusPill label="Abierta" variant="pending" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleString("es-AR")}
                </p>
                <pre className="max-h-24 overflow-auto rounded-lg bg-muted/50 p-2 text-[11px] text-muted-foreground">
                  {JSON.stringify(s.payload, null, 0)}
                </pre>
                <div className="flex flex-col gap-2">
                  <form action={resolveDetectiveSignalAction}>
                    <input type="hidden" name="signalId" value={s.id} />
                    <input type="hidden" name="status" value="ok" />
                    <BtnPrimary type="submit">OK / descartar</BtnPrimary>
                  </form>
                  <form action={resolveDetectiveSignalAction}>
                    <input type="hidden" name="signalId" value={s.id} />
                    <input type="hidden" name="status" value="warned" />
                    <BtnSecondary type="submit">Advertir</BtnSecondary>
                  </form>
                  <form action={resolveDetectiveSignalAction}>
                    <input type="hidden" name="signalId" value={s.id} />
                    <input type="hidden" name="status" value="paused" />
                    <BtnDanger type="submit">Pausar cuenta</BtnDanger>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <TabBar variant="operador" active="senas" />
    </div>
  );
}
