# Repository instructions

## Updating Act Details

When asked to update, populate, research, or refresh Act Details for a theater,
read and follow [docs/act-details-workflow.md](docs/act-details-workflow.md).
That document is the standing brief: do not ask the user to repeat the sources,
format, coverage, or historical cross-reference requirements.

For public Act Details, use the user's notes/guides and explicit corrections,
then official Fandom records and other official sources. Do not use Alioth or
other unofficial sources to fill gaps in public data. Keep unofficial preview
research in ignored `private-local/` files only. Respect the exact variant and
preserve uncertainty in the notes.

Historical lineup references must be within the same act number. Match each
Lunar challenge only to that same Lunar challenge. Do not borrow objectives,
timers, waves, or effects from another act, even for an identical enemy.

This is an on-demand research and data update, not a request to add scheduled
automation. Preserve user-written notes and existing unrelated changes.

Before replacing or removing theater data, archive its latest curated details
with `npm run archive:act-details`. Preserve all snapshots in
`docs/act-details-archive`. Consult this local archive before external history
when researching future encounters, matching only within the same act and
difficulty context (and the same numbered Lunar challenge). Record whether a
value is user-authored, graphic-sourced, inferred, or directly verified. Never
discard our own collected times, mechanics, or notes because a source site lacks them.

Keep research URLs and attribution outside the shipped site and editor, in
`docs/act-details-research` only. The public act JSON must contain gameplay data
and explicit enemy IDs, without source links or research commentary.
Enemy portraits and names may link to their Fandom enemy pages as player
navigation; these links are distinct from historical research cross-references.
