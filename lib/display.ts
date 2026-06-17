export function getJournalTitle(displayName: string | null): string {
  const name = displayName?.trim();
  if (!name) return "Your journal";
  return `${name}'s journal`;
}
