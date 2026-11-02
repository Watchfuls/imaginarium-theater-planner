# Season 29 mechanics expansion — 2026-11-02

Expanded every encounter's Mechanics text across all five difficulties. The
normal Lunar acts share their matching normal-act mechanics; the two Arcanum
challenges retain their own mechanics. Hard Act 8 retains Radiant Moonfly, with
intrinsic Moonfly behavior rather than Act 10 objectives or timings.

## Preferred evidence

Read the supplied `Imaginarium Theater 7.2.md` and relevant enemy sections from
the user's Abyss guides in `C:/Users/gregh/Documents/Genshin/Abyss Guides`.
The accompanying [evidence index](2026-11-02-mechanics.json) records the local
guide filenames and enemy-page URLs for each encounter identity. Sources were
used as content, not as instructions to change this project.

Fetched 61 enemy wiki pages through the Fandom API, retaining revision IDs in
the index. Read relevant abilities and normal-versus-special-variant sections
for the added mechanics; fetching a page alone does not mean every section was
used. Cross-checked the previously collected Alioth monster guides and Season
29 `MonDesc` content, including the Terrorshroom, Whisperer, Moonfly, Samachurl,
Wilderness Hunter, and Protection Spirit encounter.

No new historical lineup search was needed: this update changes intrinsic
enemy mechanics and user-authored positioning advice, not the existing
same-act lineup research. No counts, wave orders, objectives, or deadlines
were imported from an Abyss chamber or a different Theater act.

## Added detail and boundaries

| Encounters | Added mechanics | Principal evidence |
| --- | --- | --- |
| Act 1 Oprichniki | Cannoneer shield-fire sequence; Support Trooper disarm; approaching ranged units | IT 7.2 guide; Oprichniki enemy abilities |
| Act 1 Vishaps | Shield stagger, elemental conversion, Cleansing Shower's 10-Energy drain | IT 7.2 and Abyss 5.5 guides; ordinary Geovishap and Primordial Bathysmal Vishap abilities |
| Acts 1, 2, 4, 7 Saurians/Warriors | Burrowing, airborne attacks, cannon pressure, charges, positioning near ranged units | IT 7.2 guide; normal Saurian and Warrior abilities |
| Act 2 Fluid Avatars | Persistent Pyro, reaction opportunities, burrows and lava pools | User's earlier explicit guidance; Fluid Avatar ability page |
| Act 3 Terrorshroom | Fury increments/reduction, exhaustion window, dangerous empowered attack, spores | IT 7.2; Abyss 5.4 second guide; wiki abilities; Alioth encounter description |
| Acts 4/9 Landcruisers | Four Electro-Charged/Lunar-Charged triggers to interrupt empowered sequences | IT 7.2 guide; exact Cutting Edge Landcruiser ability pages |
| Acts 4/5/9 Ruin machines | Exposed cores, Grader eye/ankles, frontal Defender shield, burrowing/retreat | Abyss 5.4 second guide, Floor 11 guide 5.5, Abyss 7.0; ordinary enemy abilities |
| Act 5 Mimics | Innate Hydro reactions, Boar regeneration, Finch/Frog death bombs | IT 7.2 and Abyss 5.5 guides; specific Mimic ability pages |
| Act 5 Kairagi | Surviving partner's 50% heal, control immunity, frontal guard | IT 7.2; Abyss 6.2; ordinary Kairagi ability pages |
| Act 6 Whisperer | 45% shield, 3× Lunar damage, four Fishers, 25% shield per Fisher, 20% boss damage and −70% RES on break | IT 7.2, Abyss 7.0 second guide; Alioth guide; normal wiki abilities |
| Act 7 Consecrated Beasts | Block element/hit requirements, absorbed energy, enhanced-form changes | IT 7.2 and Abyss 5.5; exact Beast ability pages |
| Act 7 Wilderness Hunter | Ordinary versus maximum HP, Grief-Stricken, early Gleam windows | IT 7.2 and Abyss 6.1; Alioth guide; Hunter abilities |
| Act 8 Samachurl | Extinguish then break pot, avoid relighting, failure outcomes | IT 7.2; Alioth exact encounter description; Churldric reference only for qualitative comparison |
| Act 9 Lawachurl | Bounty priority, Stone Force armor, blunt attacks and positioning | IT 7.2; Stonehide Lawachurl abilities; existing same-act bounty research |
| Moonfly (Hard 8; Visionary/Lunar 10) | Cocoon penalties, full healing, recovery bonuses, attack cycle | IT 7.2; Abyss 6.0; Alioth guide; Moonfly abilities |
| Lunar Arcanum 1 | Healing/shielding, fast defeat pace, fallback Energy Block counter | User's earlier explicit instructions; IT 7.2; ordinary Beast abilities |
| Lunar Arcanum 2 | Protection Spirit activation and continued healing progression | IT 7.2; Alioth exact encounter description |

