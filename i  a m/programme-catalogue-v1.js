(() => {
  "use strict";

  const comedyProgrammes = [
    {
      id: "comedy-big-lez-show",
      title: "The Big Lez Show · Seasons 1–4",
      artist: "Jarrad Wright",
      segments: [
        { title: "Season 1", fileName: "THE BIG LEZ SHOW - ALL OF SEASON 1.mp4", durationSeconds: 1630.97 },
        { title: "Season 2", fileName: "THE BIG LEZ SHOW - ALL OF SEASON 2.mp4", durationSeconds: 2969.65 },
        { title: "Season 3", fileName: "THE BIG LEZ SHOW - ALL OF SEASON 3.mp4", durationSeconds: 5634.53 },
        { title: "Season 4", fileName: "THE BIG LEZ SHOW - ALL OF SEASON 4.mp4", durationSeconds: 6975.37 },
      ],
    },
    {
      id: "comedy-mike-nolan-show",
      title: "The Mike Nolan Show · Episodes 1–5",
      artist: "Jarrad Wright",
      segments: [
        { title: "Yeah Nah Yeah", fileName: "The Mike Nolan Show ｜ EP01 ｜ Yeah Nah Yeah.mp4", durationSeconds: 306.32 },
        { title: "FTC", fileName: "The Mike Nolan Show ｜ EP02 ｜ FTC.mp4", durationSeconds: 288.28 },
        { title: "Anotha Day Anotha Dolla", fileName: "The Mike Nolan Show ｜ EP03 ｜ Anotha Day Anotha Dolla.mp4", durationSeconds: 312.38 },
        { title: "Ding Dong Delli", fileName: "The Mike Nolan Show ｜ EP04 ｜ Ding Dong Delli.mp4", durationSeconds: 328.4 },
        { title: "Lantana Bush", fileName: "The Mike Nolan Show ｜ EP05 ｜ Lantana Bush.mp4", durationSeconds: 384.78 },
      ],
    },
    {
      id: "comedy-mike-nolans-long-weekend",
      title: "Mike Nolan’s Long Weekend",
      artist: "Jarrad Wright",
      fileName: "MIKE NOLAN'S LONG WEEKEND - ALL EPS.mp4",
      durationSeconds: 1764.11,
    },
    {
      id: "comedy-clarence-claymore",
      title: "On Location with Clarence Claymore",
      artist: "Jarrad Wright",
      fileName: "ON LOCATION WITH CLARENCE CLAYMORE.mp4",
      durationSeconds: 960.28,
    },
    {
      id: "comedy-sassy-the-sasquatch",
      title: "Sassy the Sasquatch",
      artist: "Jarrad Wright",
      fileName: "SASSY THE SASQUATCH - ALL EPS.mp4",
      durationSeconds: 4784.36,
    },
    {
      id: "comedy-donny-clarence-show",
      title: "The Donny & Clarence Show · Episodes 1–6",
      artist: "Jarrad Wright",
      segments: [
        { title: "Prankz", fileName: "THE DONNY & CLARENCE SHOW ｜ EP01 ｜ PRANKZ.mp4", durationSeconds: 326.8 },
        { title: "Thunda", fileName: "THE DONNY & CLARENCE SHOW ｜ EP02 ｜ THUNDA.mp4", durationSeconds: 397 },
        { title: "Put Em Up", fileName: "THE DONNY & CLARENCE SHOW ｜ EP03 ｜ PUT EM UP.mp4", durationSeconds: 273 },
        { title: "Fore", fileName: "THE DONNY & CLARENCE SHOW ｜ EP04 ｜ FORE.mp4", durationSeconds: 385.08 },
        { title: "Grit Mailman", fileName: "THE DONNY & CLARENCE SHOW ｜ EP05 ｜ GRIT MAILMAN.mp4", durationSeconds: 465.03 },
        { title: "Sugar Glider", fileName: "THE DONNY & CLARENCE SHOW ｜ EP06 ｜ SUGAR GLIDER.mp4", durationSeconds: 491.01 },
      ],
    },
    {
      id: "comedy-sassy-behind-the-scenes",
      title: "Sassy Behind the Scenes",
      artist: "Jarrad Wright",
      fileName: "Behind the Scenes of SASSY THE SASQUATCH.mp4",
      durationSeconds: 611.54,
    },
  ];

  const sexEdEpisodes = [
    { episode: "01", id: "sex-ed-01", title: "Reclaiming the Forbidden Feminine", artist: "Caitlin Erica", fileName: "From Doula to Stripper - Reclaiming the Forbidden Feminine with Caitlin Erica.mp4", durationSeconds: 6718.59, startTime: 139 },
    { episode: "02", id: "sex-ed-02", title: "The Truth About Tantra & Embodied Wealth", artist: "Sofia Sundari", fileName: "The Truth About Tantra, Sacred Union & Embodied Wealth - Sofia Sundari.mp4", durationSeconds: 6346.09 },
    { episode: "03", id: "sex-ed-03", title: "Power, Sex & Intimacy", artist: "Vylana", fileName: "Femininity Explored - Power, Sex, & Intimacy, with Vylana.mp4", durationSeconds: 5186.7 },
    { episode: "04", id: "sex-ed-04", title: "Expanding the Window of Pleasure", artist: "Shashi Solluna", fileName: "The Psychology of boring sex with Shashi Solluna - Tantra - Expanding The Window of Pleasure.mp4", durationSeconds: 6474.4 },
    { episode: "05", id: "sex-ed-05", title: "Healthy Sexuality vs. Healing Sexuality", artist: "Teal Swan", fileName: "Healthy Sexuality Vs. Healing Sexuality - Teal Swan.mp4", durationSeconds: 1224.29 },
    { episode: "06", id: "sex-ed-06", title: "Healing Through Solo Rope & Self Pleasure", artist: "Jacqueline Michelle", fileName: "Jacqueline Michell - Healing Through Solo Rope & Self Pleasure.mp4", durationSeconds: 2663 },
    { episode: "07", id: "sex-ed-07", title: "Yoga to Increase Your Sexual Energy", artist: "Ashton August", fileName: "Yoga to Increase Your Sexual Energy - Ashton August.mp4", durationSeconds: 1519.996, presentation: "fullscreen", radioStation: "cafe-del-mar-chill" },
    { episode: "08", id: "sex-ed-08", title: "Vinyasa Yoga Flow", artist: "Ashton August", fileName: "Vinyasa Yoga Flow - Ashton August.mp4", durationSeconds: 2132.898, presentation: "fullscreen", radioStation: "cafe-del-mar-chill" },
    { episode: "09", id: "sex-ed-09", title: "Five Stages of Subspace", artist: "Alesandra Madison", fileName: "5 Stages of Subspace (And How to Get There Faster).mp4", durationSeconds: 1713.31 },
    { episode: "10", id: "sex-ed-10", title: "Subspace & Topspace", artist: "Luna Agneya", fileName: "All about Subspace and Topspace.mp4", durationSeconds: 530.99 },
    { episode: "11", id: "sex-ed-11", title: "Pleasuring a Woman", artist: "Hitomi Mochizuki", fileName: "How to pleasure a woman _ a spiritual & physical sex guide.mp4", durationSeconds: 1133.39 },
    { episode: "12", id: "sex-ed-12", title: "BDSM: The New Religion?", artist: "Gemma Li & Seraphyna", fileName: "Is BDSM the New Religion_ What You Didn’t Know About Power and Belief.mp4", durationSeconds: 1986.28 },
    { episode: "13", id: "sex-ed-13", title: "Submission & the Male Brain", artist: "Alla Mephistopheles", fileName: "WHAT SUBMISSION TO A WOMAN DOES TO MALE BRAIN.mp4", durationSeconds: 1075.39 },
    { episode: "14", id: "sex-ed-14", title: "Becoming NYC’s #1 Dominatrix", artist: "Mistress Seren", fileName: "Mistress Seren - Becoming NYC's #1 Dominatrix.mp4", durationSeconds: 2549.53 },
    {
      episode: "15",
      id: "sex-ed-15",
      title: "Healing Sexual Trauma in Nature",
      artist: "Shashi Solana",
      fileName: "Pirelli 2010 Calendar.mp4",
      backgroundFileName: "Shashi Solluna - How I Healed my Sexual Pain using Nature.mp4",
      durationSeconds: 1479.2,
      backgroundDurationSeconds: 549.27,
      presentation: "jbh-editorial",
      foregroundMuted: true,
      backgroundAudible: true,
      sensitiveContent: "pirelli-editor-note",
    },
    {
      episode: "16",
      id: "sex-ed-16",
      title: "Dissolving Toxic Masculinity",
      artist: "Karl Lagerfeld & Shashi Solana",
      fileName: "Karl Lagerfeld & Shashi Solluna - Nice Guy vs. Toxic Masculinity.mp4",
      backgroundFileName: "Karl Lagerfeld & Shashi Solluna - Nice Guy vs. Toxic Masculinity.mp4",
      durationSeconds: 3288.24,
      presentation: "jbh-editorial",
      foregroundMuted: false,
      backgroundAudible: false,
      syncLayers: true,
      sensitiveContent: "18-plus",
    },
  ];

  function segmentsFor(programme) {
    return Array.isArray(programme?.segments) && programme.segments.length
      ? programme.segments
      : [{ title: programme?.title || "Programme", fileName: programme?.fileName || "", durationSeconds: Number(programme?.durationSeconds || 0) }];
  }

  comedyProgrammes.forEach((programme) => {
    programme.segments = segmentsFor(programme).map((segment) => Object.freeze({ ...segment }));
    programme.durationSeconds = programme.segments.reduce((sum, segment) => sum + Number(segment.durationSeconds || 0), 0);
    Object.freeze(programme.segments);
    Object.freeze(programme);
  });

  sexEdEpisodes.forEach(Object.freeze);
  const items = new Map([...comedyProgrammes, ...sexEdEpisodes].map((item) => [item.id, item]));

  window.IAMProgrammeCatalogue = Object.freeze({
    version: "programme_catalogue_v1",
    comedyChannelId: "comedy-jarrad-wright",
    comedyEpochUtc: "2026-07-24T00:00:00.000Z",
    comedyProgrammes: Object.freeze(comedyProgrammes),
    sexEdEpisodes: Object.freeze(sexEdEpisodes),
    itemFor(id) {
      return items.get(String(id || "")) || null;
    },
    totalComedySeconds: comedyProgrammes.reduce((sum, item) => sum + item.durationSeconds, 0),
  });
})();
