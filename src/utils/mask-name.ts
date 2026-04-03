// Masks a name to show only the first character followed by asterisks.
export function maskName(name: string): string {
  if (!name) return "Anonim"
  return name.charAt(0) + "***"
}
