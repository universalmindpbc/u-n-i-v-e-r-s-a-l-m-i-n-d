# Adaptive Music Intelligence — Codex Brief v0.1

# Adaptive Music Intelligence — Codex Brief v0.1

Sandbox feature brief for Codex.

This page defines a new experimental page and pipeline for Universal Mind's adaptive music experience.

The feature explores how a citizen's latest check-in, Citizen Needs radar profile, environment context, and music metadata combine to select a hero VOD music video before continuing into a needs-matched extended livestream.

This is a sandbox feature, not the core homepage.

---

# Purpose

Build a new experimental page based on the existing homepage structure.

The page demonstrates:

1. Citizen self-report.
2. GPT Citizen Needs analysis.
3. Context-aware adaptive environment logic.
4. Music Intelligence search.
5. Hero music video selection.
6. Seamless transition into the application-assigned extended livestream: Parties 80%, Radio 10%, Videos 10%.

The objective is not simple music recommendation.

The objective is adaptive environment design.

Music is the first medium the adaptive environment learns to speak.

---

# Core UX Flow

```
Citizen check-in
        ↓
GPT Adaptive Inference Engine
        ↓
Citizen Needs JSON
        ↓
Environment Function JSON
        ↓
Music Intelligence Layer
        ↓
Hero Music Video
        ↓
Seamless dissolve
        ↓
Needs-Matched Extended Livestream
        ↓
Manual Portal Exploration
```

---

# Page Behaviour

Use the structure and visual atmosphere of the current homepage.

Do not redesign the whole homepage.

Create a new experimental route / page for this feature.

The hero music video uses the same approximate size and embed styling as the current Vimeo chapter embeds.

The page remains cinematic, dark, premium and minimal.

The system reveals only enough temporary text to demonstrate the adaptive logic.

After the hero music video plays, transition into the selected approved Ready livestream inside the assigned Parties, Radio or Videos branch.

Avoid a visible popup player.

Avoid dashboard UI.

Avoid recommendation-card UI.

---

# User Journey

## Step 1 — Check-In

The citizen completes the existing **I am...** check-in flow. Example: *I am grateful but tired after surfing.*

## Step 2 — Needs-Matched VOD Music Video

Send the check-in and available consented context to the Adaptive Inference Engine. Music Intelligence and the Editorial Layer select one safe VOD music video from the approved catalogue. Gracenote, Cyanite, Musixmatch and YouTube may supply metadata or candidates; Universal Mind makes the final choice.

## Step 3 — Needs-Matched Extended Livestream

After the opening video, the application assigns the eligible format from a stable visitor-and-recommendation slot: Parties 80%, Radio 10%, Videos 10%. Within that branch, select the compatible music room and approved Ready source from Citizen Needs, taste, context, continuity and editorial suitability. Examples include ambient `inner planes` Radio late at night, chillout `champagne bohemia` Radio in the morning, and—only in the Videos branch—`safety cushion` during peak anxiety when approved Ready assets are attached and suitable.

Return safe structured JSON containing the hero video, fallback video, extended-session format, music room, source ID, readiness, format-policy audit, environment function, editorial safety notes, confidence and reason.

## Step 4 — Manual Portal Exploration

After the extended-session handoff, the citizen may manually explore the portal's music and education content. The transition from the opening VOD into the livestream must feel seamless and cinematic.

---

# A/B Testing

Run this feature as an experiment.

## Track A — Universal Mind Music Intelligence

GPT defines the adaptive environment.

Music Intelligence Layer selects the hero video.

Editorial Layer filters for safety, taste and brand alignment.

## Track B — YouTube Recommendation Baseline

YouTube search / recommendation logic proposes candidate videos.

GPT still applies Universal Mind editorial and safety filters.

## Rule

YouTube may suggest.

Universal Mind decides.

The final selected video always passes Universal Mind editorial rules.

---

# Success Metrics

Track:

- hero video play rate
- completion rate
- skip rate
- replay rate
- time watched
- transition-to-extended-livestream rate
- Parties / Radio / Videos traffic distribution against the 80/10/10 target
- extended-session duration by format and music room
- user feedback
- post-video check-in change
- return visits
- qualitative stakeholder feedback

