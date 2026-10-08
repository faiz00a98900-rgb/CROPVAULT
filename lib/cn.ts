/** Minimal className combiner (no deps). */
export function cn(
  ...inputs: (string | false | null | undefined | Record<string, boolean>)[]
): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") out.push(input);
    else if (typeof input === "object") {
      for (const [key, val] of Object.entries(input)) {
        if (val) out.push(key);
      }
    }
  }
  return out.join(" ");
}
