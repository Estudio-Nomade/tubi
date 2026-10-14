/**
 * Zod v4 validation schemas for auth forms.
 */

import { z } from "zod";

import { digitsOnly } from "./dni";

const PASSWORD_HINT =
  "Mínimo 8 caracteres, con mayúscula, minúscula y un número";

const passwordSchema = z
  .string()
  .min(8, PASSWORD_HINT)
  .regex(/[a-z]/, PASSWORD_HINT)
  .regex(/[A-Z]/, PASSWORD_HINT)
  .regex(/[0-9]/, PASSWORD_HINT);

const emailSchema = z.email("Email inválido");

const telefonoSchema = z
  .string()
  .min(8, "Teléfono inválido")
  .max(20, "Teléfono inválido");

/** Accepts dotted input; stores/validates digits only (7–8). */
const dniSchema = z
  .string()
  .transform((v) => digitsOnly(v))
  .pipe(
    z
      .string()
      .min(7, "DNI debe tener entre 7 y 8 números")
      .max(8, "DNI debe tener entre 7 y 8 números")
      .regex(/^\d+$/, "DNI solo puede contener números"),
  );

/** Nombre + apellido (al menos dos palabras); colapsa espacios internos. */
const nombreCompletoSchema = z
  .string()
  .transform((v) => v.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, "Nombre completo requerido")
      .max(100)
      .refine((v) => v.split(" ").filter(Boolean).length >= 2, {
        message: "Escribí nombre y apellido",
      }),
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Contraseña requerida"),
});

export const registerPasajeroSchema = z.object({
  nombre: nombreCompletoSchema,
  dni: dniSchema,
  telefono: telefonoSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerConductorSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().min(1, "Apellido requerido").max(100),
  telefono: telefonoSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerOperadorSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().min(1, "Apellido requerido").max(100),
  telefono: telefonoSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPasajeroInput = z.infer<typeof registerPasajeroSchema>;
export type RegisterConductorInput = z.infer<typeof registerConductorSchema>;
export type RegisterOperadorInput = z.infer<typeof registerOperadorSchema>;

export { PASSWORD_HINT };