Do not optimise only for engagement.

Optimise for appropriate environment, emotional safety, and meaningful continuation.

---

# Music Intelligence Layer

The Music Intelligence Layer is a subsystem, not a single API call.

It combines:

- Adaptive Inference Engine output
- Citizen Needs radar
- environmental context
- Gracenote metadata
- Cyanite metadata
- Musixmatch lyric metadata
- YouTube candidates
- Universal Mind artist roster
- Editorial Layer
- A/B testing logic

GPT defines the environment.

Music Intelligence finds the best music expression of that environment.

---

# Priority Search Order

Use this order:

1. Universal Mind artist roster.
2. Trusted catalogue / approved partners.
3. YouTube candidate search.
4. YouTube recommendation baseline for A/B experiment.

Universal Mind artist roster begins with 60–100 artists.

The roster includes world-class, popular and underground artists together as one.

The roster becomes a taste layer and safety layer.

---

# Emotional Function Layer

Music selection is based on environmental function, not simple mood matching.

The engine does not classify music only by genre.

The engine classifies music by what it does to the human within an adaptive environment.

---

# Environmental Functions

## Joy + Affirmation

Examples:

- David Guetta
- Rihanna — Diamonds
- 90s Eurodance
- Piano House
- Vocal House
- EDM with uplifting lyrics

Function:

- joy
- optimism
- confidence
- celebration
- affirmation
- belonging
- shared energy

Use when the citizen profile supports uplift, social energy, confidence or positive activation.

## Melancholy + Honesty

Examples:

- Radiohead
- Boards of Canada
- Linkin Park

Function:

- emotional honesty
- validation
- catharsis
- grief processing
- vulnerability
- reflection
- meaning
- facing complexity

This is allowed and prioritised when appropriate.

Do not confuse melancholy and honesty with doom aesthetics.

Melancholy has beauty, movement and truth.

Doom aesthetics reinforce hopelessness, nihilism or emotional exploitation.

## Soul + Restoration

Examples:

- Balearic
- Cafe Del Mar
- Ambient
- Organic Downtempo
- Sunset music

Function:

- soothe the soul
- regulate
- restore
- soften
- create spaciousness
- reduce density
- support recovery

Use for fatigue, stress, recovery, evening context, coastal context, or gentle regulation.

## Focus + Flow

Examples:

- Dub Techno
- Progressive House
- Progressive genres
- Minimal Romanian House
- Deep Tech

Function:

- focused mind
- subtle energy
- attention
- flow
- executive function
- sustained cognition
- clarity

Use when the citizen profile suggests focus, creative work, clarity, motivation or calm activation.

## Grit + Agency

Examples:

- Grime
- Hip Hop
- Dubstep
- Post-Dubstep

Function:

- honesty
- grit
- resilience
- determination
- courage
- identity
- agency
- facing life head on

Use when the citizen profile suggests needing strength, agency, realism, confidence or self-expression.

This category is not aggression for its own sake.

It is courage and agency.

## Curiosity + Exploration

Examples:

- Berlin sounds
- Perlon Records
- Avant-garde electronic
- Experimental club music
- Minimal leftfield sounds

Function:

- curiosity
- novelty
- exploration
- divergent thinking
- creative identity
- experimentation
- edge

Use when the citizen profile suggests self-actualisation, creative activation, identity exploration, curiosity or avant-garde taste.

---

# Editorial Layer

Every hero music selection must be:

- emotionally honest
- hopeful in trajectory
- psychologically safe
- age appropriate
- artist approved where relevant
- brand aligned
- culturally appropriate
- non-extractive

Music may explore:

- grief
- melancholy
- uncertainty
- longing
- awe
- introspection
- grit
- resistance
- catharsis

Avoid selections that primarily reinforce:

- hopelessness
- nihilism
- self-harm ideation
- despair without movement
- dehumanisation
- emotional exploitation
- trauma-bait
- outrage bait
- shock for engagement

The key editorial question:

> Where does this piece of music leave the listener?

Not:

> Does this piece of music contain sadness?

---

# Extended Streaming Music Rooms

