import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  interfaceThemeColor,
  isInterfaceStyle,
  type InterfaceStyle,
  type Theme,
} from "./interfaceStyles";

type ThemeContextValue = {
  theme: Theme;
  style: InterfaceStyle;
  setTheme: (theme: Theme) => void;
  setStyle: (style: InterfaceStyle) => void;
  toggleTheme: () => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "scope-ui-theme";
const STYLE_STORAGE_KEY = "scope-ui-style";

function initialTheme(): Theme {
  const existing = document.documentElement.dataset.theme;
  if (existing === "light" || existing === "dark") return existing;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function initialStyle(): InterfaceStyle {
  const existing = document.documentElement.dataset.style;
  if (isInterfaceStyle(existing)) return existing;
  const saved = localStorage.getItem(STYLE_STORAGE_KEY);
  return isInterfaceStyle(saved) ? saved : "scope";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [style, setStyle] = useState<InterfaceStyle>(initialStyle);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.style = style;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(STYLE_STORAGE_KEY, style);
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", interfaceThemeColor(theme, style));
  }, [style, theme]);
  const value = useMemo(
    () => ({
      theme,
      style,
      setTheme,
      setStyle,
      toggleTheme: () =>
        setTheme((value) => (value === "light" ? "dark" : "light")),
    }),
    [style, theme],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
