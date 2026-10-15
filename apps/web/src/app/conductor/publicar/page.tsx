import Link from "next/link";

import { publishPeerTripAction } from "@/application/conductor/publish-peer-trip-action";
import {
  AppHeader,
  AppShell,
  BtnPrimary,
  Field,
} from "@/components/design";
import { canDrive } from "@/domain/auth";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Peer trip publish form. Requires KYC + marketplace.enabled (enforced in RPC).
 */
export default async function ConductorPublicarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile({ area: "drive" });
  if (!canDrive(profile)) redirect("/conductor/kyc");

  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: rutas }, { data: vehiculos }] = await Promise.all([
    supabase.from("ruta").select("id, nombre, origen, destino").order("nombre"),
    supabase
      .from("vehiculo")
      .select("id, patente, marca, modelo")
      .eq("conductor_id", profile.id)
      .order("patente"),
  ]);

  return (
    <AppShell>
      <AppHeader showBack backHref="/conductor" roleLabel="Conducir" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          Publicar viaje
        </h1>
        <p className="text-sm text-muted-foreground">
          Ofrecé asientos en un viaje que ya vas a hacer. Precio por asiento del
          tramo completo (vos lo fijás).
        </p>
        {sp.error ? (
          <p className="text-sm text-destructive" role="alert">
            {sp.error}
          </p>
        ) : null}
        {!vehiculos?.length ? (
          <p className="text-sm text-muted-foreground">
            Primero{" "}
            <Link href="/conductor/vehiculo" className="font-semibold text-primary">
              registrá un vehículo
            </Link>
            .
          </p>
        ) : (
          <form action={publishPeerTripAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Ruta
              <select
                name="rutaId"
                required
                className="h-13 rounded-xl border border-border bg-card px-3 text-base"
              >
                {(rutas ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origen} → {r.destino}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Vehículo
              <select
                name="vehiculoId"
                required
                className="h-13 rounded-xl border border-border bg-card px-3 text-base"
              >
                {(vehiculos ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.patente} · {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Fecha" name="fecha" type="date" required />
            <Field label="Hora salida" name="hora" type="time" required />
            <Field
              label="Precio por asiento (tramo completo)"
              name="precio"
              type="number"
              inputMode="decimal"
              required
            />
            <BtnPrimary type="submit">Publicar</BtnPrimary>
          </form>
        )}
      </div>
    </AppShell>
  );
}