The adaptive environment routes eligible extended sessions through five canonical music rooms:

- `inner planes` — ambient / sleep / sunrise.
- `champagne bohemia` — Balearic / sunset / chillout.
- `modul8 infinity` — rave / house / techno / future bass / future psychedelic beats / hiphop, including Brainfeeder-adjacent work.
- `james bondage` — minimal / electro / EBM.
- `safety cushion` — 80s nu wave, music videos only.

These are music rooms, not three energy levels. Calm remains a Citizen Needs signal. Chillout and house remain genres inside their relevant rooms. The literal Cafe Del Mar Radio station names may remain as source titles, but Calm, Chill and House must not be used as recommendation categories.

Choose a room and eligible format from catalogue readiness and format, safety and age boundaries, stated intent and taste, constructive trajectory, present needs, context, continuity and editorial confidence. Time, weather and location may refine the choice; they never override the citizen's expressed state.

`safety cushion` must never route to Parties or Radio and must not be recommended until approved ready music-video assets are attached. If no eligible ready source exists, return no extended session instead of forcing a default.

The canonical journey is check-in → needs-matched VOD music video → needs-matched extended livestream → manual portal exploration. Across eligible extended sessions, the application assigns Parties 80% of the time, Radio 10% and Videos 10% using a stable visitor-and-recommendation slot. The chosen format is then matched to the compatible room and approved Ready source. Radio examples include `inner planes` ambient radio late at night and `champagne bohemia` chillout radio in the morning. In the Videos slot, peak anxiety may favour `safety cushion` only after its approved Ready music-video assets are attached and editorially suitable.

---

# Context Logic

Use context when available and consented.

Initial context variables:

- local time
- approximate location
- weather condition
- temperature

Context is used for adaptive environment only.

Context is not clinical evidence.

Examples:

- late evening may favour lower density, but does not determine a music room
- early morning may favour sunrise, spacious or focused selections depending on state and taste
- clear coastal context supports Balearic, open, spacious or warm music
- rain supports reflective or lower-density selections
- city context may support kinetic, urban or focused energy
- hot weather may reduce intensity
- cold weather may favour warmth and body

---

# UX Copy

Temporary homepage copy:

```
Adaptive Environment | Soundtrack

Based on your latest check-in

champagne bohemia

RADIO · CAFE DEL MAR — CHILL
```

This copy animates on screen briefly.

It dissolves away when the hero video or extended livestream begins.

Keep copy minimal.

Do not present the feature as a recommendation engine.

---

# API Notes

GPT does not directly collect IP address, browser location, weather or local time.

The application layer collects context and passes it to GPT as structured JSON.

Expected flow:

```
Browser local time
+ optional browser location permission
+ optional coarse IP location server-side
+ weather API
+ citizen check-in
        ↓
Structured context JSON
        ↓
GPT Adaptive Inference Engine
        ↓
Music Intelligence output JSON
```

Precise location requires explicit permission.

Approximate location is enough for music adaptation.

---

# YouTube Notes

Use YouTube API for discovery.

Use embedded playback where compliant.

Do not rely on scraping.

Do not promise ad blocking if platform rules prevent it.

If ad reduction is explored, keep it compliant with YouTube terms and embed policies.

Avoid inline popups and intrusive interface overlays where technically possible.

Prioritise official videos, artist-approved uploads, and high-quality embeds.

---

# Required JSON — Music Intelligence Output

