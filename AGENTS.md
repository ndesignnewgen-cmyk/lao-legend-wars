# Lao Legend Wars (ສົງຄາມຕຳນານລາວ) · guide for coding assistants

A trading card game for teens and adults (18+ is fine, the owner said so on 2026-10-31) built on Lao folklore, present-day Laos, the future and space. 25 decks, bot play,
online play, ranked, friends, a card shop with earned gems and owner-approved BCEL gem top-ups. Read this whole file before changing anything.

## Talking to the owner
- **Reply in simple Lao.** The owner can't read English. Short sentences, numbered steps, no jargon.
  English is fine inside code, comments, commit messages and this file.
- Before a step only the owner can do (Supabase, Google, domain, image generation), give the exact clicks.
  For SQL: give the raw GitHub link, then "Cmd+A → Cmd+C → Supabase → SQL Editor → New query → Cmd+V → Run".
  "Success. No rows returned" means it worked.
- The owner generates pictures elsewhere (ChatGPT, Codex) from prompt files in `prompts/` and sends a zip or images.

## Hard rules
- Audience: not a kids' game any more (owner, 2026-10-31). Glamorous or sexy character outfits are allowed when the owner
  asks (tasteful, no nudity, no explicit sexual content; draw every such character clearly as an adult).
  Still: no blood, no horror faces, no screen shaking, no typed chat.
  Say "ຖວາຍພະລັງ" (offering), never "ສັງເວຍ" (sacrifice).
- No full-screen dark or white overlays. The owner reads them as "fog" and calls it a bug. Put a dark disc
  under an effect instead.
- Balance target: every deck wins 45–56% against the medium bot (`__sim`, see Testing).
- Security: never ask for or accept the Supabase service_role/secret key or the database password, SMTP or app
  passwords, or any personal password. The owner creates accounts and runs SQL themselves.
  The publishable key in the code (`sb_publishable_…`) is public by design.
- Never commit secrets. Commit only when asked (the owner usually says "commit" or approves a plan), then `git push`.
- Payments (owner approved 2026-10-30): special gems may be bought and exchanged one way at 100 special → 500 game gems.
  Paid balances, orders, exchange and purchases are server-authoritative. Credit BCEL top-ups only after an admin
  verifies an actual bank transaction; a customer reference or uploaded image alone is not payment confirmation.

## Where things live
- `index.html`: the whole game, one file (~850 KB): CSS, then one big `<script>` with the engine in an IIFE.
- `art/`: masters `art/<id>.jpg` (760 px wide), the in-game copies `art/w/<id>.webp` (560 px),
  showcase cutouts `art/cut/<name>.webp`, deck boxes `art/box-d<no>.webp`, packs, UI icons `art/ui/`,
  rank emblems `art/rank/`, effect art `art/fx/`.
- `cards.html`: the printable card gallery.
- `supabase/f1.sql … f13.sql`: server SQL, run in order by the owner. `email-templates.md`: Supabase email setup.
- `PLAN.md` (Lao): every phase, what is done (✅), half done (🔶), waiting (⏳). Update it after each piece of work.
- `design/new-decks-10.md`: the design of decks 15–24.
- `prompts/`: image, music and sound prompts given to the owner.
- `tools/`: `webp.sh` (makes art/w copies), `cutout.swift` (lifts a subject off its background for showcases),
  `wk.swift` (headless WebKit/Safari screenshots and checks), `fxart.swift`.
- `sw.js`, `manifest.webmanifest`, `icons/`: installable app.

## Hosting
- Public site: **https://laolegendwars.com/** (GitHub Pages from `main` of github.com/ndesignnewgen-cmyk/lao-legend-wars;
  `git push` redeploys in about a minute). The old https://ndesignnewgen-cmyk.github.io/lao-legend-wars/ hands each
  browser's save over to the new address (code at the top of the script).
