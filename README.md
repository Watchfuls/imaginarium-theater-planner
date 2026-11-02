# Imaginarium Theater Planner

## Code layout and checks

`src/main.tsx` mounts the app; `src/App.tsx` owns shared planner state and section
navigation. UI components live separately in `SiteHeader`, `CharacterVisuals`,
`CharacterPickers`, `BossPreview`, and the development-only `BossOverrideEditor`.
Act Details, encounter selection, difficulty selection, and Video Guide also have
their own components. Shared types and rules live in `plannerTypes` and
`plannerConfig`; `theaterData` parses season/boss data, and `ownership` handles
GOOD imports and saved ownership migration.

Run `npm test` for regression checks and `npm run build` for TypeScript and the
production build (use `npm.cmd` in Windows PowerShell). Deployment runs both.

`npm run test:browser` runs interaction checks in an installed Google Chrome
using Playwright. It starts an isolated local Vite server and fresh browser
profile, so real saved plans and notes are untouched. It checks navigation,
difficulty synchronization, keyboard controls, character/slot/team dragging,
copy/paste limits, saved assignments, chapter links, and mobile overflow.
Set `BROWSER_CHANNEL=msedge` to use installed Edge instead (in PowerShell:
`$env:BROWSER_CHANNEL='msedge'`). Actual YouTube playback and audio may need
manual verification in Firefox/Chrome because the media can be blocked in
automated browser sessions. Browser checks are separate from the deployment's
unit tests and require a locally installed supported browser.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
```

The GitHub Actions workflow deploys the site to GitHub Pages on every push to `main` and can also be started manually. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The workflow checks out the public `Watchfuls/genshin-shared` repository beside this project so the shared icons are included in the build. Vite uses a relative base path (`./`).

## Season lineups

The bundled current and upcoming season lineups are generated from the public Fandom MediaWiki Action API. The updater reads season page revisions and extracts fields from the `Imaginarium Theater Season` template; it does not fetch or parse rendered page HTML. Fandom is community-maintained, so check the linked source page if a lineup looks incorrect.

Run the updater manually with:

```bash
npm run update:theater-lineups
```

The scheduled GitHub Actions workflow refreshes the generated `src/data/theater-lineups.json` once daily (06:17 UTC), and hourly on the first and actual last calendar day of each month. It commits only when the source revisions change. The updater also extracts boss-stage names from the season battle sections, builds a dropdown catalog of Normal Bosses and Local Legends, and resolves icon URLs to the boss pages' `*_Icon` files through the MediaWiki API—not their lead or first available images. Since the catalog is fetched from Fandom on every scheduled run, newly added bosses and Local Legends are included automatically as the wiki lists them. Weekly Bosses and Fontaine underwater Local Legends are intentionally excluded. Boss icons are served by Fandom, so displaying them requires an internet connection; the app itself uses bundled lineup and boss-name data and does not contact Fandom at runtime.

The boss stage labels, names, and icons are generated from each season page. The **Boss Overrides** editor in Challenge Setup is available only in the local Vite development server (`npm run dev`); it is omitted from production builds and is not exposed to site visitors. Choose a season and one of the four numbered boss slots, or the optional Lunar Act 2 slot, then select a known boss or enter a custom boss and optional icon URL. Rename an existing boss in place to preserve its icon; adding a custom name that exactly matches a known boss also reuses its icon. The slots map to Act 3, Act 6, Act 8, and Act 10; Boss 4 maps to Act 8 in Hard and Act 10 in Visionary/Lunar. Edits preview immediately and apply without choosing a difficulty. Download `theater-bosses.json`, replace `src/data/theater-bosses.json` with it, then commit and redeploy the site to publish the changes to everyone. Use **Restore Fandom data for this slot** to remove an override.

The JSON is keyed by season number and boss slot. A slot's boss list replaces the generated boss list everywhere that slot applies; set it to an empty array to hide the generated boss. Manual overrides take precedence over Fandom data and remain untouched by the scheduled updater. For example:

```json
{
  "seasons": {
    "28": {
      "boss1": [
        {
          "name": "Perpetual Mechanical Array",
          "iconUrl": "https://static.wikia.nocookie.net/gensin-impact/images/b/b3/Perpetual_Mechanical_Array_Icon.png"
        }
      ]
    }
  }
}
```

Commit the JSON change and rebuild/deploy the site for the override to appear for all visitors. An icon URL can be set to `null` to show the boss name without an image.

## Notes

Curated act details are retained in the [local archive](docs/act-details-archive/README.md)
for future same-act comparisons. Run `npm run archive:act-details` before a
theater rotation; changed details create a new snapshot without overwriting
older ones. Browser-only notes must first be exported from the development
editor and archived using that JSON file. Archived seasons stay hidden on the site.

For each new theater, ask **“Update Act Details for the current theater”** (or
specify a season number and date). The reusable
[Act Details workflow](docs/act-details-workflow.md) defines the sources,
historical research, data format, preservation of your notes, and validation.
Repository instructions direct coding agents to follow it automatically.
This is an on-demand update; it does not add scheduled automation.

Season 29's [research record](docs/act-details-research/2026-11-01.md) documents
the Alioth enemy choices, resistance references, and comparisons across 28 prior
Fandom seasons. The app distinguishes current enemy types from historical
timers, waves, and stage effects; incomplete difficulty variants remain labelled.

Act Details shows enemy portraits with locally bundled icons and only resistance
exceptions to the standard 10%. Cross-references, graphic credits, confidence,
and research commentary are retained only in repository research files;
the visitor view focuses on the gameplay details.

The fourth section, **Act Details**, is accessible independently of planner eligibility and shows only the active season (upcoming and expired seasons are excluded using the bundled release timestamps). Choose a difficulty to see its acts, including the two Lunar challenges at their unlock positions. Existing boss overrides also appear here. Encounter choices, resistance exceptions, clear requirements, and notes are curated in `src/data/theater-act-details.json`; unrecorded fields are explicitly marked rather than inferred.

In `npm run dev`, click **Edit act details** to add selectable challenges and notes per season, difficulty, and act. Drafts persist in this browser. Download the act details JSON, replace `src/data/theater-act-details.json`, then commit and redeploy to share the details. Published visitors see the recorded details without editing controls. The scheduled lineup updater does not overwrite this file.

- Character icons are copied from the sibling `genshin-shared/icons` directory into the build output.
- Ownership, challenge setup, and planner selections are saved to browser `localStorage`. Traveler versions share one level setting in **Your Characters**.
- Use **Import GOOD JSON** in **Your Characters** to load a GOOD character export, such as [Irminsul](https://github.com/konkers/irminsul). The import replaces the current ownership list after confirmation, rounds levels down to the nearest 10, and ignores character keys not in the starter roster.
- Challenge Setup previews the selected season's four boss slots, including manual overrides, and blocks planner navigation until the account eligibility estimate meets the selected difficulty's minimum.
- In the planner, drag an eligible character directly to an act slot to add them to the selected cast and assign them in one step.
- The planner's character list can be sorted alphabetically or in game order (rarity, highest level, element, then newest release first). Opening characters and guests retain their season lineup order. Release dates are bundled locally.
- Act slot dropdowns support Up/Down arrow navigation through selectable characters and Enter to select. Escape closes the dropdown; exhausted and unavailable characters are skipped.
- Populated acts have copy and team-drag icons in fixed header positions. Copy highlights the source and reveals paste; a successful paste clears the clipboard. Escape, clicking outside the team controls, or focusing another control cancels copying. Pasting replaces the destination team and is blocked if any character would exceed two uses.
- Drag the team handle onto an empty act to move all four slots, or onto another team to swap all four slots. Swapping preserves each character's total number of uses, including characters shared by both teams.
- Enemy names and icons in the boss preview and act headings link to their Fandom pages. Lunar difficulty also previews listed Lunar Act enemies, including manual Lunar Act 2 overrides.
- The planner's chosen-character count is red below the non-borrowed entry minimum, amber once that minimum is met, and green at the cast cap. Text explains the entry requirement and the benefit of selecting additional characters for blessings.
- In Lunar difficulty, the ten normal acts remain in Visionary order; optional Arcanum Challenge 1 is placed after Act 3 and Challenge 2 after Act 6, matching their unlock points before Act 10.
- The character database in `src/characters.ts` is an editable **starter roster**, not a guaranteed complete or up-to-date game database.
- Difficulty thresholds are provisional. Verify official rules before treating the eligibility estimate as authoritative.
- Act assignments currently do not enforce Vigor, duplicate restrictions, or other game-specific rules.