```json
{
  "feature_version": "adaptive_music_intelligence_v0.1",
  "experiment_track": "universal_mind_music_intelligence | youtube_baseline",
  "citizen_checkin": "I am grateful but tired after surfing.",
  "environment_context": {
    "local_time": "19:07",
    "location_label": "Avoca Beach",
    "location_precision": "approximate",
    "weather_condition": "clear",
    "temperature_celsius": 17
  },
  "citizen_needs_summary": {
    "dominant_domains": ["Emotion", "Physiological"],
    "top_needs": ["Gratitude", "Fatigue", "Recovery", "Calm"],
    "overall_confidence": 0.82
  },
  "environment_function": {
    "primary_function": "Soul + Restoration",
    "secondary_function": "Melancholy + Honesty",
    "intensity": "low_to_moderate",
    "density": "open",
    "trajectory": "warm_downshift"
  },
  "hero_music_video": {
    "title": null,
    "artist": null,
    "youtube_video_id": null,
    "source_priority": "universal_mind_roster | trusted_catalogue | youtube_search | youtube_baseline",
    "selection_confidence": 0.0,
    "selection_reason": "Concise reason for chosen hero video."
  },
  "extended_streaming_session": {
    "music_room": "inner-planes | champagne-bohemia | modul8-infinity | james-bondage | safety-cushion | null",
    "format": "videos | parties | radio | null",
    "source_id": null,
    "catalogue_ready": false,
    "format_policy": {
      "weights": {"parties": 0.8, "radio": 0.1, "videos": 0.1},
      "assignment": "stable_visitor_and_recommendation_slot",
      "safety_and_readiness_override": true
    },
    "music_room_confidence": 0.0,
    "reason": "Concise reason for the eligible extended session."
  },
  "editorial_layer": {
    "emotionally_honest": true,
    "hopeful_in_trajectory": true,
    "psychologically_safe": true,
    "age_appropriate": true,
    "artist_approved_where_relevant": true,
    "brand_aligned": true,
    "culturally_appropriate": true,
    "non_extractive": true,
    "editorial_notes": "Explain any nuance, especially melancholy, grit or intensity."
  },
  "fallbacks": {
    "fallback_video_id": null,
    "fallback_music_room": null,
    "fallback_reason": "Return no room when confidence, catalogue readiness or API quality is insufficient."
  }
}
```

---

# Build Strategy For Codex

## Stage 1 — Static Prototype

Create the new page using existing homepage structure.

Use mock JSON.

Hardcode three example check-ins.

Demonstrate:

- hero video selection
- adaptive copy
- dissolve into the assigned Parties, Radio or Videos livestream branch

## Stage 2 — GPT JSON Integration

Connect the check-in to GPT Adaptive Inference Engine.

Return the Music Intelligence output JSON.

Use mocked music API responses first.

## Stage 3 — YouTube API

Connect YouTube API search.

Return candidate videos.

GPT selects from candidates.

## Stage 4 — Metadata APIs

Add Gracenote.

Add Cyanite fallback.

Add Musixmatch lyric context.

## Stage 5 — A/B Testing

Randomly assign Track A or Track B.

Track basic events.

Compare Universal Mind selection versus YouTube baseline.

## Stage 6 — Artist Roster

Add Universal Mind artist roster.

Prioritise approved artists.

Add metadata tags for emotional function, genre, era, energy, lyrical safety and brand fit.

---

# Safety + Brand Guardrails

Do not optimise for watch time alone.

Do not select emotionally exploitative content.

Do not autoplay sound before user gesture unless browser rules and user consent allow it.

Do not frame the result as treatment.

Do not claim clinical benefit from music playback.

Do not expose sensitive inference data in the UI.

Keep UI minimal, cinematic and premium.

---

# Later Systems Prompt v1.1 Additions

The following sections need to be added later to **Adaptive Inference Engine — System Prompt v1.1**:

1. **Emotional Function Layer**
    - Music classified by environmental function, not simple genre or mood.
    - Include Joy + Affirmation, Melancholy + Honesty, Soul + Restoration, Focus + Flow, Grit + Agency, Curiosity + Exploration.
2. **Editorial Layer**
    - Hero music selections must be emotionally honest, hopeful in trajectory, psychologically safe, age appropriate, artist approved where relevant, brand aligned, culturally appropriate and non-extractive.
3. **Melancholy vs Doom Distinction**
    - Radiohead, Boards of Canada and Linkin Park style energy represents melancholy and honesty, not doom aesthetics.
    - Allow grief, uncertainty, longing and catharsis when the trajectory supports meaning, agency or regulation.
4. **Music Intelligence Layer**
    - GPT defines environment.
    - Music Intelligence selects asset.
    - YouTube may suggest; Universal Mind decides.
5. **A/B Testing Logic**
    - Track A = Universal Mind Music Intelligence.
    - Track B = YouTube baseline.
    - Compare completion, skip, replay, continuation and post-check-in outcomes.
