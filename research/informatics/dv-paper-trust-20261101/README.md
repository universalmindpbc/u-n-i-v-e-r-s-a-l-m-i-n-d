# Individual-paper Trust Factor correction · 1 November 2026

The published library used two visual conventions at once: the established 1/2/3 Trust Factor and a 0/1/2 display override retained from the earlier domestic-violence review package. The numeric paper ratings and filters already used the established scale, but the overrides drew fewer crosses. The prior chapter-only correction did not catch this mismatch.

The current user direction is implemented consistently:

- One cross: peer-reviewed publication.
- Two crosses: randomized controlled trial, including single-blind trials.
- Three crosses: verified double-blind randomized controlled trial.

The approved set contains 66 one-cross papers and 51 two-cross RCT reports (Vision 6, Language 45). None has verified double blinding. Sound has 8 one-cross papers. The chapter ratings remain Sound 1, Vision 2 and Language 2 because chapter thresholds require at least three distinct qualifying studies.

The renderer now draws the numeric score directly in chapter paper lists, search results and article dialogs. Published metadata and Universal One's evidence tool expose the same scale. The original source-review convention is retained only in the immutable assessment record; no original appraisal, clinical finding, source, study-design classification or masking role was changed. Assessor masking has not been promoted to participant/provider double blinding.

Opening article dialogs also exposed an existing failure when a citation snapshot had no count. The renderer now leaves an unknown citation count unset and opens the article normally.

Verification checks all 117 paper cards at desktop and mobile widths, every paginated search result, the 1/2/3 filters, article dialogs, filtered JSON, and an existing three-cross double-blind record elsewhere in the library. Complete JSON and CSV exports, static reading pages, and the staging assistant are verified with the release.

Production has not been modified by this task.
