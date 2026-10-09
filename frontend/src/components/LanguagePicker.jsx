import { useEffect, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { LANGUAGE_META } from "../languages.js";

/** Custom dropdown showing each language's real logo — native <select> can't
 * render images inside <option>, so this reimplements just enough of one:
 * trigger button + a closeable menu, single or multi-select. */
export default function LanguagePicker({ languages, value, onChange, multiple = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = multiple ? value : value ? [value] : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(lang) {
    if (multiple) {
      onChange(selected.includes(lang) ? selected.filter((l) => l !== lang) : [...selected, lang]);
    } else {
      onChange(lang);
      setOpen(false);
    }
  }

  const triggerLabel = multiple
    ? selected.length === 0
      ? "Select languages"
      : `${selected.length} language${selected.length > 1 ? "s" : ""} selected`
    : LANGUAGE_META[value]?.label || "Select language";

  return (
    <div className="language-picker" ref={ref}>
      <button type="button" className="language-picker-trigger" onClick={() => setOpen((o) => !o)}>
        {!multiple && value && <img src={LANGUAGE_META[value].logo} alt="" className="language-logo" />}
        <span>{triggerLabel}</span>
        <CaretDown size={13} />
      </button>
      {open && (
        <div className="language-picker-menu">
          {languages.map((lang) => {
            const meta = LANGUAGE_META[lang];
            if (!meta) return null;
            const isSelected = selected.includes(lang);
            return (
              <button
                type="button"
                key={lang}
                className={`language-picker-option${isSelected ? " is-selected" : ""}`}
                onClick={() => handleSelect(lang)}
              >
                <img src={meta.logo} alt="" className="language-logo" />
                <span>{meta.label}</span>
                {multiple && isSelected && <Check size={14} weight="bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