6. **Adaptive Environment Output JSON**
    - Add hero music video object.
    - Add extended livestream object with the application-assigned 80% Parties / 10% Radio / 10% Videos format policy.
    - Add music-room, approved Ready source and format-eligibility fields.
    - Add editorial layer object.
    - Add fallback logic.
7. **Context-Aware Music Logic**
    - Time, weather, temperature and approximate location modify music environment selection.
    - Context remains adaptive environment evidence, not clinical evidence.

---

# Final Direction

This feature demonstrates that Universal Mind is not a recommendation engine.

Universal Mind is an adaptive environment.

The system does not simply ask:

> What song fits this mood?

The system asks:

> What environment best supports this citizen now?

Music is the first answer.

---

# Universal Mind Seed Catalogue — Round 1

This is the first Universal Mind artist / label / scene catalogue for the Adaptive Music Intelligence feature.

Treat this as an editorial seed catalogue, not a flat playlist.

The catalogue provides the first trusted search layer for the Music Intelligence system.

Priority order:

1. Universal Mind Seed Catalogue.
2. Artist / label / scene associations from this catalogue.
3. Trusted catalogue expansion.
4. General YouTube search.
5. YouTube baseline experiment.

The goal is to keep Universal Mind taste at the centre of the system while allowing intelligent expansion outward.

---

# Knowledge Graph Vision

The Round 1 catalogue becomes a **music knowledge graph**.

Every artist, label, project, alias, scene and genre becomes a node.

Nodes connect through:

- emotional function
- genre
- label
- scene
- era
- energy
- density
- lyrical tone
- cultural context
- youth relevance
- Universal Mind editorial confidence
- related artists
- related labels
- suitable Citizen Needs states
- suitable environment contexts
- suitable music rooms and eligible formats

Example node:

```
Radiohead
│
├── Emotional Functions
│   ├── Melancholy + Honesty
│   └── Curiosity + Exploration
│
├── Related Nodes
│   ├── XL Recordings
│   ├── Thom Yorke
│   ├── Boards Of Canada
│   └── Massive Attack
│
├── Citizen Needs Fit
│   ├── Meaning
│   ├── Awe
│   ├── Emotional Honesty
│   ├── Rumination
│   └── Self-Actualisation
│
├── Environment Fit
│   ├── Reflection
│   ├── Creativity
│   └── Catharsis
│
└── Editorial Role
    └── Melancholy that moves toward meaning, not doom aesthetics.
```

---

# Neural Net Vision

The knowledge graph is the human-readable structure.

Later, the catalogue evolves into a trainable / tunable music intelligence layer.

Long-term direction:

```
Universal Mind Seed Catalogue
        ↓
Music Knowledge Graph
        ↓
Embeddings + metadata vectors
        ↓
Neural ranking / retrieval layer
        ↓
Adaptive Music Intelligence
        ↓
Hero music video + eligible extended streaming session
```

The neural layer learns from:

- citizen needs inference
- music metadata
- emotional function tags
- environment context
- watch / skip / completion behaviour
- extended-session duration by format and music room
- explicit feedback
- post-video check-in shift
- editorial review

The neural layer never replaces the Editorial Layer.

The neural layer improves retrieval and ranking.

Universal Mind maintains final editorial control.

---

# Artist / Label / Scene Metadata Template

Each catalogue item can later receive structured metadata.

```json
{
  "name": "Radiohead",
  "type": "artist | label | project | alias | scene | collective",
  "universal_mind_priority": 0.0,
  "emotional_functions": [
    "Melancholy + Honesty",
    "Curiosity + Exploration"
  ],
  "energy": "low | medium | high | variable",
  "density": "sparse | open | layered | intense | variable",
  "vocal_profile": "instrumental | vocal | mixed | unknown",
  "lyrical_safety": "youth_safe | review_required | explicit | unknown",
  "citizen_needs_fit": [
    "Awe",
    "Meaning",
    "Clarity"
  ],
  "environment_context_fit": [
    "morning",
    "day",
    "sunset",
    "night",
    "coastal",
    "city",
    "home",
    "travel"
  ],
  "music_room_fit": [
    "inner-planes",
    "champagne-bohemia"
  ],
  "eligible_extended_formats": [
    "videos",
    "parties",
    "radio"
  ],
  "related_nodes": [
    "XL Recordings",
    "Boards Of Canada"
  ],
  "editorial_notes": "Universal Mind interpretation of this artist's emotional function."
}
```

