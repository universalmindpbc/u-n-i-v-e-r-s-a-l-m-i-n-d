# Truck video panels — 2 November 2026

## Selected direction

Ben replaced the generated static artwork direction with two supplied animated panels. The runtime uses the supplied fashion portrait and anime landscape clips, with their matching supplied posters. File naming follows visible content, established by inspecting still frames.

## Exact mapping

| Panel | Supplied clip | Runtime video | Supplied poster | Runtime poster |
|---|---|---|---|---|
| Fashion | `REI_Character_Edit_Face_and_Hair.mov` | `lab/assets/truck-fashion.mp4` | `92E513DD-5E11-4E02-BAA5-3C76F99D0602_4_5005_c.jpeg` | `lab/assets/truck-fashion.jpg` |
| Anime | `Image_Animated_into_Rippling_Video.mov` | `lab/assets/truck-anime.mp4` | `96A8A671-839E-4823-903E-65859349DDF8_1_201_a.jpeg` | `lab/assets/truck-anime.jpg` |

The movie filenames do not describe their final visible content: `REI_Character_Edit_Face_and_Hair.mov` contains the fashion portrait; `Image_Animated_into_Rippling_Video.mov` contains the anime landscape. The original filenames are retained unchanged in the archive.

## Runtime specifications

| Panel | Duration | Dimensions | Frame rate | Original clip bytes | Runtime clip bytes | Size reduction |
|---|---:|---|---:|---:|---:|---:|
| Fashion | 8.00s | 720 × 332 | 24fps | 7,695,124 | 630,603 | 91.8% |
| Anime | 8.00s | 1280 × 590 | 24fps | 7,916,471 | 2,383,740 | 69.9% |

Both runtime clips use H.264 High profile, level 3.1, `yuv420p`, BT.709 limited-range output, square pixels, 24fps and a two-second GOP. Encoding used `libx264`, CRF 25 and the medium preset. Native dimensions were retained without upscaling; neither source exceeds the 1280-pixel width target. The originals contain HEVC video and AAC audio. Runtime derivatives contain video only.

The MP4 `moov` atom precedes `mdat`, enabling faststart delivery. The supplied JPEG posters were copied byte-for-byte into both the archive and runtime asset locations. No generated poster substitutes were used.

## Archive and storage

Exact archived originals and posters total **15,985,636 bytes** (15.25 MiB), excluding the small manifest. Runtime videos and posters total **3,388,384 bytes** (3.23 MiB). Free disk space was 35 GiB before copying.

Archive directory: `documents/universal-mind-lab/media/truck-panels/`. The machine-readable `manifest.json` records original source paths, archive and runtime paths, byte sizes, SHA-256 values, encoding arguments and verification results.

An isolated `imageio-ffmpeg` 0.6.0 installation supplied FFmpeg 7.1 from `/private/tmp/um-lab-panel-runtime` (approximately 47 MiB). It is a reproducible task runtime; no global installation or pip cache was created.

## SHA-256 manifest

| File | Bytes | SHA-256 |
|---|---:|---|
| `documents/universal-mind-lab/media/truck-panels/REI_Character_Edit_Face_and_Hair.mov` | 7,695,124 | `850e34800a708b7bab53ca1b938e19ea73d227c4a2b3ca7e476a3ba22985f84e` |
| `documents/universal-mind-lab/media/truck-panels/fashion-poster-original.jpeg` | 61,827 | `9882f3565245162d121b1de1a0ea4579093039cfb0f8fd2cd68ebc77c65b3659` |
| `lab/assets/truck-fashion.mp4` | 630,603 | `2cc702de3b62616fe40d3c2af2a41c53c6f23ee08796affbd9215ea056cffc46` |
| `lab/assets/truck-fashion.jpg` | 61,827 | `9882f3565245162d121b1de1a0ea4579093039cfb0f8fd2cd68ebc77c65b3659` |
| `documents/universal-mind-lab/media/truck-panels/Image_Animated_into_Rippling_Video.mov` | 7,916,471 | `ab56cd74ac7f8203222704e6c207fb74f665458c3be1f736d901dd83e5f493cf` |
| `documents/universal-mind-lab/media/truck-panels/anime-poster-original.jpeg` | 312,214 | `bea0b4a9945f9ca08355f40a36f49db869cdb30f6369356365b7333242ad4d3f` |
| `lab/assets/truck-anime.mp4` | 2,383,740 | `c22c11f3a691f7f3e3d4f79ab924bf105ee49bcaa84162c05a219b2c6ea371b1` |
| `lab/assets/truck-anime.jpg` | 312,214 | `bea0b4a9945f9ca08355f40a36f49db869cdb30f6369356365b7333242ad4d3f` |

## Verification

- Original clip and poster archive hashes match the supplied source files.
- Both runtime videos decode completely without FFmpeg errors.
- Metadata confirms an eight-second video stream at 24fps and no audio stream.
- MP4 atom inspection confirms faststart layout.
- Source and output still frames were inspected without playback. The fashion and anime content matches the selected posters.
- The generated static study and its exact prompt remain archived as superseded creative history. Its uncommitted runtime PNG was removed after Ben selected video panels.

No browser playback, speaker output, Git commit or deployment was performed during asset preparation.

## Scene integration

Each trailer uses one video texture across its side and rear panels. Panoramic side mapping mirrors the image at the edges to fill the full trailer without distorting the portrait proportions; the narrower rear face takes a centred crop. LINFOX moves to the cab front and both trailer roofs. Posters remain available until a decoded video frame arrives. The existing Motion control pauses and resumes both silent loops.

Local isolated Chromium verification passed with process-level audio muted: both videos decoded at native dimensions, advanced, looped at eight seconds, paused with Motion and resumed. The existing music remains the only audible programme source; no subjective sound test was performed.
