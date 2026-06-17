export function getJournalTitle(displayName: string | null): string {
  const name = displayName?.trim();
  if (!name) return "Your bottled journal";
  return `${name}'s bottled journal`;
}
