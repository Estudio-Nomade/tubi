/**
 * Zod v4 validation schemas for auth forms.
 */

import { z } from "zod";

const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

const emailSchema = z.email("Email inválido");

const telefonoSchema = z
  .string()
  .min(8, "Teléfono inválido")
  .max(20, "Teléfono inválido");

const dniSchema = z
  .string()
  .min(7, "DNI debe tener entre 7 y 12 caracteres")
  .max(12, "DNI debe tener entre 7 y 12 caracteres")
  .regex(/^\d+$/, "DNI solo puede contener números");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerPasajeroSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
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
