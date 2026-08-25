import { z } from "zod";

export const searchViajesSchema = z.object({
  origen: z.string().min(1, "Origen requerido").max(80),
  destino: z.string().min(1, "Destino requerido").max(80),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hora_desde: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horario inválido")
    .optional()
    .or(z.literal("")),
});

export type SearchViajesInput = z.infer<typeof searchViajesSchema>;
