import type { Reserva } from "./types";

/** Owner + confirmed only — boarding pass is not shown for other states. */
export function assertCanViewBoardingPass(
  reserva: Pick<Reserva, "pasajeroId" | "estado">,
  userId: string,
): void {
  if (reserva.pasajeroId !== userId) {
    throw new Error("NO_AUTORIZADO");
  }
  if (reserva.estado !== "confirmada") {
    throw new Error("PASE_NO_DISPONIBLE");
  }
}

export function canViewBoardingPass(
  reserva: Pick<Reserva, "pasajeroId" | "estado">,
  userId: string,
): boolean {
  return (
    reserva.pasajeroId === userId && reserva.estado === "confirmada"
  );
}
