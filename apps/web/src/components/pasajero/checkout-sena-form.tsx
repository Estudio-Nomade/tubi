"use client";

import { useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";

import { submitSenaComprobanteAction } from "@/application/pagos";
import { BtnPrimary } from "@/components/design";
import { cn } from "@/lib/utils";

type CheckoutSenaFormProps = {
  reservaId: string;
};

export function CheckoutSenaForm({ reservaId }: CheckoutSenaFormProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
    setError(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await submitSenaComprobanteAction(fd);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="reserva_id" value={reservaId} />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Comprobante de transferencia
        </p>
        <label
          className={cn(
            "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-6 text-center transition-colors",
            "hover:border-primary/40 hover:bg-card/80",
            fileName ? "border-primary/40" : null,
          )}
        >
          <ImagePlus
            className="size-7 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="text-sm font-medium text-foreground">
            {fileName ? fileName : "Subí foto o PDF del comprobante"}
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP o PDF · máx. 5 MB
          </span>
          <input
            type="file"
            name="comprobante"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="sr-only"
            onChange={onFileChange}
          />
        </label>
      </div>

      {error ? (
        <p className="text-center text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <BtnPrimary type="submit" disabled={pending || !fileName}>
        {pending ? "Enviando…" : "Enviar comprobante"}
      </BtnPrimary>
    </form>
  );
}
