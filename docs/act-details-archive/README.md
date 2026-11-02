# Saved theater details

This repository archive preserves our own curated stage details, clear/star
timings, wave information, mechanics, resistance exceptions, and personal notes
after a theater disappears from the active site.

Run `npm run archive:act-details` before changing or removing theater data.
Each season receives a content-addressed JSON snapshot under `season-{number}`.
Repeating the command for unchanged data is harmless; changed data creates a
new snapshot without overwriting the old one. Commit new snapshots with the
season update. This is an on-demand command, not a scheduled service.

The default input is `src/data/theater-act-details.json`. Browser-only edits
must first be saved with **Download act details JSON** in the development
editor. Archive that export with:

```text
npm run archive:act-details -- "path/to/theater-act-details.json"
```

The command cannot read browser localStorage. Export the latest draft before
rotating a season; otherwise only the checked-in details are archived.

When researching a future theater, consult these snapshots and the companion
`docs/act-details-research` files first. The snapshot retains the original
`seasons[season][difficulty][act]` structure so a matching enemy can be checked
within its own act. Do not transfer a normal-act timing to a different act or a
Lunar challenge. Keep provenance and confidence from the research record; saved
estimates are not promoted to confirmed facts just because they were archived.

Archive and research files stay outside the public app bundle. Expired theater
data remains hidden from visitors.
