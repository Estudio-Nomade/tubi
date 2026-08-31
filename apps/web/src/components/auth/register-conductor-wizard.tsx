"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";

import {
  signUpConductorAction,
  type AuthActionResult,
} from "@/application/auth";
import { BtnPrimary, Field, ProgressDots } from "@/components/design";
import { registerConductorSchema } from "@/domain/auth";

const TOTAL_STEPS = 4;

async function registerAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult | null> {
  const result = await signUpConductorAction(formData);
  return result ?? null;
}

const STEP_TITLES = [
  "¿Cómo te llamás?",
  "¿Cuál es tu apellido?",
  "¿Tu teléfono?",
  "Creá tu cuenta",
] as const;

/** Pencil C1 — same shell as P1; no “Ya tengo cuenta” in frame (we keep it for UX). */
export function RegisterConductorWizard() {
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, formAction, pending] = useActionState(registerAction, null);

  function validateCurrentStep(): boolean {
    let parsed;
    if (step === 1) {
      parsed = registerConductorSchema.pick({ nombre: true }).safeParse({ nombre });
    } else if (step === 2) {
      parsed = registerConductorSchema
        .pick({ apellido: true })
        .safeParse({ apellido });
    } else if (step === 3) {
      parsed = registerConductorSchema
        .pick({ telefono: true })
        .safeParse({ telefono });
    } else {
      parsed = registerConductorSchema
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
  const isFinalStep = step === TOTAL_STEPS;
  const ctaLabel = isFinalStep
    ? pending
      ? "Creando cuenta…"
      : "Crear cuenta"
    : "Continuar";

  return (
    <form
      action={isFinalStep ? formAction : undefined}
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-3"
    >
      <input type="hidden" name="nombre" value={nombre} />
      <input type="hidden" name="apellido" value={apellido} />
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
            label="Apellido"
            autoComplete="family-name"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            error={errors.apellido}
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

      <div className="flex flex-col gap-4">
        <BtnPrimary
          type={isFinalStep ? "submit" : "button"}
          onClick={isFinalStep ? undefined : handleContinue}
          disabled={pending}
        >
          {ctaLabel}
        </BtnPrimary>

        <Link
          href="/login?rol=conductor"
          className="text-center text-sm font-medium text-primary"
        >
          Ya tengo cuenta
        </Link>

        {step === 1 ? (
          <Link
            href="/registro"
            className="text-center text-xs font-medium text-muted-foreground"
          >
            Soy pasajero
          </Link>
        ) : null}
      </div>
    </form>
  );
}
