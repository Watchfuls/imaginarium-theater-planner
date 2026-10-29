# Imaginarium Theater Planner

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

- Character icons are copied from the sibling `genshin-shared/icons` directory into the build output.
- Ownership, challenge setup, and planner selections are saved to browser `localStorage`.
- Challenge Setup previews the selected season's four boss slots, including manual overrides, and blocks planner navigation until the account eligibility estimate meets the selected difficulty's minimum.
- In the planner, drag an eligible character directly to an act slot to add them to the selected cast and assign them in one step.
- In Lunar difficulty, the ten normal acts remain in Visionary order; optional Arcanum Challenge 1 is placed after Act 3 and Challenge 2 after Act 6, matching their unlock points before Act 10.
- The character database in `src/characters.ts` is an editable **starter roster**, not a guaranteed complete or up-to-date game database.
- Difficulty thresholds are provisional. Verify official rules before treating the eligibility estimate as authoritative.
- Act assignments currently do not enforce Vigor, duplicate restrictions, or other game-specific rules.
