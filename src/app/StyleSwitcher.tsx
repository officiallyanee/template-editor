import {
  INTERFACE_STYLES,
  type InterfaceStyle,
} from "./interfaceStyles";
import { useTheme } from "./ThemeProvider";

export function StyleSwitcher() {
  const { style, setStyle } = useTheme();
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="text-[11px] font-semibold tracking-[.06em] text-ink-muted uppercase max-xl:sr-only">
        Style
      </span>
      <select
        aria-label="Interface Style"
        name="interface-style"
        className="min-w-0 rounded-lg border border-hairline bg-raised py-1.5 pr-7 pl-2 text-[13px] text-ink max-sm:w-full"
        value={style}
        onChange={(event) => setStyle(event.target.value as InterfaceStyle)}
      >
        {INTERFACE_STYLES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
