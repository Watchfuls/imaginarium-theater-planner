# Recurring Act Details update

## How to request an update

Use: **Update Act Details for the current theater.**

Or: **Update Act Details for Season 29 (2026-11-01).**

These requests invoke the full brief below. No scheduled automation is required.
An explicitly named season selects the research target; it does not change the
app's rule that only the currently active theater is displayed.

## Standing brief

### Source priority

Use this order when sources disagree about the same mechanic or value:

1. The user's notes, Markdown guides, and explicit corrections in conversation.
2. Genshin Impact Fandom wiki.
3. Alioth.
4. Other sources.

Lower-priority sources fill gaps; they must not override applicable user notes.
Missing values and requests to verify in the user's notes are gaps to research,
not a reason to stop at those notes. Continue through Fandom, Alioth, then other
sources. Use supported intrinsic enemy mechanics as fallbacks and record any
variant inference in the research record; do not label it direct Theater verification.
Record conflicting evidence in repository research without duplicating it in
the player UI. Preserve qualifications in the user's notes: a question,
placeholder, or instruction to confirm a value is not a confirmed observation.
Continue checking the exact enemy variant and encounter context; this priority
does not permit transferring stage timings or objectives between different acts.

Before external research, consult `docs/act-details-archive` and prior local
research records for details we have collected ourselves, including information
missing from external sites. Apply the historical matching rules below to these records.
Keep original provenance and confidence; archived estimates remain estimates.

For mechanics explanations, prioritize the user's Theater and Abyss Markdown
guides in `C:/Users/gregh/Documents/Genshin/Abyss Guides`, especially the guide
for the current theater. Cross-check intrinsic enemy behavior against exact
enemy wiki pages and Alioth. Transfer no Abyss chamber or different Theater
act objectives, spawn orders, or timers. Keep variant-specific mechanics
separate, and record conflicts without inventing a resolution.

Populate the fourth section with the selectable enemy encounters for every act
and applicable difficulty, including the two Lunar challenges. Include enemy
waves/counts, resistances and immunities, clear requirements, star-challenge
requirements, stage effects, enemy mechanics, and useful factual notes.
Keep editorial research separate from the user's personal notes.

When the user supplies local season graphics, inspect their readable exports and
use them as an additional current-season reference. Record the folder, filename,
act, visible level/profile, and transcribed values in the research record. Credit
them as **graphic-sourced**, not as independently verified official game data.
Use each act graphic only for that act and each Arcana graphic only for the same
Lunar challenge. Respect the depicted difficulty/profile; any use for another
difficulty remains an explicit inference. Retain conflicting names or generic
icons in the audit rather than silently replacing an exact Alioth variant.

The supplied Season 29 graphics are in `F:/GenshinTemp/Graphics/IT/72` (Act1–10
and Arcana1–2 JPG exports). Do not assume the same folder applies to a future
season. Reading the exports does not require modifying or importing PSD files.

1. Determine the season number and start date from the requested target or
   `src/data/theater-lineups.json`. Use release timestamps and the current date,
   not the JSON field named `current`, to identify the active season. Report if
   the bundled data needs refreshing. Do not substitute an older season.
2. Read the current lineup at `https://alioth.wiki/en/gi/theater?id={season}`.
   Record all choices per act/difficulty, including normal, defense, elite, boss,
   and Lunar encounters where present. Distinguish selectable alternatives from
   successive waves of one encounter. Preserve displayed names and variants.
3. Read `https://genshin-impact.fandom.com/wiki/Imaginarium_Theater/Seasons/{YYYY-MM-DD}`
   for current-season objectives, timing, stage effects, and mechanics.
4. Use `https://genshin-impact.fandom.com/wiki/Imaginarium_Theater/Seasons`
   to research **many previous seasons**: inspect at least 12 available prior
   season battle pages, newest first, or all available if fewer exist. Expand
   further when current encounters remain unmatched. Count only pages whose
   battle content was actually read, not search snippets or index links.
