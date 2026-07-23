import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, "i  a m", "a s s e t s", "m a n t r a [ m o c k u p ]");

const formants = {
  AA: [730, 1090, 2440], AH: [640, 1190, 2390], AE: [660, 1720, 2410],
  EH: [530, 1840, 2480], ER: [490, 1350, 1690], IH: [400, 1990, 2550],
  IY: [270, 2290, 3010], OW: [570, 840, 2410], UW: [300, 870, 2240],
  AY: [660, 1720, 2410], OY: [570, 840, 2410],
};

const words = {
  PEACE: ["P", "IY", "S"], LOVE: ["L", "AH", "V"], UNITY: ["Y", "UW", "N", "IH", "T", "IY"],
  RESPECT: ["R", "IH", "S", "P", "EH", "K", "T"], PLUR: ["P", "L", "ER"],
  IBIZA: ["IH", "B", "IY", "Z", "AH"], ITS: ["IH", "T", "S"], THE: ["D", "AH"],
  LIFESTYLE: ["L", "AY", "F", "S", "T", "AY", "L"], WERE: ["W", "IY", "ER"],
  WE: ["W", "IY"], LIVING: ["L", "IH", "V", "IH", "N"], OM: ["OW", "M"],
  NAMO: ["N", "AA", "M", "OW"], NARAYANA: ["N", "AA", "R", "AA", "Y", "AA", "N", "AA"],
};

function phonemes(text) {
  const tokens = String(text).toUpperCase().match(/[A-Z']+|[.,!?]/g) || [];
  const result = [];
  const vowels = { A: "AA", E: "EH", I: "IH", O: "OW", U: "UW" };
  for (const token of tokens) {
    if (/^[.,!?]$/.test(token)) result.push("_", "_");
    else if (words[token]) result.push(...words[token], "_");
    else {
      for (const letter of token.replace(/'/g, "")) result.push(vowels[letter] || letter);
      result.push("_");
    }
  }
  return result;
}

function noise(index) {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function render(text, { rate = 0.9, pitch = 105, robot = 0.76, ring = 74 } = {}) {
  const sampleRate = 44100;
  const units = phonemes(text).map((phoneme) => ({
    phoneme,
    duration: (phoneme === "_" ? 0.07 : formants[phoneme] ? 0.13 : 0.055) / rate,
  }));
  const duration = units.reduce((sum, unit) => sum + unit.duration, 0) + 0.16;
  const pcm = new Float32Array(Math.ceil(duration * sampleRate));
  let cursor = Math.floor(0.04 * sampleRate);
  let phase = 0;
  units.forEach((unit, unitIndex) => {
    const count = Math.max(1, Math.floor(unit.duration * sampleRate));
    const vowel = formants[unit.phoneme];
    for (let index = 0; index < count && cursor + index < pcm.length; index += 1) {
      const localTime = index / sampleRate;
      const position = index / count;
      const envelope = Math.min(1, position * 12) * Math.min(1, (1 - position) * 14);
      const absolute = (cursor + index) / sampleRate;
      const frequency = pitch * (1 + Math.sin(absolute * Math.PI * 2 * 4.1) * 0.02);
      phase += Math.PI * 2 * frequency / sampleRate;
      let sample = 0;
      if (vowel) {
        const glottal = Math.sin(phase) + 0.34 * Math.sin(phase * 2) + 0.16 * Math.sin(phase * 3);
        const resonance = vowel.reduce((sum, band, bandIndex) => (
          sum + Math.sin(Math.PI * 2 * band * localTime + phase * 0.08) * [0.44, 0.23, 0.1][bandIndex]
        ), 0);
        sample = glottal * 0.32 + resonance;
      } else if (unit.phoneme !== "_") {
        const voiced = /[LMNRVWYBDGZ]/.test(unit.phoneme);
        sample = noise(index + unitIndex * 1777) * (voiced ? 0.22 : 0.48) + (voiced ? Math.sin(phase) * 0.42 : 0);
      }
      const ringWave = Math.sin(Math.PI * 2 * ring * absolute);
      const breath = noise(index + unitIndex * 913) * 0.16;
      pcm[cursor + index] += (sample * (1 - robot * 0.22) + sample * ringWave * robot * 0.34 + breath) * envelope * 0.54;
    }
    cursor += count;
  });
  let peak = 0;
  for (const sample of pcm) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > 0 ? 0.88 / peak : 1;
  for (let index = 0; index < pcm.length; index += 1) pcm[index] *= scale;
  return { pcm, sampleRate, duration: pcm.length / sampleRate };
}

function wav({ pcm, sampleRate }) {
  const buffer = Buffer.alloc(44 + pcm.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + pcm.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(pcm.length * 2, 40);
  for (let index = 0; index < pcm.length; index += 1) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcm[index])) * 0x7fff), 44 + index * 2);
  }
  return buffer;
}

const scripts = [
  ["ibiza-plur-vocoder.wav", "Peace, love, unity, respect... PLUR", { rate: 0.88, pitch: 104, robot: 0.79, ring: 72 }],
  ["ibiza-lifestyle-vocoder.wav", "Ibiza, It's The Lifestyle We're Living", { rate: 0.9, pitch: 102, robot: 0.73, ring: 68 }],
  ["ibiza-narayana-vocoder.wav", "Om Namo. Narayana", { rate: 0.82, pitch: 96, robot: 0.64, ring: 42 }],
];

await mkdir(outputDir, { recursive: true });
for (const [filename, text, settings] of scripts) {
  const rendered = render(text, settings);
  await writeFile(join(outputDir, filename), wav(rendered));
  console.log(`${filename}\t${rendered.duration.toFixed(3)}s`);
}
