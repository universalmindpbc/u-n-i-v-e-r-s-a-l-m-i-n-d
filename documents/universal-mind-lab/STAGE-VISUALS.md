# Stage visual sources

Ben supplied [Hexeosis hx_4a480.gif](https://hexeosis.com/gifs/hexeosis_gif_selects_topic/hxg-selects-isotriangles/hx_4a480.gif) on 2 November 2026. The exact original is archived as R31; R30 is the preceding still reference.

The original is 540 × 540, 72 frames at 25 fps, total 2.88 seconds. `lab/assets/hexeosis-hx_4a480.mp4` is a silent H.264/yuv420p derivative generated at CRF18 with fast-start metadata. This conversion supports browser video-texture playback while keeping the original GIF.

`stage-visuals.mjs` repeats the geometric visual across the panoramic surface and crossfades it with the existing Neverender video. `media.mjs` loads it only after Launch, and pauses/resumes it with the Music/Motion controls and page visibility. The geometry video is permanently muted and contains no audio stream. It does not add another soundtrack.

The runway panels share the original performance VideoTexture and do not create extra players. The present source is the Justice/Tame Impala music video. Live artist performance clips remain to be supplied.

The Vogue flag uses the existing project asset `i  a m/a s s e t s/Vogue Logo - large.png`, copied unchanged to `lab/assets/vogue.png`. Partner placements remain part of the proposal.
