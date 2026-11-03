export function mergeLineupOverrides(seasons, overrides) {
  const merged = new Map(seasons.map(season => [season.id, season]));
  for (const override of overrides) {
    merged.set(override.id, {
      bossStages: [],
      sourceUrl: '',
      ...merged.get(override.id),
      ...override,
    });
  }
  return [...merged.values()];
}
