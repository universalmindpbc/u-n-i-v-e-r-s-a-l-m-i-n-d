
CHANGELOG.md

## 2026-06-29

- Started Version 0.1 static microsite scaffold.
- Added `index.html`, `styles.css` and `script.js`.
- Added full-screen scene structure with background video layer, 5 × 3 architectural panel grid, black focus veil, central hero casing, supplied logo mark, brand lockup and citation.
- Confirmed panel colour as `#ff005e` at 22% opacity.
- Switched the Problem hero from local MP4 preview to the official Vimeo player source, ID `1205354450`.
- Tightened the language lockup so `/ i am` sits directly after the active Universal Mind language text.
- Added flora logo favicon and Apple touch icon.
- Changed language cycling so the full brand lockup dissolves out before changing language, preventing abrupt `/ i am` repositioning.
- Corrected the brand suffix to `i a m`.
- Raised the top-left flora and brand lockup closer to the top of the screen.
- Added extra Arabic spacing before the slash in the brand lockup.
- Reworked brand animation into a 6-second two-step cycle: Universal Mind language dissolves in from 1-3 seconds, then `/ i a m` dissolves in from 4-6 seconds.
- Tightened `/ i a m` spacing so it no longer inherits the wide Universal Mind tracking.
- Reduced the pause between the Universal Mind language reveal and `/ i a m` reveal to roughly one third of the previous timing.
- Replaced variable slash spacing with fixed 14px spacing before and after `/` for every language.
- Extended the completed-brand hold so the next language does not arrive too quickly after `/ i a m`.
- Added a small English-only optical spacing correction before `/` so `universalmind / i a m` reads balanced despite wide tracking.
- Added the same optical correction for Mandarin before `/`.
- Made the black hero casing size from the 16:9 video frame plus fixed proportional padding, preventing the casing from becoming wider than the player on viewport resize.
