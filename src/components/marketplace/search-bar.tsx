"use client";

import { FormEvent, useEffect, useState, type ChangeEvent } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onSubmit: (value: string) => void;
  className?: string;
  id?: string;
}

export function SearchBar({
  value,
  onSubmit,
  className = "",
  id = "marketplace-search",
}: SearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setLocal(next);
    if (next.trim() === "" && value.trim() !== "") {
      onSubmit("");
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(local.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-stretch overflow-hidden rounded-lg border border-neutral-700/80 bg-neutral-900/60 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500 ${className}`}
      role="search"
    >
      <label htmlFor={id} className="sr-only">
        Buscar agentes y automatizaciones
      </label>
      <input
        id={id}
        type="search"
        value={local}
        onChange={handleChange}
        placeholder="Buscar agentes, workflows y automatizaciones..."
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex shrink-0 items-center justify-center bg-neutral-100 px-4 text-neutral-900 transition hover:bg-white"
      >
        <Search size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </form>
  );
}
