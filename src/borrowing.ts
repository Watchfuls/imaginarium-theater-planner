export function canBorrowCharacter(chosen: string[], previous: string, next: string, cap: number): boolean {
  if (!next) return true;
  const names = new Set(chosen.filter(name => name !== previous));
  names.add(next);
  return names.size <= cap;
}
