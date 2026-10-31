export function teamPasteError(team: string[], destination: number, acts: Record<number, string[]>, chosen: string[]): string | null {
  const members = team.filter(Boolean);
  if (!members.length) return 'The copied team is empty.';
  if (team.length > 4 || new Set(members).size !== members.length) return 'The copied team is invalid.';
  for (const name of members) {
    if (!chosen.includes(name)) return `${name} is no longer in your selected cast. Select them again before pasting.`;
    const otherActs = Object.entries(acts).filter(([act, names]) => Number(act) !== destination && names.includes(name)).length;
    if (otherActs >= 2) return `${name} is exhausted: already assigned to two other acts.`;
  }
  return null;
}

export function swapTeams(acts: Record<number, string[]>, source: number, destination: number): Record<number, string[]> {
  if (source === destination) return acts;
  return { ...acts, [source]: [...(acts[destination] ?? [])], [destination]: [...(acts[source] ?? [])] };
}
