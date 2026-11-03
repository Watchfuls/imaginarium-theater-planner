# Season 29: newly populated Fandom battle table comparison

Compared on 3 November 2026 (Europe/London). The initial comparison was read-only; the subsequent in-game verification update is recorded below. The comparison table describes the original audited state.

## Sources and scope

- [Fandom Season 29, 2026-11-01](https://genshin-impact.fandom.com/wiki/Imaginarium_Theater/Seasons/2026-11-01), revision **2200747**, timestamp **2026-11-03T06:57:07Z**. Read the complete battle wikitext through the MediaWiki Action API (`action=parse`, `prop=wikitext`); read revision metadata separately. The web page reader could not open the rendered page.
- Compared `src/data/theater-act-details.json`, `src/data/theater-enemies.json`, and `src/data/theater-bosses.json` with all **24** configurations in the current source: Acts 1-10, plus each numbered Arcana challenge separately. Compared lower-difficulty labels where explicitly given.
- Consulted `2026-11-01.md`, `2026-11-01.json`, and `2026-11-02-mechanics.md`, and all six local Season 29 archive snapshots. They consistently preserve the graphic-derived Act 9 elite 120/80 timings.
- Read the applicable Act 1 and Act 9 sections of the user's `C:/Users/gregh/Documents/Genshin/Abyss Guides/Imaginarium Theater 7.2.md`, plus `Imaginarium Theater 7.2 Waves.txt`.
- Reopened `F:/GenshinTemp/Graphics/IT/72/Act9.jpg` visually: its elite choice explicitly prints three bounties, 120 seconds clear, 80 seconds star, one active.
- No new historical-season inference was needed. The earlier audit documents 28 previous battle pages; this comparison did not re-read those external pages and does not claim a fresh historical survey. The current Alioth rendered page was inaccessible through the web reader; its previously collected evidence remains preserved locally.

## Findings

| Context | Current app | Current Fandom evidence | Assessment |
| --- | --- | --- | --- |
| Act 9, elite Ruin bounty, Visionary/Lunar | 3 bounty targets; 120 seconds clear, 80 seconds star | 3 targets; 100 seconds clear, 65 seconds star | **Main unresolved numerical conflict.** The user's graphic directly supports the app. The user's Markdown has 100/65 marked `[check]`, so those are not confirmed user observations. Preserve 120/80 pending a run or an explicit correction; do not silently override the graphic. |
| Act 1, elite saurian/warrior encounter, all applicable difficulties | Stage Effects is empty | Desolation plus Treacherous Thunder | **Missing stage-effect information.** The Dendro-cluster hazard belongs to this exact Act 1 elite battle; the thunder effect applies alongside it. This is directly verified against the current Fandom season table. |
| Act 1, ordinary Geovishap encounter | Generic Geovishap; some modes explicitly call its infusion unverified | Pyro Geovishap, followed by Primordial Bathysmal Vishap | **Variant qualification missing.** The user's own guide and wave notes already identify Pyro; Fandom corroborates them. The roster is otherwise correct. Updating this should not change the general shared enemy ID's name for unrelated encounters. |
| Act 2, elite timed bomb | Transfer mechanic is described generally | Transfers progressively shorten the timer and increase damage, up to four stacks | Additional verified stage-effect detail; the existing description is incomplete rather than contradictory. |
| Act 9, elite Duel Zone effect | Increased damage inside; periodic damage outside | Same effect, with an explicit two-second outside-damage interval | Additional verified timing detail. No need to alter the existing 40% value. |
| Hard Act 8 finale | Radiant Moonfly, 70-second target; clear deadline unconfirmed | Shared Act 8 section lists Samachurl; does not explicitly distinguish Hard-finale remapping | **Not resolved by this table.** Existing maintained boss-slot mapping is retained. Do not import Act 10 deadlines into Hard Act 8 or replace the finale from an ambiguously scoped section. |

## Matches and useful confirmations

- All 24 configurations match the app's enemy sets after accounting for naming aliases. The explicit Pyro qualifier is the one substantive variant refinement found. Two automatic name comparisons needed alias handling: Hilichurl Grenadier versus the catalog's plural spelling, and the Battle-Hardened Biting-Cold Wayob versus the maintained Potapo's Solidarity name. Those are not new enemy-set differences.
- Published finite waves agree with the app for Acts 1, 2, and 7. Current Fandom now confirms the previously inferred warrior wave orders. Choice ordering differs for the two normal alternatives in Acts 1 and 5; they are selectable alternatives, not successive waves or different lineups.
- The stated lower-difficulty levels match the app in Acts 1-6; the high-profile levels match Acts 7-10 and the two Arcana challenges. Hard Act 8's finale mapping remains the separate caveat above.
- Clear/star deadlines agree for Acts 3 (105/70), 6 (110/75), Visionary/Lunar 8 (110/75), and 10 (105/70), and Arcana II (125/85).
- Monolith countdowns and 35% star HP threshold agree. Act 5 clear/star quotas agree for all three choices. Both normal Act 9 bounty timers agree. Arcana I's initial 360-second countdown and ten-defeat star target agree.
- Boss mechanic summaries are broadly compatible with the app. The new season page does not independently establish every detailed gauge, resistance, paralysis duration, or user-observed interaction already researched; retain their existing provenance.
- Fandom does not repeat all of our graphic-sourced active-enemy counts and countdown reductions. Their absence is not contradictory evidence and is not a reason to remove them.

## Suggested next changes

For a subsequent authorized data update, archive the latest curated data first, then add Act 1 elite effects, qualify the Act 1 Geovishap as Pyro, and optionally expand the two stage-effect details above. Preserve user notes. Keep the Act 9 timer dispute in research until resolved by higher-priority evidence. No gameplay update or deployment was performed in this comparison.

## Follow-up: user-provided in-game screenshots

On 3 November 2026 the user supplied two screenshots for the same Act 9 Elite Assault Ruin-machine challenge:

- Performance Details directly shows the star target as **65 seconds**. The clear objective is generic and displays neither a clear deadline nor a numeric bounty quota. The number 110 beside the reward icon is a reward value, not a clear timer.
- Stage Effects directly shows the **40%** damage bonus inside the Duel Zone and damage **every 2 seconds** outside it.
- Neither screenshot identifies the difficulty. Updating both Visionary and Lunar's matching normal Act 9 uses the existing shared-act rules evidence; the screenshots do not separately verify each mode.

Archived the prior curated state as `docs/act-details-archive/season-29/ac1e1efe4ded0282.json` before editing. Changed only the matching Act 9 elite encounter in the public data and research dataset: star 80 to 65 seconds, and specified the two-second Duel Zone interval. Preserved the graphic-sourced **120-second clear deadline** until its actual starting countdown is confirmed. Fandom's 100 seconds remains corroborating evidence for a different clear deadline, not a value directly visible in these screenshots. All notes, enemy IDs, other encounters, and old snapshots are preserved. No deployment performed.

### Clear-time conflict resolved

The user then supplied an in-battle screenshot showing **1:38 remaining**, explicitly stating that it was **two seconds in**. This establishes a **100-second initial countdown** (98 remaining + 2 elapsed) through the screenshot plus the user's observation. Together with the Performance Details screenshot, the verified pair is **100 seconds clear / 65 seconds star**, corroborating current Fandom and superseding the old graphic's 120/80 pair. Archived the intermediate curated state before changing the clear deadline. Updated only this same Act 9 elite encounter in Visionary/Lunar; the mode applicability caveat above remains. No other act or Lunar challenge was used to infer these timings.

## Authorized Act 1 and Act 2 follow-up

Archived the latest curated state as `season-29/67ce5e5a576c33dc.json` before editing. Applied the following across each applicable difficulty (Easy, Normal, Hard, Visionary, Lunar; Lunar uses the existing shared normal-act rule):

- Act 1 elite saurian/warrior choice: added Desolation's pursuing Dendro cluster, its contact behavior, diminishing size/damage and increasing speed, plus Treacherous Thunder. **Directly verified** against this battle in current Fandom revision 2200747.
- Act 1 Vishap choice: explicitly qualified Wave 1 as Geovishap (Pyro), supported first by the **user-authored** IT 7.2 guide/wave notes and corroborated by the current Fandom table. Replaced obsolete infusion uncertainty with the existing intrinsic conversion rule applied to Pyro (+20% Pyro RES while transformed). Retained the generic shared enemy ID so unrelated Geovishap encounters are unaffected.
- Act 2 elite saurian/warrior choice: expanded Horrific Explosion to describe timed detonation, transfer to the nearest opponent on detonation or carrier defeat, timer reset, and progressively shorter timers/higher damage up to four stacks. Kept Treacherous Thunder. **Directly verified** against this exact Act 2 elite battle in revision 2200747.

No objectives, deadlines, waves, personal notes, or other acts were changed in this follow-up. Research attribution remains outside the shipped dataset. Earlier research caveats remain as historical evidence and are superseded only for the fields explicitly verified above.

## Treacherous Thunder: provisional current-run timing

On 3 November 2026 the user reported that thunder "seemed to start at 1:40" on the Act 1 Vishap choice. Their screenshot shows a Pyro Geovishap at level 85, an elapsed timer of **01:42**, zero of two opponents defeated, an 85-second star target, and the on-screen **Treacherous Thunder I** announcement.

- **User observation, provisional:** onset around 100 seconds elapsed for this specific Act 1 Vishap encounter.
- **Direct screenshot evidence:** the announcement is present by 102 seconds elapsed. A still image does not independently establish when the banner first appeared, or distinguish the announcement from the first damaging strike.
- The difficulty is not identified; level 85 alone does not distinguish Hard, Visionary, and Lunar. The `I` suffix is visible, but no escalation timing or later stage is inferred.
- Do not transfer this onset to Act 1's other choices or any Act 2 choice. No universal delay has been established. Keep the shared player-facing warning as "After a delay" until applicability is verified.
- No public gameplay values or notes were changed for this provisional observation.

The user subsequently reported that the hazard became more dangerous and reached **level II at around 02:00 elapsed** in the same Vishap run. Record this as a **user-observed, approximate** escalation at roughly 120 seconds. This suggests about 20 seconds between the reported level I and level II onsets in this run, but does not establish a fixed repeat interval, numerical damage increase, later levels, or applicability to other choices/difficulties. No second screenshot or exact transition timestamp was supplied. Preserve the shared generic warning until wider timing applicability is established.

The user then observed **level III at around 02:13 elapsed** in the same run (approximately 133 seconds). This is a user-observed approximate transition, without a supplied screenshot. The reported sequence is I ~100s, II ~120s, III ~133s; it does not support assuming equal escalation intervals. No exact damage scaling or applicability beyond this encounter/difficulty context is established.

### User-authorized approximate gameplay rule

After further checks in the same conversation, the user explicitly requested publishing the following practical rule for Season 29: **Act 1 roughly 10 seconds after the star deadline; Act 2 roughly 5 seconds after it; escalation about every 15 seconds up to Level V.** This supersedes the earlier instruction to keep observations in chat only, and the earlier decision to leave the shared warning without timings.

Observed normal-choice onsets reported by the user:

| Act / choice | Star target | Approximate Level I | Approximate offset |
| --- | --- | --- | --- |
| Act 1 Oprichniki | 80s | 92s | 12s |
| Act 1 Vishaps | 85s | 102s | 17s |
| Act 2 Tatankasaurus | 65s | 72s | 7s |
| Act 2 Fluid Avatars of Lava | 65s | 70s | 5s |

The user's later Vishap sequence settled on approximately 1:42, 1:57, 2:12, 2:27, 2:42 for levels I-V, with a reported apparent cap at V. The user also reported the same 15-second escalation in the Tatankasaurus choice. These are **user-observed approximate timings**, not frame-verified trigger times or independently datamined values. The Vishap onset is an outlier to the simplified Act 1 offset. Elite choices and separate difficulties were not independently timed; their inclusion in the shared warning follows the user's explicitly authorized rule. No fixed two-second announcement delay or damage multiplier is asserted.

The player-facing Season 29 shared warning now says "roughly" and "about" to preserve the intended approximation, once per act above all choices. Exact observations and qualifications stay in this research record; other seasons and unrelated stage effects are unchanged.

The user subsequently observed Act 1 Elite Assault level I starting at approximately **1:20 elapsed**, around five seconds after that choice's 75-second star target. They explicitly revised the requested player-facing rule to **roughly 5–15 seconds after the star deadline for both Acts 1 and 2**. This replaces the separate +10/+5-second approximation. The earlier Vishap observation (~17 seconds after) remains recorded as an approximate outlier; the new range is a practical user-authorized summary, not an exact bound. Escalation remains approximately every 15 seconds up to Level V.
