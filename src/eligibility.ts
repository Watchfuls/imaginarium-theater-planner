export function countEligibleCharacters(names: string[], selectedTraveler?: string): number {
  const identities = names
    .filter(name => !name.endsWith(' Traveler') || !selectedTraveler || name === selectedTraveler)
    .map(name => name.endsWith(' Traveler') ? 'Traveler' : name);
  return new Set(identities).size;
}
