"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Car } from "lucide-react";

import {
  signInAction,
  type AuthActionResult,
} from "@/application/auth";
import { BtnPrimary, Field } from "@/components/design";

export type LoginRolContext = "conductor" | "pasajero" | "operador";

async function loginAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const result = await signInAction(formData);
  return result ?? null;
}

function parseRol(value: string | undefined): LoginRolContext | null {
  if (value === "conductor" || value === "pasajero" || value === "operador") {
    return value;
  }
  return null;
}

type LoginFormProps = {
  rol?: string;
  authError?: string;
};

/** Pencil P10 — title, sub, fields, spacer, CTA, create link. */
export function LoginForm({ rol: rolParam, authError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const rol = parseRol(rolParam);
  const callbackError =
    authError === "auth_callback"
      ? "No se pudo confirmar el email. Probá de nuevo o pedí otro link."
      : null;
  const isConductor = rol === "conductor";
  const isOperador = rol === "operador";
  const createHref = isConductor ? "/registro/conductor" : "/registro";
  const showCreateAccount = !isOperador;
  const subtitle = isConductor
    ? "Cuenta de conductor"
    : isOperador
      ? "Cuenta de operador"
      : rol === "pasajero"
        ? "Cuenta de pasajero"
        : "Email y contraseña";

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-6 overflow-y-auto overscroll-y-contain"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
          Ingresá a Tubi
        </h1>
        <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={pending}
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={pending}
        />
      </div>

      {callbackError || state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {callbackError ?? state?.error}
        </p>
      ) : null}

      <div className="flex-1" aria-hidden />

      <div className="flex flex-col gap-4">
        <BtnPrimary type="submit" disabled={pending}>
          {pending ? "Ingresando…" : "Continuar"}
        </BtnPrimary>

        {showCreateAccount ? (
          <Link
            href={createHref}
            className="text-center text-sm font-medium text-primary"
          >
            Crear cuenta
          </Link>
        ) : null}

        {isConductor ? (
          <Link
            href="/login"
            className="text-center text-sm font-medium text-muted-foreground"
          >
            Ingresar como pasajero
          </Link>
        ) : isOperador ? null : (
          <Link
            href="/login?rol=conductor"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Car className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            Soy conductor
          </Link>
        )}
      </div>
    </form>
  );
}
