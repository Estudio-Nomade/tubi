"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

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
};

/** Pencil P10 — title, sub, fields, spacer, CTA, create link. */
export function LoginForm({ rol: rolParam }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const rol = parseRol(rolParam);
  const isConductor = rol === "conductor";
  const isOperador = rol === "operador";
  const createHref = isConductor
    ? "/registro/conductor"
    : isOperador
      ? "/registro/operador"
      : "/registro";
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
      className="flex flex-1 flex-col gap-5 px-5 py-6"
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

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex-1" aria-hidden />

      <div className="flex flex-col gap-4">
        <BtnPrimary type="submit" disabled={pending}>
          {pending ? "Ingresando…" : "Continuar"}
        </BtnPrimary>

        <Link
          href={createHref}
          className="text-center text-sm font-medium text-primary"
        >
          Crear cuenta
        </Link>

        {isConductor || isOperador ? (
          <Link
            href="/login?rol=pasajero"
            className="text-center text-xs font-medium text-muted-foreground"
          >
            Soy pasajero
          </Link>
        ) : (
          <Link
            href="/login?rol=conductor"
            className="text-center text-xs font-medium text-muted-foreground"
          >
            Soy conductor
          </Link>
        )}
      </div>
    </form>
  );
}
