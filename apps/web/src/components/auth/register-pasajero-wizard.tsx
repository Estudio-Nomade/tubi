"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";

import {
  signUpPasajeroAction,
  type AuthActionResult,
} from "@/application/auth";
import { BtnPrimary, Field, ProgressDots } from "@/components/design";
import { registerPasajeroSchema } from "@/domain/auth";

const TOTAL_STEPS = 4;

async function registerAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const result = await signUpPasajeroAction(formData);
  return result ?? null;
}

const STEP_TITLES = [
  "¿Cómo te llamás?",
  "¿Cuál es tu DNI?",
  "¿Cómo te contactamos?",
  "Creá tu cuenta",
] as const;

export function RegisterPasajeroWizard() {
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, formAction, pending] = useActionState(registerAction, null);

  function validateCurrentStep(): boolean {
    let parsed;
    if (step === 1) {
      parsed = registerPasajeroSchema.pick({ nombre: true }).safeParse({ nombre });
    } else if (step === 2) {
      parsed = registerPasajeroSchema.pick({ dni: true }).safeParse({ dni });
    } else if (step === 3) {
      parsed = registerPasajeroSchema
        .pick({ telefono: true })
        .safeParse({ telefono });
    } else {
      parsed = registerPasajeroSchema
        .pick({ email: true, password: true })
        .safeParse({ email, password });
    }

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return false;
    }

    setErrors({});
    return true;
  }

  function handleContinue() {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (step < TOTAL_STEPS) {
      e.preventDefault();
      handleContinue();
      return;
    }
    if (!validateCurrentStep()) {
      e.preventDefault();
    }
  }

  const title = STEP_TITLES[step - 1];
  const ctaLabel =
    step === TOTAL_STEPS
      ? pending
        ? "Creando cuenta…"
        : "Crear cuenta"
      : "Continuar";

  return (
    <form
      action={step === TOTAL_STEPS ? formAction : undefined}
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-6 px-5 py-6"
    >
      <input type="hidden" name="nombre" value={nombre} />
      <input type="hidden" name="dni" value={dni} />
      <input type="hidden" name="telefono" value={telefono} />

      <ProgressDots step={step} total={TOTAL_STEPS} />

      <h1 className="font-heading text-[28px] font-semibold leading-tight text-foreground">
        {title}
      </h1>

      <div className="flex flex-col gap-4">
        {step === 1 ? (
          <Field
            label="Nombre"
            autoComplete="given-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errors.nombre}
            disabled={pending}
            required
          />
        ) : null}

        {step === 2 ? (
          <Field
            label="DNI"
            inputMode="numeric"
            autoComplete="off"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            error={errors.dni}
            disabled={pending}
            required
          />
        ) : null}

        {step === 3 ? (
          <Field
            label="Teléfono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            error={errors.telefono}
            disabled={pending}
            required
          />
        ) : null}

        {step === 4 ? (
          <>
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={pending}
              required
            />
            <Field
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={pending}
              required
            />
          </>
        ) : null}
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex-1" aria-hidden />

      <div className="flex flex-col items-center gap-4">
        <BtnPrimary type="submit" disabled={pending}>
          {ctaLabel}
        </BtnPrimary>

        <Link
          href="/login"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Ya tengo cuenta
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
