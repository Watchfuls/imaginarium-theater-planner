import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://genshin-impact.fandom.com/api.php';
const PAGE_PREFIX = 'Imaginarium Theater/Seasons/';
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/theater-lineups.json');
const NOW = new Date();
const BOSS_CATEGORIES = [{ title: 'Category:Normal Bosses', type: 'Boss' }];

async function queryApi(parameters) {
  const url = new URL(API_URL);
  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ImaginariumTheaterPlanner/1.0 (lineup data updater)',
    },
  });
  if (!response.ok) {
    throw new Error(`Fandom MediaWiki API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Fandom MediaWiki API error: ${data.error.info ?? data.error.code}`);
  }
  return data;
}

async function getSeasonPages() {
  const titles = [];
  let continuation;
  do {
    const data = await queryApi({
      action: 'query',
      list: 'allpages',
      apnamespace: '0',
      apprefix: PAGE_PREFIX,
      aplimit: 'max',
      format: 'json',
      ...continuation,
    });
    titles.push(...(data.query?.allpages ?? []).map(({ title }) => title));
    continuation = data.continue;
  } while (continuation);

  return titles
    .map((title) => {
      const match = title.match(/^Imaginarium Theater\/Seasons\/(\d{4}-\d{2}-\d{2})$/);
      return match ? { title, start: new Date(`${match[1]}T00:00:00Z`) } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.start - right.start);
}

function getWikitext(page) {
  const revision = Object.values(page?.revisions ?? {})[0];
  const slot = revision?.slots?.main;
  return slot?.content ?? slot?.['*'] ?? revision?.['*'] ?? '';
}

function parseTemplate(wikitext) {
  const template = wikitext.match(/{{\s*Imaginarium Theater Season\b([\s\S]*?)}}/i);
  if (!template) return null;

  const fields = {};
  for (const line of template[1].split(/\r?\n/)) {
    const field = line.match(/^\s*\|\s*([a-zA-Z]+)\s*=\s*(.*?)\s*$/);
    if (field) fields[field[1].toLowerCase()] = field[2].replace(/<!--[\s\S]*?-->/g, '').trim();
  }
  return fields;
}

function splitList(value) {
  return value
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseWikiDate(value) {
  const timestamp = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Date(timestamp);
}

function getBossStageNames(wikitext) {
  const stages = [];
  const actPattern = /^===Act\s+(\d+)===([\s\S]*?)(?=^===|$(?![\s\S]))/gm;
  for (const match of wikitext.matchAll(actPattern)) {
    const act = Number(match[1]);
    const actBody = match[2];
    const bossBattle = actBody.match(/;Battle\{\{Colon\}\}\s*Climactic Showdown([\s\S]*?)(?=;Battle\{\{Colon\}\}|$)/i);
    if (!bossBattle) continue;

    const enemyField = bossBattle[1].match(/^\|enemies1[ \t]*=[ \t]*(.*?)[ \t]*$/im);
    if (!enemyField) continue;

    const names = enemyField[1]
      .split('//')
      .map((name) => name.replace(/\*[\d-]+$/, '').replace(/<!--[\s\S]*?-->/g, '').trim())
      .filter((name) => name && name !== '-');
    if (names.length) stages.push({ act, names });
  }
  return stages;
}

function normalizeFileName(value) {
  return value
    .replace(/^File:/i, '')
    .replace(/[_\s]+Icon\.(png|webp|jpg|jpeg)$/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

async function addBossIcons(pageContents, seasons) {
  const fileTitles = new Set();
  for (const season of seasons) {
    const page = pageContents.get(`${PAGE_PREFIX}${season.id}`);
    const names = new Set(season.bossStages.flatMap((stage) => stage.bosses.map((boss) => boss.name)));
    const pageImages = page?.images ?? [];
    for (const name of names) {
      const match = pageImages.find((image) => normalizeFileName(image.title) === normalizeFileName(`${name} Icon.png`));
      if (match) fileTitles.add(match.title);
    }
  }

  if (!fileTitles.size) return;
  const data = await queryApi({
    action: 'query',
    prop: 'imageinfo',
    titles: [...fileTitles].join('|'),
    iiprop: 'url',
    format: 'json',
  });
  const urls = new Map(
    Object.values(data.query?.pages ?? {}).map((page) => [
      normalizeFileName(page.title),
      page.imageinfo?.[0]?.url ?? null,
    ]),
  );
  for (const season of seasons) {
    for (const stage of season.bossStages) {
      for (const boss of stage.bosses) {
        boss.iconUrl = urls.get(normalizeFileName(`${boss.name} Icon.png`)) ?? null;
      }
    }
  }
}

function parseSeason(page) {
  const wikitext = getWikitext(page);
  const fields = parseTemplate(wikitext);
  if (!fields) return null;

  const season = Number(fields.season);
  const startsAt = parseWikiDate(fields.start ?? '');
  const endsAt = parseWikiDate(fields.end ?? '');
  const elements = splitList(fields.elements ?? '');
  const openingCharacters = splitList(fields.characters ?? '');
  const specialGuests = splitList(fields.guests ?? '');

  if (
    !Number.isInteger(season)
    || Number.isNaN(startsAt.getTime())
    || Number.isNaN(endsAt.getTime())
    || !elements.length
    || !openingCharacters.length
    || !specialGuests.length
  ) {
    return null;
  }

  return {
    id: page.title.slice(PAGE_PREFIX.length),
    season,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    elements,
    openingCharacters,
    specialGuests,
    bossStages: getBossStageNames(wikitext).map(({ act, names }) => ({
      act,
      bosses: names.map((name) => ({ name, iconUrl: null })),
    })),
    sourceUrl: `https://genshin-impact.fandom.com/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
  };
}

async function getPageContents(titles) {
  if (!titles.length) return new Map();
  const data = await queryApi({
    action: 'query',
    prop: 'revisions|images',
    titles: titles.join('|'),
    rvprop: 'content|timestamp',
    rvslots: 'main',
    imlimit: 'max',
    format: 'json',
  });
  return new Map(Object.values(data.query?.pages ?? {}).map((page) => [page.title, page]));
}

async function getCategoryMembers(category) {
  const members = [];
  let continuation;
  do {
    const data = await queryApi({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmtype: 'page',
      cmlimit: 'max',
      format: 'json',
      ...continuation,
    });
    members.push(...(data.query?.categorymembers ?? []).map(({ title }) => title));
    continuation = data.continue;
  } while (continuation);
  return members;
}

function getLocalLegendEntries(wikitext) {
  const entries = [];
  let underwaterFontaine = false;
  for (const line of wikitext.split(/\r?\n/)) {
    if (/^===/.test(line)) {
      underwaterFontaine = /fontaine.*underwater|underwater.*fontaine/i.test(line);
    } else if (/^;Underwater\b/i.test(line)) {
      underwaterFontaine = true;
    } else if (/^;Land\b/i.test(line)) {
      underwaterFontaine = false;
    }

    if (underwaterFontaine) continue;
    const match = line.match(/\{\{\s*Enemy\s*\|\s*([^|}]+)\s*\|text=([^}|]+)/i);
    if (!match) continue;

    const enemyPage = match[1].trim().replace(/^\[\[|\]\]$/g, '').replace(/^["']|["']$/g, '');
    const display = match[2].replace(/'''/g, '').trim();
    const name = display.split(/\s+[—–-]\s+/)[0].replace(/^["']|["']$/g, '').trim();
    if (enemyPage && name && name !== display) {
      entries.push({ name, pageTitle: enemyPage, type: 'Local Legend' });
    }
  }
  return entries;
}

async function getBossCatalog() {
  const [normalBosses, localLegendPage] = await Promise.all([
    getCategoryMembers(BOSS_CATEGORIES[0].title),
    getPageContents(['Local Legend']),
  ]);
  const candidates = [
    ...normalBosses.map((pageTitle) => ({ name: pageTitle.replace(/^"|"$/g, ''), pageTitle, type: 'Boss' })),
    ...getLocalLegendEntries(getWikitext(localLegendPage.get('Local Legend'))),
  ];
  const unique = new Map();
  for (const entry of candidates) {
    if (!entry.name || /^(Normal Boss|Weekly Boss)$/.test(entry.name)) continue;
    unique.set(`${entry.type}:${entry.name}`, entry);
  }

  const entries = [...unique.values()];
  const iconTitles = new Map(entries.map(({ pageTitle }) => [
    pageTitle.toLowerCase(),
    `File:${pageTitle} Icon.png`,
  ]));
  const fileTitles = [...new Set(iconTitles.values())];
  const imageInfoData = await Promise.all(
    Array.from({ length: Math.ceil(fileTitles.length / 50) }, (_, index) => queryApi({
      action: 'query',
      prop: 'imageinfo',
      titles: fileTitles.slice(index * 50, (index + 1) * 50).join('|'),
      iiprop: 'url',
      format: 'json',
    })),
  );
  const imageUrls = new Map(imageInfoData.flatMap((data) => Object.values(data.query?.pages ?? {}).filter(image=>image.imageinfo?.[0]?.url).map((image) => [
    image.title.toLowerCase(),
    image.imageinfo?.[0]?.url ?? null,
  ])));
  const pagesWithoutIcons=entries.filter(({pageTitle})=>!imageUrls.has(iconTitles.get(pageTitle.toLowerCase()).toLowerCase()));
  const pageTitles=[...new Set(pagesWithoutIcons.map(({pageTitle})=>pageTitle))];
  const pageData=await Promise.all(
    Array.from({length:Math.ceil(pageTitles.length/50)},(_,index)=>queryApi({
      action:'query',
      prop:'images',
      titles:pageTitles.slice(index*50,(index+1)*50).join('|'),
      imlimit:'max',
      format:'json',
    })),
  );
  const pages=new Map(pageData.flatMap(data=>Object.values(data.query?.pages??{}).map(page=>[page.title.toLowerCase(),page])));
  const fallbackTitles=new Map();
  for(const {pageTitle} of pagesWithoutIcons){
    const icons=(pages.get(pageTitle.toLowerCase())?.images??[]).filter(({title})=>/Icon\.(png|webp|jpg|jpeg)$/i.test(title));
    const exactIcon=icons.find(({title})=>normalizeFileName(title)===normalizeFileName(pageTitle));
    const selectedIcon=exactIcon??(icons.length===1?icons[0]:null);
    if(selectedIcon)fallbackTitles.set(pageTitle.toLowerCase(),selectedIcon.title);
  }
  const fallbackFileTitles=[...new Set(fallbackTitles.values())];
  const fallbackImageData=await Promise.all(
    Array.from({length:Math.ceil(fallbackFileTitles.length/50)},(_,index)=>queryApi({
      action:'query',
      prop:'imageinfo',
      titles:fallbackFileTitles.slice(index*50,(index+1)*50).join('|'),
      iiprop:'url',
      format:'json',
    })),
  );
  const fallbackUrls=new Map(fallbackImageData.flatMap(data=>Object.values(data.query?.pages??{}).map(image=>[image.title.toLowerCase(),image.imageinfo?.[0]?.url??null])));
  return entries
    .map(({ name, pageTitle, type }) => ({
      name,
      type,
      iconUrl: imageUrls.get(iconTitles.get(pageTitle.toLowerCase()).toLowerCase())
        ?? fallbackUrls.get(fallbackTitles.get(pageTitle.toLowerCase())?.toLowerCase())
        ?? null,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

const seasonPages = await getSeasonPages();
if (!seasonPages.length) {
  throw new Error('The Fandom API returned no Imaginarium Theater season pages.');
}

const today = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate()));
const latestPageIndex = seasonPages.findLastIndex(({ start }) => start <= today);
const selectedPages = seasonPages.slice(Math.max(0, latestPageIndex - 1), latestPageIndex + 2);
const pageContents = await getPageContents(selectedPages.map(({ title }) => title));
const parsedSeasons = selectedPages
  .map(({ title }) => parseSeason(pageContents.get(title)))
  .filter(Boolean);
const current = parsedSeasons.find((season) => new Date(season.startsAt) <= NOW && new Date(season.endsAt) >= NOW) ?? null;
if (!current) {
  throw new Error('The Fandom API did not provide a complete lineup for the active Theater season.');
}
const next = parsedSeasons
  .filter((season) => new Date(season.startsAt) > NOW)
  .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] ?? null;
await addBossIcons(pageContents, parsedSeasons);
const bossCatalog = await getBossCatalog();
const incompleteUpcomingPage = selectedPages.find(({ start, title }) => start >= today
  && !parsedSeasons.some((season) => season.id === title.slice(PAGE_PREFIX.length)));
const revisionTimestamps = [...pageContents.values()]
  .flatMap((page) => page.revisions ?? [])
  .map((revision) => revision.timestamp)
  .filter(Boolean)
  .sort();
const output = {
  source: 'Fandom MediaWiki Action API (community-maintained season templates)',
  generatedAt: revisionTimestamps.at(-1) ?? null,
  current,
  next,
  bossCatalog,
  nextUnavailableReason: incompleteUpcomingPage && !next
    ? `The upcoming season page exists but its lineup fields are not complete yet: ${incompleteUpcomingPage.title}`
    : null,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Updated Theater lineups from Fandom MediaWiki API.`);
console.log(`Current season: ${current?.id ?? 'unavailable'}`);
console.log(`Next season: ${next?.id ?? output.nextUnavailableReason ?? 'not announced'}`);