---

# Round 1 Seed Catalogue

## Artists / Projects / Aliases / Labels / Scenes

```
# Rage Against The Machine
```

- Raresh
- Ricardo Villalobos
- Richard Devine
- Riche Hawtin [Plastikman]
- Rihanna
- Salmon Universe
- Sampa The Great
- Sasha
- Sia
- Skrillez
- Smashing Pumpkins
- Solange Knowles
- SOPHIE [RIP]
- Steve Aoki
- Stormzy
- Tame Impala
- The Dissociatives
- The Internet
- The Presets
- Thomas Melchior [Soul Capsule]
- Tiesto [Gouryella]
- Tiga
- Timmy Trumpet
- U2
- Warp Records
- XL Recordings
- Zip [Pantytec]
- Radiohead
- Prodigy
- Quiet Village
- Perlon
- PinkPantheress
- Pengo
- Orbital
- Paul Oakenfold [Perfecto Fluoro]
- Nina Kraviz
- Nine Inch Nails
- Nightmares On Wax
- Matthewdavid
- Moby
- Massive Attack
- Madonna
- Margaret Dygas
- M.I.A.
- Maayan Nidam
- Luke Abbott
- Little Simz
- Luciano
- Lady Gaga
- Lilly Palmer
- Kuren
- Kelela
- Kniteforce
- Justice
- James Holden
- John Digweed [Bedrock]
- Hot Chip
- ID&T
- Honey Dijon
- Groove Armada
- Heights Of Abraham
- Grimes
- Grizzley Bear
- Fred Again
- Flume
- Flying Lotus
- FKA Twigs
- Evernesence
- Ferry Corsten [Gouryella]
- Dua Lipa
- Erykah Badu
- Diplo
- Deep Learning
- Depeche Mode
- Daniel Johns
- David Guetta
- Coldplay
- Circo Loco Recordings
- Clark
- Chemical Brothers
- Charli xcx
- Charlotte de Witte
- Caroline Polachek
- Cassy
- Cadenza
- Border Community
- Brian Eno
- Boards Of Canada
- Bizerk
- Bjork
- Barac
- Beyonce
- Baker Boy
- Armin Van Buren [Gouryella]
- ARPIAR
- Animal Collective
- Anna Lunoe
- Anfisa Letyago
- Alison Wonderland [Whyte Fang]
- Andy Cato
- Actress

---

# First-Pass Catalogue Buckets

These are starter buckets only.

Codex does not need to finalise all metadata now.

Use these buckets to guide early mock JSON, search logic and example recommendations.

## Joy + Affirmation

Examples:

- David Guetta
- Rihanna
- Beyonce
- Dua Lipa
- Lady Gaga
- Madonna
- Sia
- Steve Aoki
- Timmy Trumpet
- Tiesto [Gouryella]
- Armin Van Buren [Gouryella]
- Ferry Corsten [Gouryella]
- PinkPantheress
- Charli xcx

Function:

- joy
- affirmation
- uplift
- confidence
- celebration
- shared social energy

## Melancholy + Honesty

Examples:

- Radiohead
- Boards Of Canada
- Linkin Park style reference, even if not currently listed
- Smashing Pumpkins
- Nine Inch Nails
- Depeche Mode
- Daniel Johns
- The Dissociatives
- Massive Attack
- Moby
- Coldplay
- U2
- Tame Impala
- Grizzley Bear

Function:

- emotional honesty
- validation
- reflection
- catharsis
- meaning
- facing complexity

This category is allowed and prioritised when it creates movement, truth, beauty or agency.

Do not treat melancholy as unsafe by default.

## Soul + Restoration

Examples:

- Cafe Del Mar style reference
- Quiet Village
- Nightmares On Wax
- Groove Armada
- Heights Of Abraham
- Brian Eno
- Moby
- Massive Attack
- Erykah Badu
- The Internet
- Solange Knowles
- Kelela
- FKA Twigs