5. **Historical regular-act references must stay within the same act number.**
Act 6 may reference only prior Act 6 encounters, never Act 8 or another act
even if the boss is identical. Lunar challenges I and II may be compared
across challenge numbers when their enemy lineup, battle format, and
objectives are compatible; enemy identity alone is not enough to transfer
objectives, timers, or effects. Normal acts and Lunar challenges are not
interchangeable. A final boss moving between Hard Act 8 and Visionary Act 10
does not permit transferring historical deadlines across those acts. Apply
these rules to app source links, evidence tables, timing, quotas, waves, and
stage-effect inferences. General enemy reference pages may still supply
intrinsic resistances and mechanics; they are not lineup matches.
   Within that act, match encounters using enemy variants, wave composition, battle
   type, difficulty, objectives, and stage effects. A shared enemy or act number
   alone is insufficient. Use well-matched historical encounters to populate
   practical inferred requirements, timings, waves, and stage effects even when
   the current Fandom battle table is absent. Record the season and exact act,
   explain the match, and label the transferred fields **inferred**, rather than
   leaving supported fields unknown until a current-season page exists.
   Repeated agreement and a matching Alioth target increase confidence. Require
   the same act and compatible battle type; label partial-variant matches lower
   confidence. If no same-act match exists, leave unsupported values unknown
   and retain details supplied directly by current or general enemy sources.
   Conflicting timers remain unresolved unless current
   evidence distinguishes them; do not silently pick one.
6. Check relevant enemy reference pages for resistance values and mechanics.
   Distinguish base resistance from shields, transformations, buffs, and other
   conditional changes. Record physical and elemental values with conditions;
   do not assume universal 10% resistance. Avoid uncited tactical guesses.
7. Resolve discrepancies using current-season evidence for the field concerned.
   Keep a record of conflicts and uncertainty. If a source cannot be accessed,
   report the limitation; do not invent choices or claim historical research
   was completed. Ask for missing source content only when available tools and
   authorized access cannot provide it. Respect declined permissions.

## App data format

### Unofficial future-season preparation

Separate officially announced lineup information from unofficial encounter
research. Official patch-note lineup data may remain in the regular season
lineup source. Keep unofficial enemies, encounter details, and their source
audit in the Git-ignored `private-local/` directory; never add them to tracked
act or lineup JSON, research files, archives, or any deployed/editor export.
The development server loads private previews for Act Details, Challenge Setup,
and the planner. Custom-season JSON files can be imported by selecting them in
Challenge Setup; the browser validates and stores the file in local storage,
without uploading it. Verify that every private data file remains ignored
before publishing or committing.

Mark protected season numbers in the comma-separated
`itp-act-details-local-only-seasons-v1` browser-storage key; Act Details JSON
downloads omit those seasons. Keep the source audit separate from the app draft.
Keep the local-only mark until the relevant battle information has been
officially published and checked. Only then may verified details be promoted
through the normal curated-data workflow.

### Visitor presentation

Write elemental gauge amounts consistently as `20U of Geo gauge` (amount before
element), so the site renders one colored amount-and-element badge. Do not split
the element and amount across a sentence, such as `Geo ward has 20U of gauge`.

Tie enemy-specific Key Recommendations and notable characters to the exact
enemy variant, not an act number. Apply them to every encounter containing that
enemy across applicable acts and difficulties, including planner previews.
For example, Moonfly's Healing recommendation applies in Hard Act 8 as well as
Visionary/Lunar Act 10. Keep genuinely stage-specific advice (such as Taunts for
Monolith Defense or Healing/Shielding for unavoidable Lunar stage damage) tied
to that stage. This does not permit transferring stage objectives or timings.

Call enemy defenses **Wards**, including named wards and ward breaks. Reserve
**Shields** and **Shielding** for characters, even when a source calls an enemy
defense a shield.

Mechanics notes must not repeat static resistances already shown with enemy
portraits. Include resistance explanations only for conditional changes, such
as transformations, elemental absorption, or weakened states. Preserve personal
notes when cleaning curated mechanics text.
Omit general positioning advice. Describe actionable mechanics available in
this Theater; do not recommend player kuuvahki interactions, which are not
available here. Leave Mechanics empty when an encounter has no relevant unique
mechanic rather than adding generic combat advice or attack descriptions.
Do not explain which other enemy variants are absent. Omit basic-enemy attack
descriptions unless the user specifically requests them. Keep meaningful
special interactions and counters; show None when no relevant mechanics remain.
Do not add incidental counters such as staggering a Geovishap's roll with a
shield. Prioritize the user's explicitly requested points and mechanics that
materially affect team selection, damage windows, survival, or objectives.
Research completeness is not a reason to include every documented interaction.
Only mention player shields when they provide an explicit useful protection or
benefit. Do not add notes stating that shields fail to prevent an effect.
When describing weakened, stunned, paralyzed, exhausted, or disabled states,
include their sourced duration. Distinguish control duration from a longer
resistance-reduction window, and weak-point disable timers from full paralysis.
Use stable state terminology and universal hover definitions: Paralyzed means
unable to act; Exhausted means an inactive recovery state; neither inherently
reduces resistance. Weakened means reduced resistance, not an action lock.
Disabled refers to an inactive weak-point system, and Interrupted only means
the current attack is canceled. Describe accompanying effects separately.
Prefer Paralyzed over interchangeable uses of Stunned in curated text.
If the exact variant's duration cannot be established, say it is unconfirmed;
do not guess or borrow a different variant's timer.
Avoid duplication between Resistance Notes and Mechanics, including conditional
resistance changes. Keep a resistance-only explanation in Resistance Notes;
Mechanics should explain other relevant interactions rather than restating it.

