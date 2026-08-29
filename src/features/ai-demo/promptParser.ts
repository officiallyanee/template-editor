export type ColorField = "color" | "backgroundColor";

export type ColorPromptResult =
  | { matched: false }
  | {
      matched: true;
      ok: true;
      field: ColorField | null;
      from: string;
      to: string;
    }
  | {
      matched: true;
      ok: false;
      error: { code: "INVALID_COLOR"; detail: string };
    };

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  blue: "#0075de",
  navy: "#005bab",
  white: "#ffffff",
};

function normalizeColor(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (NAMED_COLORS[normalized]) return NAMED_COLORS[normalized];
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null;
}

export function parseColorPrompt(instruction: string): ColorPromptResult {
  const text = instruction.trim();
  if (!/^change\b/i.test(text) || !/\bcolor\b/i.test(text))
    return { matched: false };
  const match =
    /^change\s+(?:the\s+)?(?:(text|background)\s+)?color\s+from\s+(\S+)\s+to\s+(\S+)\s*$/i.exec(
      text,
    );
  if (!match)
    return {
      matched: true,
      ok: false,
      error: {
        code: "INVALID_COLOR",
        detail:
          "Use “Change text color from #171717 to #005bab” or specify background color.",
      },
    };
  const from = normalizeColor(match[2]);
  const to = normalizeColor(match[3]);
  if (!from || !to)
    return {
      matched: true,
      ok: false,
      error: {
        code: "INVALID_COLOR",
        detail: "Use a 6-digit hex color or black, white, blue, or navy.",
      },
    };
  return {
    matched: true,
    ok: true,
    field:
      match[1]?.toLowerCase() === "text"
        ? "color"
        : match[1]?.toLowerCase() === "background"
          ? "backgroundColor"
          : null,
    from,
    to,
  };
}