Function:

- soothe the soul
- regulate
- restore
- soften
- create spaciousness
- reduce density

## Focus + Flow

Examples:

- Dub techno style reference
- Progressive genres
- Minimal Romanian house
- Ricardo Villalobos
- Raresh
- Barac
- ARPIAR
- Maayan Nidam
- Margaret Dygas
- Thomas Melchior [Soul Capsule]
- Zip [Pantytec]
- Perlon
- Cadenza
- Luciano
- Sasha
- John Digweed [Bedrock]
- James Holden
- Border Community

Function:

- attention
- flow
- subtle energy
- executive function
- sustained cognition
- clarity

## Grit + Agency

Examples:

- Rage Against The Machine
- Stormzy
- Sampa The Great
- Little Simz
- M.I.A.
- Baker Boy
- Prodigy
- Skrillez
- Dubstep / Post-Dubstep style reference
- Grime style reference
- Hip Hop style reference

Function:

- honesty
- grit
- resilience
- courage
- identity
- agency
- facing life head on

This is not aggression for its own sake.

This is courage, reality and agency.

## Curiosity + Exploration

Examples:

- Actress
- Richard Devine
- SOPHIE [RIP]
- Flying Lotus
- Clark
- Bjork
- Grimes
- Caroline Polachek
- Animal Collective
- Matthewdavid
- Warp Records
- XL Recordings
- Perlon
- Berlin sounds reference
- Avant-garde electronic reference

Function:

- curiosity
- novelty
- experimentation
- divergent thinking
- creative identity
- edge

## Club Energy / Festival Activation

Examples:

- Chemical Brothers
- Justice
- Orbital
- The Presets
- Hot Chip
- Fred Again
- Flume
- Diplo
- Nina Kraviz
- Charlotte de Witte
- Anfisa Letyago
- Lilly Palmer
- Anna Lunoe
- Alison Wonderland [Whyte Fang]
- Tiga
- ID&T
- Circo Loco Recordings
- Kniteforce

Function:

- movement
- group energy
- dancefloor activation
- social connection
- embodiment
- release

---

# Catalogue Expansion Logic

Use the seed catalogue to expand intelligently.

Expansion methods:

1. Artist association.
2. Label association.
3. Remix association.
4. Collaboration graph.
5. Scene graph.
6. Similar artist metadata.
7. Genre and subgenre embeddings.
8. YouTube candidate similarity.
9. Gracenote / Cyanite metadata similarity.
10. Musixmatch lyrical similarity.

Examples:

- Warp Records expands toward related Warp artists and adjacent experimental electronic scenes.
- XL Recordings expands toward emotionally intelligent alternative / electronic / pop artists.
- Perlon expands toward minimal, microhouse and Berlin / Romanian adjacent sounds.
- Gouryella expands toward trance, euphoric melodic electronic and spiritual uplift.
- Bedrock expands toward progressive house and cinematic club music.
- Circo Loco expands toward underground club, Ibiza and high-energy house / techno contexts.

---

# Codex Build Note

For v0.1, Codex can store the Round 1 Seed Catalogue as a local JSON or TypeScript data file.

Do not attempt to build the full neural layer yet.

Build the data model so it can later evolve into:

- knowledge graph
- embedding search
- vector retrieval
- neural ranking
- editorial review tools

Initial implementation:

```
artist_catalogue.json
        ↓
metadata tags
        ↓
GPT / rules-assisted filtering
        ↓
YouTube API candidates
        ↓
Editorial Layer
        ↓
Hero music video selection
```

The data structure must remain editable.

Ben will refine metadata over time.

---

# Later Systems Prompt v1.1 Addition

Add this principle later to **Adaptive Inference Engine — System Prompt v1.1**:

> The Universal Mind artist catalogue acts as the editorial seed for Adaptive Music Intelligence. Treat artists, labels, scenes and aliases as nodes in a music knowledge graph. Use this graph to preserve Universal Mind taste, expand intelligently through artist and label association, and support future neural ranking without surrendering editorial control.
