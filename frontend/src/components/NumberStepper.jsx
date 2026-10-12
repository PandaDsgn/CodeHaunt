import { Minus, Plus } from "@phosphor-icons/react";

/** Number field with styled − / + buttons in place of the browser's native
 * spinner arrows. `value` is a string so an empty field can mean "unset". */
export default function NumberStepper({ value, onChange, min = 0, max, step = 1, ariaLabel, placeholder = "0" }) {
  function bump(delta) {
    let next = (Number(value) || 0) + delta;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(String(next));
  }

  return (
    <span className="stepper">
      <button type="button" className="ghost" onClick={() => bump(-step)} aria-label={`Decrease ${ariaLabel ?? ""}`.trim()}>
        <Minus size={12} weight="bold" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
      <button type="button" className="ghost" onClick={() => bump(step)} aria-label={`Increase ${ariaLabel ?? ""}`.trim()}>
        <Plus size={12} weight="bold" />
      </button>
    </span>
  );
}