- A claude.ai artifact copy exists (https://claude.ai/artifact/AVNXbL4vuhD9BTKCvU6MdR). Only Claude can publish it.
  It is at its 511-file cap: pictures it lacks load from the public site (`SITE` in the image error handler).
- Backend: Supabase project `lao-legend-wars`, URL https://xahuvoounkdojfsvnfaj.supabase.co. supabase-js 2.45.4 is
  loaded lazily (`sbLoad`).

## Engine map (search these names in index.html)
- Cards: `def(id, {...})` fills `C`. Fields: `name, tribe, cost, power, type ('char'|'spell'|'item'|'trap'|'loc'),
  kw:{taunt, fly, rush, shield, guard, drain, grow, poison, block, quick, hide, duel, rally}, legend, tag, skill, lore,
  bonus (items), buff (locations: +1 to a tribe), fusion:[a,b], ritual, cd (countdown), mech (deck meter),
  own (a villager that is not neutral), token, ph (emoji placeholder art), img`.
- `ALT` = special-art image per card. `CUTS` = cutout boxes for showcases. `TALES` = 3-card story pages.
  `DECKS` = deck list (see below). `TC`, `TRIBE_NAME`, `TFX`, `SYM` = tribe colour, name, particles, icon.
  `KW_HELP` = keyword explanations shown in the card panel. `BOXES` = deck box art per DECKS index.
- Rules flow: `playCard` → `onPlay` (enter effects, a `switch` on card id) / `castSpell` (spells) / items / traps
  (`springTrap`) / locations. Fights: `attack`, `duel`. Power: `pow(p, c, vs, att)`. Costs: `costOf`.
  Targets: `targetsFor(p, id)` (+ `OPTIONAL` for targets you may skip), `attackTargets`.
  Turn start: `turnStartEffects`. Turn end: `turnEndHooks` (called from both `endTurn` and the hard bot's `passTurnSim`).
  Deaths: `destroy`, `checkDeaths`. Helpers: `zap(t, n)` (destroy if power ≤ n), `summon`, `bounce`, `heal`,
  `damageHero`, `draw`, `tutor`.
- Deck meters: `mechOf(list)` sets flags on each player when a deck holds cards with that `mech`
  (oar, basket, jar, volt, know, stars, yan); `meterLv(p)` draws them; fans (deck 12), water (deck 10), sword spirit
  (deck 14) are older meters with their own code.
- Bots: easy = random, medium = `botPick` (a score per card id: add one for every new card or it is never played
  well; spells score 0 unless listed) + `botTarget`, hard = rollouts on `cloneState` (copy every new player/card
  field there too) scored by `evalState`.
- In a game `render()` patches the board with `morph` instead of replacing it (full replacement repainted every card and
  shadow each move: the main source of jank). Elements live on between renders: attributes, classes and inline styles are
  reset to the new HTML, but a WAAPI animation with `fill:'forwards'` on a board element must be cancelled by its effect.
  `__dbg.morphCheck()` compares the patched board with a fresh one (true = same).
- Online: both screens run the same seeded game; game logic must use `rnd()`, never `Math.random()`
  (Math.random is fine for looks only). Snapshots are full JSON of `S`.
- Constants used inside `def(...)` must be declared earlier in the file (a later `const` = TDZ error that breaks the
  whole page, e.g. `POISON`, `SHIELD`).
- DECKS index ≠ deck number. `DORDER` sorts by number. Index → no:
  0:1 1:2 2:3 3:5 4:4 5:6 6:7 7:8 8:9 9:10 10:13 11:11 12:12 13:14 14:18 15:19 16:23 17:16 18:15 19:21 20:17 21:20 22:22 23:24 24:25.
  The server uses the index (catalog `decks`, hard-bot legend array in `eco_game`, deck packs), so never reorder;
  append new decks at the end.

## Secure games (supabase/functions/secure-game, f14–f16)
- Accounts play through the edge function `secure-game`: it runs the game on the server (`_shared/engine.mjs`) and only
  its results pay gems or rank. `engine.mjs` is GENERATED from index.html: after ANY change to the browser script run
  `python3 tools/build-security.py` (or `node tools/build-security.cjs`). It also refreshes the CSP hashes in the
  `<meta http-equiv="Content-Security-Policy">` — skip it and the browser blocks the whole script. It deletes every
  literal `<meta http-equiv="Content-Security-Policy"…>` up to the next `>`, even inside the script: build such a string
  in two parts (see `updCheck`). `updCheck` reloads pages left open across an update.
- Bot games are fast: the browser imports the same `engine.mjs` (+ `security.mjs`), asks the server for the full start
  (`want:'full'`), plays every move locally at once (`localSend`) and sends the same moves to the server in the
  background (`localReplay`). If the server's copy ever differs (`localSig`), it falls back to the server copy.
- Effects in secure games are recorded, not run: `engine-runtime.inc` swaps each `fx…` function for a `captureVisual`
  recorder and the browser replays it in `secureEffect`. The server always has `S.fast` on, so never wrap an effect
  call in `if(!S.fast)` (the effect checks it itself), and a NEW effect function needs a recorder line in
  `engine-runtime.inc` (+ the side flip list if its first argument is a player index) and a `secureEffect` case.
- Online rooms: moves wait for the server; the mover broadcasts `rev` on Realtime channel `sec-<code>` so the other
  screen polls at once (`secureNoticeOn`).
- Deploy after changing anything under `supabase/functions`: the owner runs `sh tools/deploy-security.sh` in Terminal
  (Supabase CLI, browser sign-in). The owner's Mac has NO Supabase CLI (and no Node): use the dashboard way instead —
  `build-security.py` also writes `supabase/secure-game-deploy.txt` (one file, no secrets); after a push the owner opens its
  raw GitHub link → Cmd+A → Cmd+C → Supabase → Edge Functions → secure-game → Code → index.ts → Cmd+A → Cmd+V → Deploy updates. Localhost test without Supabase: set `window.__secureMock` to a function that
  answers like the server (see git history of this file's commit for an example) and call `__dbg.secure.bot(...)`.

## Adding a deck (checklist)
1. `def` every card (tribe new? add `TC`, `TRIBE_NAME`, `TFX`, `SYM`). Mechanics in onPlay/castSpell/pow/targets/
   turn hooks. Keyword text in `KW_HELP`.
2. `DECKS` entry at the end: `{no, name, legend, aggr, style, list:{id:n}}`, 30 cards, max 3 copies, 1 legend.
3. Bot scores in `botPick`, new fields in `cloneState`, a tale in `TALES`, `ALT` entries, a box in `BOXES`.
4. Art: `art/<id>.jpg` → `bash tools/webp.sh`. Until art arrives use `ph:'emoji'`.
5. Balance with `__sim` to 45–56%.
6. Server: a new `supabase/fN.sql` with catalog rows (`rarity`: legend → 'legend', cost ≥ 5 → 'rare', else 'common';
   fusion/ritual/token cards are not packable) and, for a new deck, `eco_game` with the longer legend array.
   Test SQL on a throwaway local Postgres if you can. New tables need explicit `grant … to authenticated`.

## Testing
- Local server: `python3 -m http.server 8123` in this folder, open http://localhost:8123/
  (`.claude/launch.json` has it). Debug hooks exist only on localhost: `window.__dbg` (S, render, C, fx tools),
  `window.__sim(n, level)` runs bot-vs-bot games and returns wins/plays per DECKS index (level 1 = medium).
  Example: `__sim(24*23*8, 1)`; read `wins[i]/plays[i]`. Check `errors` is empty.
- Syntax check without a browser: extract the largest `<script>` into a file and run macOS
  `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc` with `checkSyntax("main.js")`.
- Safari: `swiftc -O tools/wk.swift -o /tmp/wk && /tmp/wk URL width height test.js shot.png`. Safari bugs found so
  far: `height:100%` inside size containers, negative canvas arc radius, frame time going backwards.

## Status (2026-10-30)
- Done: 24 decks with art and balance (43–57% medium); fusions incl. special art; rites; tales; festivals;
  adventure map (11 stages); accounts, cloud save, levels, gems, packs, ranked, friends, safety and admin (F1–F7);
  player ID card and email + password sign-in (F8, f12.sql); login page and new home screen (F9, f13.sql);
  code-made music and sounds (H1–H2), recorded music files; new settings screen; effects G1–G3.
- Waiting on the owner: run f12.sql and f13.sql if not yet; Supabase «Confirm email» off or SMTP (Resend) set;
  7 home-screen pictures (`prompts/ui-home.txt`).
- Open: hard-bot balance (31–70%), effects G4–G7, adventure stages and showcase cutouts for decks 15–24,
  replays/spectating.
