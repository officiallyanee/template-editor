export function deterministicId(prefix: string, seed: string): string {
  let hash = 0;
  for (const character of seed)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `${prefix}-${hash.toString(36)}`;
}
