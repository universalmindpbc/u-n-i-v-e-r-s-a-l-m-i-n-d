(() => {
  "use strict";

  // The landing page's glyphs, palette, column spacing and trail drawing,
  // adapted to a transparent layer driven by the shared EMDR lifecycle.
  const canvas = document.querySelector("[data-emdr-neo-canvas]");
  const context = canvas?.getContext("2d", { alpha: true });
  if (!canvas || !context) return;

  const abstractGlyphs = [
    "0", "1", "2", "3", "7", "<", ">", "[", "]", "=", "+", "*", "·",
    "⋮", "⋯", "⌁", "⌇", "⌗", "△", "▽", "◇", "◊", "⟡", "┆", "┊",
    "╱", "╲", "╳", "⌞", "⌜", "⌟", "⌝"
  ];
  const signatureGlyphs = ["V", "V", "V", "V", "I", "A", "M"];
  const pearlTones = [[255, 245, 237], [255, 224, 236], [232, 226, 255]];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    active: false, width: 0, height: 0, ratio: 1, cell: 22,
    columns: [], lastTime: null, frames: 0, needsDraw: true,
    speed: 1, opacity: .96, intensity: .8, reaction: 0,
  };
  const randomBetween = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const nextGlyph = () => {
    const character = Math.random() < .18 ? pick(signatureGlyphs) : pick(abstractGlyphs);
    const anomaly = (character === "V" && Math.random() < .22) || Math.random() < .026;
    return { character, editorial: Math.random() < .17, anomaly, tone: anomaly ? pick(pearlTones) : [255, 255, 255] };
  };
  const createColumn = (index) => {
    const trailLength = Math.round(randomBetween(18, 36));
    return {
      x: index * state.cell + state.cell * randomBetween(.32, .68),
      headY: randomBetween(state.cell, state.height + (trailLength - 2) * state.cell),
      speed: randomBetween(66, 152), opacity: randomBetween(.7, 1),
      trailLength, advance: randomBetween(0, state.cell),
      glyphs: Array.from({ length: trailLength }, nextGlyph),
    };
  };
  const resize = () => {
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    if (width === state.width && height === state.height && ratio === state.ratio) return;
    Object.assign(state, { width, height, ratio, cell: width < 520 ? 18 : width < 980 ? 21 : 23 });
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    state.columns = Array.from({ length: Math.ceil(width / state.cell) + 1 }, (_, index) => createColumn(index));
    state.needsDraw = true;
  };
  const recycleColumn = (column) => {
    column.headY = randomBetween(-state.cell * 5, -state.cell);
    column.speed = randomBetween(66, 152);
    column.opacity = randomBetween(.7, 1);
    column.trailLength = Math.round(randomBetween(18, 36));
    column.advance = 0;
    column.glyphs = Array.from({ length: column.trailLength }, nextGlyph);
  };

  function render({ time, intensity = .8, rhythm = [], reactionEnabled = false }) {
    if (!state.active || document.hidden) { state.lastTime = null; return; }
    resize();
    const nextIntensity = Math.max(0, Math.min(1, intensity));
    if (nextIntensity !== state.intensity) state.needsDraw = true;
    state.intensity = nextIntensity;
    state.reaction = reactionEnabled ? Math.max(0, ...rhythm) : 0;
    // The default 80% preserves the landing page's original falling speed.
    state.speed = .2 + state.intensity;
    state.opacity = Math.min(1, .8 + state.intensity * .2 + state.reaction * .12);
    if (reducedMotion.matches && !state.needsDraw) return;
    if (!state.needsDraw && state.lastTime !== null && time - state.lastTime < 1 / 30) return;
    const elapsed = state.lastTime === null ? 0 : Math.max(0, Math.min(time - state.lastTime, .08));
    state.lastTime = time;
    state.needsDraw = false;
    context.clearRect(0, 0, state.width, state.height);
    context.globalAlpha = state.opacity;
    context.textAlign = "center";
    context.textBaseline = "middle";

    state.columns.forEach((column) => {
      if (!reducedMotion.matches) {
        const distance = column.speed * elapsed * state.speed;
        column.headY += distance;
        column.advance += distance;
        while (column.advance >= state.cell) {
          column.advance -= state.cell;
          column.glyphs.unshift(nextGlyph());
          column.glyphs.pop();
        }
      }
      for (let index = column.trailLength - 1; index >= 0; index -= 1) {
        const y = column.headY - index * state.cell;
        if (y < -state.cell || y > state.height + state.cell) continue;
        const glyph = column.glyphs[index];
        const distance = index / Math.max(column.trailLength - 1, 1);
        const alpha = Math.max(.035, Math.pow(1 - distance, 1.42) * column.opacity);
        const isHead = index === 0;
        const [red, green, blue] = glyph.tone;
        context.font = glyph.character === "V" && glyph.editorial
          ? `${Math.round(state.cell * 1.06)}px Didot, "Bodoni 72", "Times New Roman", serif`
          : `${Math.round(state.cell * .86)}px "SFMono-Regular", Menlo, Consolas, monospace`;
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${isHead ? Math.min(1, alpha + .22) : alpha})`;
        context.shadowColor = isHead ? `rgba(${red}, ${green}, ${blue}, ${glyph.anomaly ? .98 : .92})` : "transparent";
        context.shadowBlur = isHead ? 11 : 0;
        context.fillText(glyph.character, column.x, y);
      }
      if (column.headY - column.trailLength * state.cell > state.height) recycleColumn(column);
    });
    context.shadowBlur = 0;
    state.frames += 1;
    canvas.dataset.neoFrames = String(state.frames);
    canvas.dataset.neoMotion = reducedMotion.matches ? "static" : "running";
  }

  function setActive(active) {
    const next = Boolean(active);
    if (next !== state.active) {
      state.lastTime = null;
      state.needsDraw = true;
    }
    state.active = next;
    canvas.classList.toggle("is-active", next);
    canvas.dataset.neoActive = String(next);
    return next;
  }
  reducedMotion.addEventListener?.("change", () => {
    state.needsDraw = true;
    state.lastTime = null;
  });
  document.addEventListener("visibilitychange", () => { state.lastTime = null; });

  window.IAMEMDRNeo = {
    setActive, render,
    diagnostics: () => ({
      active: state.active, frames: state.frames, width: state.width, height: state.height,
      columns: state.columns.length, speed: state.speed, opacity: state.opacity,
      intensity: state.intensity, reaction: state.reaction, reducedMotion: reducedMotion.matches,
    }),
  };
})();
