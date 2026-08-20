"use client";

import Link from "next/link";
import { useActionState } from "react";

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

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form
      action={formAction}
      className="flex flex-1 flex-col gap-5 px-5 py-6"
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
          required
          disabled={pending}
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
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

      <div className="flex flex-col items-center gap-4">
        <BtnPrimary type="submit" disabled={pending}>
          {pending ? "Ingresando…" : "Continuar"}
        </BtnPrimary>

        <Link
          href="/registro"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Crear cuenta
        </Link>

        <Link
          href="/registro/conductor"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Soy conductor
        </Link>
      </div>
    </form>
  );
}
