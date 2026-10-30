# Plain of Jars of the Stars

Owner reference: `design/references/starjars-board-owner.png`. Added as the optional `starjars` arena; Vat Phou remains the starting arena and its one-time migration marker is unchanged.

Three built-in generated painted assets (unmodified PNG masters plus optimized WebP copies) supply the silver-grey carved lanes, twilight jar landscape and parchment sidebar. Exact prompts and paths are in `prompts/starjars-arena.txt`. Labels remain dynamic Lao text. Both sides use calm readable stone; location cards still replace their lane imagery.

The two illustrated arenas share board construction through CSS selectors and asset variables. The star arena adds a locally owned constellation halo, small stars and a soft light pulse on the lane engravings for legend/fusion reveals. Full/short/off and reduced motion are respected; skipping removes the layers and cancels lane animations. No Vat Phou gate or flower sprites appear in the star entrance. No gameplay or balance changes.

The owner's follow-up asked for the special-card and log popups to match the selected arena. Render now supplies the active theme to `#app`, so sibling dialogs inherit their theme rather than the fixed purple material. All five arenas have matching surfaces, borders, readable text and close buttons; settings and the discard viewer follow the same palette. Modal backdrops remain transparent. Special cards use centered responsive columns, and the close button remains reachable with scrolling.

The localhost preview accepts `?theme=starjars`, supports changing arenas, placing/removing sample cards, legend/fusion previews and opening the actual special-card/log dialogs. It uses a mock match without remote game writes or rewards.

Validation: WebKit integration exercises all five themes' special-card/log/discard dialogs, viewport fit and closing, persistence, new artwork, full/short/off and skip cleanup, unchanged gameplay signatures and zero browser errors. Reviewed desktop and mobile screenshots. Existing Vat Phou integration still passes (65 checks). Engine/CSP and the dashboard bundle regenerated. This work is local, not committed or deployed.
