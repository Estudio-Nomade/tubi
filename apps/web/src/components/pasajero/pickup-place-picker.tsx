"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import type { RecogidaInput } from "@/domain/reservas";
import { cn } from "@/lib/utils";

type Suggestion = {
  label: string;
  lat: number;
  lng: number;
  placeId: string | null;
};

type Props = {
  value: RecogidaInput | null;
  onChange: (value: RecogidaInput | null) => void;
};

/** Picker de lugar de recogida en Tandil vía Photon (detrás del proxy). */
export function PickupPlacePicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const search = useCallback((raw: string) => {
    const q = raw.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      setError(null);
      setLoading(false);
      setNoResults(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNoResults(false);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(q)}&bias=tandil`,
        );
        if (!res.ok) {
          setError("No se pudo buscar. Probá de nuevo.");
          setResults([]);
          setOpen(false);
          setNoResults(false);
          return;
        }
        const json = (await res.json()) as { results?: Suggestion[] };
        const next = json.results ?? [];
        setResults(next);
        setNoResults(next.length === 0);
        setOpen(next.length > 0);
      } catch {
        setError("No se pudo buscar. Probá de nuevo.");
        setResults([]);
        setOpen(false);
        setNoResults(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  function select(s: Suggestion) {
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange({ label: s.label, lat: s.lat, lng: s.lng, placeId: s.placeId });
    setQuery(s.label);
    setOpen(false);
    setResults([]);
    setLoading(false);
    setNoResults(false);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
    setNoResults(false);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Buscá tu dirección en Tandil"
          autoComplete="off"
          className={cn(
            "h-13 w-full min-w-0 rounded-xl border border-border bg-muted pl-10 pr-4 text-base font-medium text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            query && "pr-10",
          )}
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 size-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-border"
            aria-label="Borrar"
          >
            ×
          </button>
        ) : null}

        {open && results.length > 0 ? (
          <ul className="absolute top-[calc(100%+0.25rem)] z-20 flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(28,25,23,0.12)]">
            {results.map((s) => (
              <li key={`${s.placeId ?? "x"}-${s.lat}-${s.lng}`}>
                <button
                  type="button"
                  onClick={() => select(s)}
                  className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-muted"
                >
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="text-sm font-medium leading-snug text-foreground">
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Buscando…
        </p>
      ) : null}

      {noResults && !loading ? (
        <p className="text-xs font-medium text-muted-foreground" role="status">
          No encontramos esa dirección. Probá con calle y altura en Tandil.
        </p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {value ? (
        <p className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm font-medium text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {value.label}
        </p>
      ) : null}
    </div>
  );
}
