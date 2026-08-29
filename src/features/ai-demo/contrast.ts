const HEX = /^#([0-9a-f]{6})$/i;

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: string): number {
  const match = HEX.exec(color);
  if (!match) throw new Error(`Unsupported color: ${color}`);
  const value = match[1];
  const red = channelToLinear(Number.parseInt(value.slice(0, 2), 16));
  const green = channelToLinear(Number.parseInt(value.slice(2, 4), 16));
  const blue = channelToLinear(Number.parseInt(value.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function requiredTextContrast(fontSize = 16, fontWeight = 400): number {
  const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
  return isLarge ? 3 : 4.5;
}

export function meetsContrast(actual: number, required: number): boolean {
  return actual >= required;
}
