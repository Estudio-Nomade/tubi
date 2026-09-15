"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Loader2, Scan } from "lucide-react";

import { verifyQrAction } from "@/application/conductor";
import { BtnPrimary, BtnSecondary } from "@/components/design";

type QrScannerProps = {
  viajeId: string;
};

function cameraErrorMessage(err: unknown): string {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err ?? "");

  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "La cámara requiere HTTPS o localhost. Desde el celu en la red local pegá el código del pasajero abajo.";
  }
  if (/NotAllowed|Permission|denied|NotReadable/i.test(msg)) {
    return "Permiso de cámara denegado o en uso. Habilitalo en el navegador o pegá el código abajo.";
  }
  if (/NotFound|DevicesNotFound|no camera/i.test(msg)) {
    return "No encontramos una cámara. Pegá el código del pasajero abajo.";
  }
  if (/secure|https|Only secure/i.test(msg)) {
    return "La cámara solo funciona en HTTPS o localhost. Pegá el código abajo.";
  }
  return "No pudimos abrir la cámara. Pegá el código del pasajero abajo.";
}

export function QrScanner({ viajeId }: QrScannerProps) {
  const [manual, setManual] = useState("");
  const [camError, setCamError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const regionId = "tubi-qr-reader";

  const submitToken = useCallback(
    (token: string) => {
      const value = token.trim();
      if (!value || handledRef.current) return;
      handledRef.current = true;
      setFormError(null);
      startTransition(async () => {
        const res = await verifyQrAction(viajeId, value);
        if (res?.error) {
          handledRef.current = false;
          setFormError(res.error);
        }
      });
    },
    [viajeId],
  );

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    async function startCamera() {
      if (typeof window === "undefined") return;

      if (!window.isSecureContext) {
        if (!cancelled) {
          setCamError(
            "La cámara requiere HTTPS o localhost. Desde el celu en la red local pegá el código del pasajero abajo.",
          );
        }
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCamError(
            "Este navegador no permite cámara. Pegá el código del pasajero abajo.",
          );
        }
        return;
      }

      try {
        scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (!cancelled) submitToken(decoded);
          },
          () => undefined,
        );
        if (!cancelled) setCamError(null);
      } catch (err) {
        if (cancelled) return;
        // Fallback: any available camera (desktop / single cam).
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cancelled) return;
          if (!cameras.length) {
            setCamError(cameraErrorMessage(err));
            return;
          }
          if (!scanner) {
            scanner = new Html5Qrcode(regionId);
            scannerRef.current = scanner;
          }
          await scanner.start(
            cameras[0].id,
            { fps: 8, qrbox: { width: 220, height: 220 } },
            (decoded) => {
              if (!cancelled) submitToken(decoded);
            },
            () => undefined,
          );
          if (!cancelled) setCamError(null);
        } catch (err2) {
          if (!cancelled) setCamError(cameraErrorMessage(err2 ?? err));
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      void (async () => {
        try {
          if (s.isScanning) await s.stop();
        } catch {
          /* ignore */
        }
        try {
          s.clear();
        } catch {
          /* ignore */
        }
      })();
    };
  }, [submitToken]);

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <div
        className={`flex items-center justify-center rounded-xl px-3.5 py-2.5 transition-colors ${
          pending
            ? "bg-[#F3E0D4]"
            : formError
              ? "bg-[#FCEBEA]"
              : "bg-[#E4EDE5]"
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            pending
              ? "text-[#C45C26]"
              : formError
                ? "text-[#B42318]"
                : "text-[#5F7A61]"
          }`}
        >
          {pending
            ? "Verificando…"
            : formError
              ? "No se pudo verificar"
              : "Listo para escanear"}
        </p>
      </div>

      <div className="relative flex min-h-[300px] flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#292524]">
        <div
          id={regionId}
          className="absolute inset-0 w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />
        {!camError ? (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className={`flex size-[220px] items-center justify-center rounded-2xl border-[3px] transition-colors ${
                pending
                  ? "border-[#C45C26]"
                  : formError
                    ? "border-[#B42318]"
                    : "border-primary"
              }`}
            >
              {!pending ? (
                <Scan
                  className="size-12 text-primary-foreground/40"
                  strokeWidth={1.5}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <Scan className="size-12 text-white/40" strokeWidth={1.5} />
            <p className="text-sm font-medium text-white/70">{camError}</p>
          </div>
        )}

        {pending ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#292524]/75">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-semibold text-[#FFFCF7]">
              Validando reserva…
            </p>
          </div>
        ) : null}
      </div>

      <p className="text-center text-sm font-medium text-muted-foreground">
        Apuntá al código del pasajero
      </p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submitToken(manual);
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            O pegá el código
          </span>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="opq_…"
            autoComplete="off"
            disabled={pending}
            className="h-12 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none ring-offset-background focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </label>
        {formError ? (
          <div className="rounded-xl bg-[#FCEBEA] px-3.5 py-3" role="alert">
            <p className="text-sm font-semibold text-[#B42318]">Error</p>
            <p className="text-[13px] font-normal text-[#B42318]">{formError}</p>
          </div>
        ) : null}
        <BtnPrimary type="submit" disabled={pending || !manual.trim()}>
          {pending ? "Verificando…" : "Verificar código"}
        </BtnPrimary>
        <BtnSecondary asChild>
          <a href={`/conductor/viajes/${viajeId}`}>Volver a la lista</a>
        </BtnSecondary>
      </form>
    </div>
  );
}
