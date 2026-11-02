# Universal Mind Lab — lineup art direction

Updated: 2 November 2026.

## Direction agreed for this revision

The artist treatment is Tame Impala, Justice, Flume and Sampa the Great, followed by “+ more”. Artist participation remains proposed and unconfirmed. Ben approved adding the four logos in this revision, with the artwork visible only at the opening and final wide overview of the animated journey. Close views and the individual destination tour remain clear of the lineup treatment.

Place the artist group to the right of the main Next Generation Lab tagline where the wide layout permits. Retain the Universal Mind Lab identity as the primary identity. Give the four artist marks comparable visual weight and preserve their original proportions. The very wide Sampa mark needs optical balancing with the taller Tame Impala and Justice marks; equal CSS width alone is not a sufficient visual rule. Portrait phones use a compact single row beneath the headline with a soft daylight wash for contrast; landscape phones use two rows. Overview scene labels are hidden on portrait phones while the artist group is visible.

Use one quiet, consistent monochrome treatment: deep charcoal `#243b37` in the daytime view and warm ivory `#f1efe0` in the nighttime view. The surrounding environment supplies the colour and movement. Fade the entire artist group in and out together at the two overview moments.

Place this disclosure once in the footer, immediately beneath the initiative credit:

> Artists, festival partners and mental health partners are proposed and not confirmed.

Do not add a proposed-lineup label next to the artist logos.

## Prepared runtime assets

The files in `references/lineup/runtime-masks/` are standalone SVG assets intended for CSS alpha masking. They preserve the exact source artwork, with no redrawing or generative logo recreation. The embedded raster files retain their original bytes. SVG viewBox cropping removes empty outer margins only.

| Runtime file | Source selected | Intrinsic viewBox size | Preparation |
| --- | --- | --- | --- |
| `tame-impala.svg` | Clean stacked mark from the official artist homepage | 372 × 164 | Original transparent indexed PNG embedded in SVG; empty final row excluded |
| `justice.svg` | Transparent white mark from the official Justice site | 962 × 394 | Original transparent PNG embedded in SVG; outer transparent margins excluded |
| `flume.svg` | Exact inline vector from the official Flume homepage | 434 × 165 | Original SVG geometry and transforms preserved |
| `sampa-the-great.svg` | Ben’s supplied rounded wordmark | 1203 × 278 | Original transparent black PNG embedded in SVG; outer transparent margins excluded |

Apply `mask-mode: alpha`, `mask-size: contain`, `mask-position: center` and `mask-repeat: no-repeat`, then set the element background to the day/night ink colour. The assets work with their existing transparency; no luminance conversion is necessary. Supply accessible artist names alongside the decorative mask elements in the implementation.

Tame Impala’s official stacked mark is a clean alternative to the supplied red treatment with long vertical extensions. Sampa’s supplied rounded mark is deliberately retained: the current official site uses a different serif wordmark, archived separately for comparison.

## Original supplied files

All four originals are retained unchanged under `references/lineup/`. `supplied-manifest.json` records source paths, dimensions and checksums.

| Original | Dimensions | Transparency |
| --- | --- | --- |
| `tame-impala-supplied.png` | 500 × 400 | Opaque RGB |
| `justice-supplied.png` | 2793 × 1157 | Opaque RGB |
| `flume-supplied.png` | 500 × 500 | Opaque RGB |
| `sampa-the-great-supplied.png` | 2000 × 563 | RGBA; black artwork on transparency |

The Sampa file is valid artwork despite appearing black against a black chat background. Its visible content occupies x = 400–1602 and y = 144–421.

## Official source provenance

Retrieved on 2 November 2026. `references/lineup/official/provenance.json` records exact URLs, downloaded sizes and SHA-256 checksums.

- **Tame Impala:** [official artist homepage](https://www.tameimpala.com/); [exact stacked wordmark PNG](https://www.tameimpala.com/images/ti_stacked-w.png). The homepage uses this image with the alt text “Tame Impala”. Archived as `official/tame-impala-official.png`.
- **Justice:** [official artist site](https://justice.church/); [exact white wordmark PNG](https://justice.church/cdn/shop/files/justice-logo2019_blanc.png?width=1896). The server returned a 1000 × 427 transparent image. Archived as `official/justice-official.png`.
- **Flume:** [official artist homepage](https://flumemusic.com/). The SVG containing the `Flume-Logo` path was extracted intact from the homepage HTML and archived as `official/flume-official.svg`.
- **Sampa the Great:** [official artist homepage](https://sampathegreat.com/); [current official serif wordmark asset](https://images.squarespace-cdn.com/content/v1/579d8fcf2994ca7a06137459/63ff8f3e-de30-4f71-8dfe-6b25b79e2f63/logo25.png?format=1500w). The server returned WebP despite the PNG URL suffix; the original returned bytes are archived as `official/sampa-the-great-official.webp`. This is a comparison asset, not the selected runtime mark.

These source links document artwork provenance and do not establish artist participation or endorsement.

## Asset verification

The four runtime assets were rendered as CSS alpha masks in a dedicated headless Chromium process launched with `--mute-audio`. A static document tested the charcoal and ivory treatments; no media was loaded or played. All four wordmarks rendered correctly, including the supplied Sampa transparency. The browser was closed after capture.

`references/lineup/lineup-mask-check.png` records the asset check. It is a technical comparison sheet, not the final website composition. Website placement, responsive layout and animation visibility are validated by the parent implementation task.
