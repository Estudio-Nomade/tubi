"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  signInAction,
  type AuthActionResult,
} from "@/application/auth";
import { BtnPrimary, Field } from "@/components/design";

async function loginAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const result = await signInAction(formData);
  return result ?? null;
}

type LoginFormProps = {
  authError?: string;
};

/** Unified login — single account, no role split in the primary path. */
export function LoginForm({ authError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const callbackError =
    authError === "auth_callback"
      ? "No se pudo confirmar el email. Probá de nuevo o pedí otro link."
      : null;

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-6 overflow-y-auto overscroll-y-contain"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
          Ingresá a Tubi
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Email y contraseña
        </p>
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

        <Link
          href="/registro"
          className="text-center text-sm font-medium text-primary"
        >
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}
