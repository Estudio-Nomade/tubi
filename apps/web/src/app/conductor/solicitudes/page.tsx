import Link from "next/link";
import { redirect } from "next/navigation";

import {
  aceptarSolicitudAction,
  rechazarSolicitudAction,
} from "@/application/reservas/request-actions";
import {
  AppHeader,
  AppShell,
  BtnDanger,
  BtnPrimary,
  EmptyHint,
} from "@/components/design";
import { canDrive } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";

export default async function ConductorSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const profile = await requireProfile({ area: "drive" });
  if (!canDrive(profile)) redirect("/conductor/kyc");

  const sp = await searchParams;
  const supabase = await createClient();

  const { data: viajes } = await supabase
    .from("viaje")
    .select("id")
    .eq("conductor_id", profile.id)
    .in("estado", ["programado", "recogida"]);

  const viajeIds = (viajes ?? []).map((v) => v.id);
  let rows: Array<{
    id: string;
    monto_sena: number;
    request_expires_at: string | null;
    viaje_id: string;
    pasajero: { nombre: string; apellido: string } | null;
  }> = [];

  if (viajeIds.length) {
    const { data } = await supabase
      .from("reserva")
      .select(
        `
        id,
        monto_sena,
        request_expires_at,
        viaje_id,
        pasajero:profiles!reserva_pasajero_id_fkey ( nombre, apellido )
      `,
      )
      .in("viaje_id", viajeIds)
      .eq("request_status", "requested")
      .order("created_at", { ascending: true });

    rows = (data ?? []).map((r) => {
      const p = Array.isArray(r.pasajero) ? r.pasajero[0] : r.pasajero;
      return {
        id: r.id,
        monto_sena: Number(r.monto_sena),
        request_expires_at: r.request_expires_at,
        viaje_id: r.viaje_id,
        pasajero: p ? { nombre: p.nombre, apellido: p.apellido } : null,
      };
    });
  }

  return (
    <AppShell>
      <AppHeader showBack backHref="/conductor" roleLabel="Conducir" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          Solicitudes
        </h1>
        {sp.error ? (
          <p className="text-sm text-destructive" role="alert">
            {sp.error}
          </p>
        ) : null}
        {sp.ok ? (
          <p className="text-sm text-primary">Solicitud aceptada</p>
        ) : null}
        {!rows.length ? (
          <EmptyHint message="No hay solicitudes pendientes." />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <p className="font-semibold text-foreground">
                  {r.pasajero
                    ? `${r.pasajero.nombre} ${r.pasajero.apellido}`
                    : "Pasajero"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Seña: ${r.monto_sena.toLocaleString("es-AR")}
                </p>
                <div className="flex flex-col gap-2">
                  <form action={aceptarSolicitudAction}>
                    <input type="hidden" name="reservaId" value={r.id} />
                    <BtnPrimary type="submit">Aceptar</BtnPrimary>
                  </form>
                  <form action={rechazarSolicitudAction}>
                    <input type="hidden" name="reservaId" value={r.id} />
                    <BtnDanger type="submit">Rechazar</BtnDanger>
                  </form>
                </div>
                <Link
                  href={`/conductor/viajes/${r.viaje_id}`}
                  className="text-center text-sm font-medium text-primary"
                >
                  Ver viaje
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
