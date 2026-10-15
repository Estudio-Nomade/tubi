"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

/** Origin/destination field: catalog + Photon cities; free text allowed. */
export function CityField({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  placeholder = "Ciudad o localidad",
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function fetchCities(raw: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = raw.trim();
    if (q.length < 1) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const reqId = ++reqIdRef.current;
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ciudades?q=${encodeURIComponent(q)}`);
        if (reqId !== reqIdRef.current) return;
        if (!res.ok) {
          setResults([]);
          setOpen(false);
          return;
        }
        const json = (await res.json()) as { results?: string[] };
        const list = json.results ?? [];
        setResults(list);
        setOpen(list.length > 0);
      } catch {
        if (reqId !== reqIdRef.current) return;
        setResults([]);
        setOpen(false);
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    }, 250);
  }

  function select(city: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    reqIdRef.current += 1;
    setQuery(city);
    onChange(city);
    setOpen(false);
    setResults([]);
    setLoading(false);
  }

  function commitTyped() {
    const typed = query.trim();
    if (!typed) {
      onChange("");
      return;
    }
    const exact = results.find((c) => c.toLowerCase() === typed.toLowerCase());
    if (exact) {
      select(exact);
      return;
    }
    // Free search: keep what the user typed (not catalog-only).
    onChange(typed);
    setQuery(typed);
  }

  const inputId = `city-${name}`;

  return (
    <div ref={wrapRef} className="relative flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        value={query}
        required={required}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onChange(next);
          fetchCities(next);
        }}
        onFocus={() => {
          if (query.trim().length >= 1) fetchCities(query);
        }}
        onBlur={commitTyped}
        className={cn(
          "h-13 w-full min-w-0 rounded-xl border border-border bg-muted px-3.5 text-base font-medium text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      {loading ? (
        <p className="text-xs font-medium text-muted-foreground">Buscando…</p>
      ) : null}
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.25rem)] z-20 flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(28,25,23,0.12)]"
        >
          {results.map((city) => (
            <li key={city} role="option">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(city)}
                className="flex w-full px-3.5 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