Use consistent title capitalization for section labels. Show Challenge
Use `%` instead of “percentage points” in all displayed resistance text.
Requirements before Details. Details uses a compact count summary such as
`5 Enemies | 2 Waves`, followed by numbered wave rows with counts and enemy
icons (icon links only, with names available on hover). Use a star icon for the
Star Challenge objective. Do not display “estimated” labels or run-confirmation
boilerplate; retain provenance and uncertainty in the repository research.
Only show additional Stage Effects for Elite Assault and Lunar challenge stages.
When Treacherous Thunder is recorded for all choices in Acts 1 and 2, show it
once as a shared act-level effect, explicitly stating that it begins after a
delay. Keep additional elite hazards within the corresponding choice.
Do not invent missing counts or wave orders to fill the compact summary.

Do not display enemy HP values in Act Details, including boss cards or clear
requirements. Keep existing HP research in repository records only. Continue
showing recorded enemy levels beside act headings.

Keep cross-references, source links, graphic credits, confidence assessments,
and research commentary only in repository research files, outside the site
bundle and editor. Visitors see
enemy portraits, spawn/wave details, objectives, relevant uncertainty (such as
estimated targets), stage effects, mechanics, and user-authored notes. Do not
expose research summaries or source-comparison explanations in the public view.
Only display resistance values that differ from 10%, retaining immunities,
weaknesses, zero resistance, and conditional state changes. Omit resistance-only
sections when no exceptions exist. Do not erase the underlying research data.

Enemy IDs are resolved through `src/data/theater-enemies.json` to bundled icons
and verified Fandom `wikiUrl` destinations. Link the enemy portrait/name card to
that page; these player-facing enemy links are allowed, unlike research-source
links and historical cross-references. Resolve alternate names through wiki
redirects or the appropriate enemy page rather than linking to missing pages.
Enemy icons live
in `src/assets/enemies`. Include an icon for each newly introduced enemy type;
reuse source icons for forms that share one. These icons were downloaded from
the Alioth image CDN (`/gi/MonsterIcon/{icon}.png`).

Curate the full evidence-bearing dataset in
`docs/act-details-research/{YYYY-MM-DD}.json`, alongside its Markdown audit.
Use `siteActDetails` in `src/actDetailsPresentation.ts` to prepare
`src/data/theater-act-details.json` for the site. The public dataset includes
explicit `enemyIds` for portraits, gameplay text, and notes; it excludes source
URLs, source labels, graphic credits, confidence, and research summaries.
Never import the evidence-bearing dataset into production application code.
Legacy browser drafts are sanitized on load as well. The shared hierarchy is:

`seasons[seasonNumber][difficulty][actNumber]`

- Season and act keys are strings. Difficulty names are exactly `Easy`,
  `Normal`, `Hard`, `Visionary`, and `Lunar`.
- Act ranges: Easy 1–3; Normal 1–6; Hard 1–8; Visionary 1–10;
  Lunar 1–10 plus keys `11` and `12` for Lunar challenges 1 and 2.
- Lunar display order is 1, 2, 3, 11, 4, 5, 6, 12, 7, 8, 9, 10.
- Record each selectable battle/lineup as one encounter. List waves within its
  `enemies` text, not as separate choices. Include bosses as encounters too.
- All fields below are required strings, except `encounters`, which is an array.
  Use an empty string for unknown information; never use zero to mean unknown.
