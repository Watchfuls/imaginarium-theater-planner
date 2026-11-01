type SeasonDates = {startsAt:string;endsAt:string};

export function seasonStatus(season:SeasonDates,now=Date.now()):'Current'|'Upcoming'|'Past' {
  if(now<Date.parse(season.startsAt))return 'Upcoming';
  // The bundled end timestamps include the final second of the season.
  return now<Date.parse(season.endsAt)+1000?'Current':'Past';
}

export function currentSeason<T extends SeasonDates>(seasons:T[],now=Date.now()):T|null {
  return seasons.find(season=>seasonStatus(season,now)==='Current')??null;
}