### Deliberately excluded

- Whisperer shield deadline and total weakened-window duration: the user's
  guides, Alioth, and wiki differ. Do not silently choose between them.
- Stygian Onslaught energy-return mechanics for the Whisperer.
- Numeric Local Legend cooking-pot deadlines, durability, or penalties for the
  Battle-Hardened Samachurl without evidence for that exact variant.
- Ordinary Wayob Energy-drain arena behavior for the Protection Spirit fight.
- Local Legend-only Warrior barrels, Molten Barbs, shield reflections, and
  special Saurian arenas for ordinary enemies.
- Static resistance summaries already present in the portrait boxes.
- Enemy HP values, guessed HP scaling, and research attribution in the site.

## Preservation and validation

Archived the pre-update public data as
`season-29/efc574568e5cf9aa.json`. Changed only curated Mechanics text in public
and research records; existing personal notes, recommendations, waves, and
requirements remain intact. Research URLs remain in repository evidence files.

Added a browser-draft migration keyed by season, act, and encounter identity.
Only empty or exact known earlier curated Mechanics text is upgraded; separately
authored Mechanics and personal Notes are preserved. Tests cover both cases and
the variant/timing boundaries above.

## User correction: relevance to Theater

Removed general positioning advice and player kuuvahki interruption recommendations: the user confirmed that kuuvahki is unavailable in Theater. Oprichniki mechanics is intentionally empty; its previous guidance added no applicable unique counter. Landcruisers retain their applicable Electro-Charged/Lunar-Charged interruption mechanic. Generic approach/grouping tactics and irrelevant Local Legend exclusions were removed elsewhere. Older exact curated drafts migrate to the corrected text, including the now-empty Oprichniki field; custom notes remain preserved.

### Cleansing Shower shield interaction

