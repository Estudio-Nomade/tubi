"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

import { cn } from "@/lib/utils";

type Result = { label: string; lat: number; lng: number };

type Props = {
  onSelect: (result: Result) => void;
};

/** Busca una dirección vía Photon (proxy) y devuelve label + coords. */
export function ParadaGeoSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function search(raw: string) {
    const q = raw.trim();
    if (timerRef.current) clearTimeout(timerRef.current);

    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          setError("No se pudo buscar.");
          setResults([]);
          setOpen(false);
          return;
        }
        const json = (await res.json()) as { results?: Result[] };
        setResults(json.results ?? []);
        setOpen(true);
      } catch {
        setError("No se pudo buscar.");
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function select(r: Result) {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSelect(r);
    setQuery(r.label);
    setOpen(false);
    setResults([]);
    setLoading(false);
  }

  return (
    <div className="relative flex w-full flex-col gap-2">
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
          placeholder="Buscar dirección para ubicar el pin"
          autoComplete="off"
          className={cn(
            "h-13 w-full min-w-0 rounded-xl border border-border bg-muted pl-10 pr-4 text-base font-medium text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        />
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Buscando…
        </p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {open && results.length > 0 ? (
        <ul className="absolute top-[calc(100%+0.25rem)] z-20 flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(28,25,23,0.12)]">
          {results.map((r) => (
            <li key={`${r.lat}-${r.lng}`}>
              <button
                type="button"
                onClick={() => select(r)}
                className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-muted"
              >
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="text-sm font-medium leading-snug text-foreground">
                  {r.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