- Reuse an encounter across difficulties when historical mode labels support
  it, clearly labelling the current-season mapping inferred. State when only
  some choices have sufficient evidence; an inferred subset is not an exhaustive
  list. Do not transfer historical HP or timers across different acts or boss
  slots. Lunar's shared normal acts need an
  explicit rules reference; its separate challenges need their own evidence.

Structural example only; placeholders are not researched game data:

```json
{
  "seasons": {
    "29": {
      "Visionary": {
        "1": {
          "requirements": "",
          "notes": "",
          "encounters": [
            {
              "name": "Normal · Opposing Lineup 1",
              "enemies": "Wave 1: [count] × [exact enemy variant]\nWave 2: [count] × [exact enemy variant]",
              "resistances": "[Enemy]: Physical [value]%; [element] [value]%. [Conditional changes].",
              "requirements": "Clear: [objective and time limit, if any].\nStar Challenge: [objective and separate time target].",
              "notes": ""
            }
          ]
        }
      }
    }
  }
}
```

Put shared act objectives in `act.requirements`; encounter-specific objectives
in `encounter.requirements`. Do not conflate a star target with the failure timer.
Record sourced stage effects and mechanics in the research record below.
Use the optional encounter fields `stageEffects` and `mechanics` for those
details. In the research dataset only, use `status` for verification caveats and `sources` for an array of
`{"label":"Source description","url":"https://..."}` links. These fields
are retained in the repository, separate from personal notes. Keep current facts and historical
references clearly labelled in their text. Leave `notes` for the user's additions.
An optional `inference` object stores `confidence` (`high`, `medium`, or `low`)
and a concise `basis` in the research dataset only. Confidence is
an editorial assessment of the match, not a statistical probability. Keep three
states distinct: confirmed by current evidence, inferred from referenced prior
encounters, and unknown/conflicting. Missing current Fandom tables alone are not
a reason to stop populating inferred details.
Use `graphicSources` (an array of filenames) to credit supplied graphics in the
repository research dataset. Keep absolute local source paths in the research record rather than exposing
machine paths or unusable file links in the published UI. If a graphic resolves
a timing conflict, update the active requirements and explain the resolution.
Preserve existing notes verbatim when refreshing an entry. Match entries by
difficulty, act, and encounter identity rather than array position.

## Research record

Create or update `docs/act-details-research/{YYYY-MM-DD}.md` using
[the research template](act-details-research-template.md). This is the audit trail
for source URLs, access dates, historical matches, completeness, and unknowns.
Include a source for every populated claim or clearly defined group of claims.
Paraphrase source descriptions; avoid copying long wiki passages.

The research record must contain:

- Alioth season number and Fandom date mapping, plus actual access dates.
- Every prior season inspected, with URL and a brief relevant finding or
  explicit no-match result. Do not stop at an arbitrary count if gaps remain
  and more useful history is available.
- Per encounter: current lineup source, current objective/effect source,
  historical matches, resistance references, and verification status.
- Difficulty coverage and unresolved gaps/conflicts. Distinguish confirmed
  current facts, historical matches awaiting confirmation, and unknowns.

Optionally add `research[seasonNumber]` at the root of the research JSON with
`checkedOn`, `summary`, and `sources`. This metadata is excluded from site JSON
and development-editor exports.

## Validation and handoff

Check coverage against the source's selectable choices, wave grouping, variants,
counts, applicable difficulties, boss slots, and Lunar numbering. Confirm every
timer distinguishes clear from star requirements. Confirm user notes survive.
Preserve older curated seasons in the JSON even though they are hidden in the UI.
Before replacing or removing a theater, run `npm run archive:act-details` and
commit the generated snapshots. See [the archive instructions](act-details-archive/README.md).
If the user has browser-only edits, export and archive the latest development
draft too; the command cannot automatically access localStorage. Never prune
local archive or research records as part of season rotation.
Do not modify the generated lineup updater as part of routine curation.

Run `npm.cmd run build` on Windows (`npm run build` elsewhere) and
`git diff --check`. Summarize the updated season, actual historical coverage,
unresolved fields, and checks performed. Do not claim a deployment or schedule
unless one was explicitly carried out.

The development editor merges browser drafts with published seasons and acts.
An edited act can still override its newly bundled version. When checking updated
data in development, export any valuable draft first,
then remove only the `itp-act-details-draft-v1` localStorage key and reload, or
use a fresh browser profile. Do not clear all browser storage.
