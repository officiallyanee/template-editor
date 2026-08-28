import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "scope-ui-theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#111111",
};

function initialTheme(): Theme {
  const existing = document.documentElement.dataset.theme;
  if (existing === "light" || existing === "dark") return existing;
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    delete document.documentElement.dataset.style;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme]);
  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () =>
        setTheme((value) => (value === "light" ? "dark" : "light")),
    }),
    [theme],
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