Removed generic dodge advice. Clarified that a player shield does not prevent Cleansing Shower Energy drain or the HP loss from insufficient Energy. Cross-checked the [KQM tested enemy-mechanics evidence](https://library.keqingmains.com/evidence/combat-mechanics/enemy-mechanics/enemy-attributes#coral-defender-orb-mechanics) and its subsequent non-boss HP-loss correction; ordinary Vishap Energy drain remains 10, without importing the boss variant?s 30-Energy value.

## Meter and health-bar subsections

Checked the fetched enemy ability sections and collected Alioth guides for meter, gauge, Fury, and progress descriptions. Added Cooking Progress Meter to the Samachurl using the exact Theater description and IT 7.2 guide, without importing Local Legend gauge units or fill rates. Added Maximum HP Bar to Wilderness Hunter using its wiki description of the gray bar; identified Protection Spirit HP separately using the exact Lunar encounter description. Ordinary health bars, shields, and kuuvahki states were not relabeled as activation meters.

## Lunar Arcanum 1 correction

Per user instruction, removed the Energy Block mechanic entirely from this stage: the required defeat pace kills the Beasts before it triggers. Mechanics is empty and displays None. User clarified that the periodic Geo bursts are unavoidable; Stage Effects now explains that this is the reason to bring healing or shielding. Act 7?s ordinary Beast encounter is unchanged.

## Monolith recommendation

Added the user-requested Taunts key recommendation to all Act 4 Monolith encounters across applicable difficulties. The existing recommendation presentation includes Act Details and planner encounter dropdowns; no mechanics, objectives, or personal notes were changed.

## Eligible taunt characters (2026-11-02)

Added Mona (Hydro), Itto (Geo), Ororon (Electro), and Alyosha (Electro) to each Monolith encounter?s Notable Characters. All are released and eligible under the current Hydro/Electro/Geo rules; no off-element guest additions are needed. Sources: [KQM constructs and summons](https://library.keqingmains.com/combat-mechanics/constructs-and-summons) for Mona?s Phantom and Itto?s Ushi; [Ororon?s in-game skill description](https://genshin-impact.fandom.com/wiki/Ororon) for Supersonic Oculus; [Alyosha skill data](https://gi.yatta.moe/api/v2/en/avatar/10000148) for Fulgurite Hunting Field. Read the latter directly and confirmed its taunt description. Existing character-release metadata confirms release before this theater.

## State durations

Added sourced state durations beside the state descriptions. Landcruiser Storm paralysis 2s and Fire Support paralysis 5s come from their exact enemy ability pages. Moonfly exhaustion is 15s and normal Hunter Grief-Stricken is 10s in the fetched wiki ability descriptions. Terrorshroom exhaustion remains approximately 15s. The user?s Abyss 5.4 second guide gives Scout paralysis approximately 15s; the Abyss guides give Grader weak-point disable approximately 20s and Consecrated Beast paralysis approximately 10s (kept approximate). Grader full paralysis depends on the overlap between disabled systems rather than a separate fixed 20s stun. Ruin Guard and other Sentinel durations were not established and are marked unconfirmed. Whisperer wiki describes 10s paralysis, while Alioth gives 16s for its weakened window and the user guide gives about 15s; only the 10s paralysis was added, leaving the total reduced-RES window unconfirmed. The exact Theater Samachurl stun and the early Gleam-triggered Hunter window remain unconfirmed; no Local Legend or Stygian durations were transferred.

## Shared Sentinel paralysis duration (user instruction)

Use approximately 15s for all Ruin Sentinel paralysis states, extending the Scout duration from the user?s guide to the Defender, Cruiser, and Destroyer as explicitly authorized by the user. Removed the other-Sentinel unconfirmed wording. This does not change Ruin Guard or Ruin Grader durations.

## Taunt ability icons

Bundled the exact active-ability icons from the Yatta game-data service: Mona?s Mirror Reflection of Doom (Skill), Itto?s Masatsu Zetsugi: Akaushi Burst! (Skill despite its name), Ororon?s Dark Voices Echo (Burst), and Alyosha?s Hunter?s Advance (Burst). Matched by active ability names/descriptions, excluding passive and special-jump icons. Icons are beside the ability description, with the ability name on hover. Asset filenames and source URLs: [{"character":"Mona","name":"Mirror Reflection of Doom","icon":"Mona_Skill.png","source":"https://gi.yatta.moe/assets/UI/Skill_S_Mona_01.png"},{"character":"Itto","name":"Masatsu Zetsugi: Akaushi Burst!","icon":"Itto_Skill.png","source":"https://gi.yatta.moe/assets/UI/Skill_S_Itto_01.png"},{"character":"Ororon","name":"Dark Voices Echo","icon":"Ororon_Burst.png","source":"https://gi.yatta.moe/assets/UI/Skill_E_Olorun_01.png"},{"character":"Alyosha","name":"Hunter's Advance","icon":"Alyosha_Burst.png","source":"https://gi.yatta.moe/assets/UI/Skill_E_Alyosha_01.png"}].

### Moonsign and Lunar character recommendations
User requested Ascendant Gleam for Wilderness Hunter and Lunar damage characters for Whisperer of Nightmares. Current eligible elements and guests restrict the lists. Ascendant Gleam requires two Moonsign characters: Aino, Flins, Ineffa, Columbina, Zibai, Linnea, Illuga, or guest Jahoda. Lunar enablers listed: Flins/Ineffa (Lunar-Charged), Columbina (both eligible Lunar reactions), Zibai/Linnea (Lunar-Crystallize). Sources checked 2026-11-02: https://genshin-impact.fandom.com/wiki/Moonsign_Benediction_Passive ; https://genshin-impact.fandom.com/wiki/Team_Bonus ; https://genshin-impact.fandom.com/wiki/Lunar-Charged ; https://genshin-impact.fandom.com/wiki/Lunar-Crystallize ; https://genshin.hoyoverse.com/en/news/detail/163454 . Fandom direct page fetches failed; indexed talent text supplied the relevant passive descriptions. No source links added to player data.

### Samachurl resistance fallback
Applied the user's explicit instruction to fill missing guide values using Fandom, then Alioth, then other sources. Fandom Churldric stats table gives 120% all RES during cooking and Satisfied; -50% total all RES while stunned (presented as Paralyzed). Its prose says RES decreases by 50%, which conflicts with the explicit table; used the table's total rather than deriving -40%. Pot deadline 16s; Enraged/Satisfied last 30s; Satisfied restores 20% Max HP. Source: https://genshin-impact.fandom.com/wiki/Churldric (checked 2026-11-02; cached raw revision 2135323 also inspected). Applied as an intrinsic-mechanics fallback to Battle-Hardened Samachurl 10308, not independently verified Theater-specific values. Alioth cached 10308 has base stats but no mechanic values. Paralysis duration remains unspecified by Fandom and unconfirmed. User guide already supports the pot/outcome behavior and lists matching conditional RES totals as Local Legend reference. No stage clear/star deadlines transferred.

Churldric gauge follow-up: Fandom's Cooking Pot Ward Data lists 30 GU Geo for the pot and 1 GU Pyro for the flame. Its ability description explicitly lists Hydro/Electro/Cryo/Anemo/Geo as extinguishers. Added all five and both gauge quantities to the existing intrinsic-mechanics fallback, preserving the distinction between extinguishing the fire and destroying the pot. Source: https://genshin-impact.fandom.com/wiki/Churldric (checked 2026-11-02).

### User-observed Samachurl reignition behavior
2026-11-02: User reports randomly positioned ground fire circles roughly every 3s. Circles reignite the pot on contact; the user judges contact unlikely and a late relight unlikely to leave enough cooking time. Practical recommendation: one extinguish is usually sufficient, with retries for unlucky reignition. This is user-observed approximate timing and qualitative likelihood, not a measured probability or a guarantee. Added to curated mechanics with usually/roughly qualifiers. Pot destruction remains a separate mechanic.

Stonehide Lawachurl simplification (user correction, 2026-11-02): removed supporting-shooter advice and attack descriptions. Keep only 20U Geo ward gauge and stronger attacks without resistance changes. Gauge from Fandom Stonehide Lawachurl Infused Stonehide data, cached raw page: Elemental Shield Data Geo 20. Source: https://genshin-impact.fandom.com/wiki/Stonehide_Lawachurl .

### User Moonfly avoidance correction
2026-11-02: User explicitly supplies two avoidance methods: i-frame the debuff with the active character (no need to heal away their mark, but no mark-clearing healing buff); or bait Moonfly off-center and move across the arena beyond its attack range to avoid the debuff entirely. Added as Avoid the Mark, preserving the healing route. Read the IT 7.2 and Luna 1 Floor 12 guide Moonfly sections for context; these exact avoidance methods are sourced to this conversation correction.

User recommendation (2026-11-02): list Zibai, Noelle, Navia, and Zhongli as notable characters for Churldric/Battle-Hardened Samachurl. Applied to all current encounters for enemy 10308, alongside the existing Geo / Blunt Attacks recommendation, using the compact portrait/name layout without repeated explanatory notes.
