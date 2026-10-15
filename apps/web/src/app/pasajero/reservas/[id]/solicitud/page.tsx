import Link from "next/link";

import {
  AppHeader,
  AppShell,
  BtnPrimary,
  BtnSecondary,
  StatusPill,
} from "@/components/design";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function statusLabel(status: string): string {
  switch (status) {
    case "requested":
      return "Esperando al conductor";
    case "accepted":
      return "Aceptada — pagá la seña";
    case "rejected":
      return "Rechazada";
    case "expired":
      return "Vencida";
    default:
      return status;
  }
}

export default async function SolicitudStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile(["pasajero"]);
  const { id } = await params;
  const supabase = await createClient();

  const { data: res } = await supabase
    .from("reserva")
    .select(
      "id, estado, request_status, monto_sena, request_expires_at, deposit_pay_expires_at, viaje_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!res) redirect("/pasajero/reservas");

  const status = res.request_status ?? "legacy";
  const variant =
    status === "accepted"
      ? "ok"
      : status === "rejected" || status === "expired"
        ? "danger"
        : status === "requested"
          ? "pending"
          : "neutral";

  return (
    <AppShell>
      <AppHeader showBack backHref="/pasajero/reservas" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-6">
        <h1 className="font-heading text-[28px] font-semibold text-foreground">
          Tu solicitud
        </h1>
        <StatusPill label={statusLabel(status)} variant={variant} />
        <p className="text-sm text-muted-foreground">
          Seña estimada:{" "}
          <span className="font-semibold text-foreground">
            ${Number(res.monto_sena).toLocaleString("es-AR")}
          </span>
        </p>
        {status === "accepted" ? (
          <BtnPrimary asChild>
            <Link href={`/pasajero/reservas/${id}/sena`}>Pagar seña</Link>
          </BtnPrimary>
        ) : null}
        {res.estado === "confirmada" ? (
          <BtnPrimary asChild>
            <Link href={`/pasajero/reservas/${id}/chat`}>Abrir chat</Link>
          </BtnPrimary>
        ) : null}
        <BtnSecondary asChild>
          <Link href="/pasajero">Buscar más viajes</Link>
        </BtnSecondary>
      </div>
    </AppShell>
  );
}
