"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

/** Chips you add with Enter or comma, with optional one-tap suggestions. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions = [],
  max = 12,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (t && !has(t) && value.length < max) onChange([...value, t]);
    setDraft("");
  };
  const left = suggestions.filter((s) => !has(s)).slice(0, 6);

  return (
    <div className="tg">
      <div className="tg-box">
        {value.map((t) => (
          <span key={t} className="tg-chip">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((v) => v !== t))}>
              <X size={12} />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            id={id}
            value={draft}
            placeholder={value.length ? "Add more" : placeholder}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) add(v.slice(0, -1));
              else setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
              } else if (e.key === "Backspace" && !draft && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => draft && add(draft)}
          />
        )}
      </div>
      {left.length > 0 && value.length < max && (
        <div className="tg-suggest">
          {left.map((s) => (
            <button key={s} type="button" className="tg-add" onClick={() => add(s)}>
              <Plus size={12} /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
