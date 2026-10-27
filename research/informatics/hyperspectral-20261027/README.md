# Hyperspectral Imaging source reconciliation

Reviewed 27 October 2026. The approved scope covers the source inventory, normalized register, six-subchapter General chapter, and permanent staging publication.

## Source inventory

Notion patent section 2.4, Parts 1 and 2, was fetched in full. Page IDs, last-edit times and content hashes are in `source-inventory.json`. The raw patent narrative remains outside the repository and public exports. The original Notion pages remain unchanged.

The bibliography contains 229 non-patent entries and 11 patent entries. Its final numeric label is 222; lettered labels and the missing NPL-111 explain the difference. The 13 timeline entries overlap these sources and add no independent publications. All 240 reference IDs are retained across JSON and CSV.

Four repeated citation pairs share a source record: NPL-1/153, NPL-9/214, NPL-193/198 and NPL-201/209. HyperSeq preprint and SpectralSeq publication records remain separate and explicitly related. There are 236 source records; 22 reuse existing library records. The focused chapter includes 121 sources; the complete bibliography also retains contextual material on sound, economics, identity and other adjacent topics.

## Checks and limits

The user explicitly approved disclosure of published titles, DOI/PMID identifiers and patent numbers to Europe PMC, Crossref and Google Patents. No invention claims or patent narrative were sent for metadata checking.

`audit.json` retains queries, response URLs, returned metadata, match scores, unresolved conflicts and manual reconciliation notes. Automatic matches used normalized title similarity after DOI, PMID or PMCID lookup, then title searches. Manual corrections reconcile recognizable title variants and source context. Canonical publication authors and identifiers are distinguished from original bibliography wording.

174 non-patent entries have matched or reconciled metadata; 41 are documentary references; 14 retain unresolved identities or identifier conflicts. All 11 patent identifiers resolve. Original assignee mismatches for PAT-7, PAT-8 and PAT-11 are visible; PAT-3's broader source attribution is distinguished from formal assignee metadata. No legal status or claim-scope assessment is made.

Metadata identity checks are not full-text scientific appraisal. No new Trust Factor or Jadad score is assigned. Existing assessments on reused records remain intact. Six core publications have method/context summaries based on primary abstracts or full text, labelled separately from the original source annotations. A visible correction records the Purdue study's visible 400–720 nm range and reference-chart requirement.

Rebuild data with `python3 tools/build-hyperspectral.py`. Public files are `Informatics/library-data/hyperspectral-expansion.json`, `hyperspectral-register.json`, `hyperspectral-register.csv`, and chapter 11 in `general-edition.json`. Register CSV includes canonical bibliographic identifiers, original citation wording and verification status. The complete dataset exports include these tracked public files. API caches and full patent responses are excluded.
