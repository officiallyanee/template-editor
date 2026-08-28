export type Theme = "light" | "dark";

export const INTERFACE_STYLES = [
  {
    id: "scope",
    label: "Scope",
    themeColor: { light: "#f6f5f4", dark: "#17191c" },
  },
  {
    id: "editorial",
    label: "Editorial",
    themeColor: { light: "#ffffff", dark: "#111111" },
  },
] as const;

export type InterfaceStyle = (typeof INTERFACE_STYLES)[number]["id"];

export function isInterfaceStyle(
  value: string | null | undefined,
): value is InterfaceStyle {
  return INTERFACE_STYLES.some((style) => style.id === value);
}

export function interfaceThemeColor(theme: Theme, style: InterfaceStyle) {
  return INTERFACE_STYLES.find((option) => option.id === style)!.themeColor[
    theme
  ];
}
