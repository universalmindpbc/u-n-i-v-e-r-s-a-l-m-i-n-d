const planetHost = document.querySelector(".homepage-alternate__planet");
const planetCanvas = document.querySelector("[data-homepage-context-planet]");
const soundTrigger = document.querySelector("[data-homepage-sound-trigger]");
const soundDialog = document.querySelector("[data-homepage-sound-dialog]");
const soundPanel = document.querySelector("[data-homepage-sound-panel]");
const soundCloseControls = Array.from(document.querySelectorAll("[data-homepage-sound-close]"));
const playTrigger = document.querySelector("[data-television-play]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let planetFrame = 0;
let dialogReturnTarget = null;

initSoundDisclosure();
applySoundSnapshot(window.IAMAdaptiveSoundSnapshot);
window.addEventListener("iam:adaptive-sound-profile", (event) => applySoundSnapshot(event.detail));

if (planetHost && planetCanvas) {
  initContextPlanet().catch(() => {
    planetHost.dataset.planetReady = "fallback";
  });
}

async function initContextPlanet() {
  const THREE = await import("https://unpkg.com/three@0.165.0/build/three.module.js");
  const monogramImage = await loadImage("a s s e t s/universal-mind-flora-travel-monogram-leather-v1.webp").catch(() => null);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: planetCanvas,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 5.8);

  const group = new THREE.Group();
  group.rotation.z = -0.045;
  scene.add(group);

  const texture = new THREE.CanvasTexture(makeContextTexture(monogramImage));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(6, renderer.capabilities.getMaxAnisotropy());

  const bumpTexture = monogramImage ? new THREE.Texture(monogramImage) : null;
  if (bumpTexture) {
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(5, 2.5);
    bumpTexture.needsUpdate = true;
  }

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, 64, 64),
    new THREE.MeshPhysicalMaterial({
      map: texture,
      bumpMap: bumpTexture,
      bumpScale: bumpTexture ? 0.012 : 0,
      color: "#ffffff",
      clearcoat: 0.56,
      clearcoatRoughness: 0.24,
      emissive: "#061714",
      emissiveIntensity: 0.08,
      metalness: 0.08,
      roughness: 0.44,
      sheen: 0.42,
      sheenColor: new THREE.Color("#8f5a37"),
      sheenRoughness: 0.62,
    })
  );
  group.add(globe);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.19, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormalView;
        void main() {
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormalView;
        void main() {
          float rim = pow(1.0 - abs(dot(vNormalView, vec3(0.0, 0.0, 1.0))), 3.0);
          vec3 emerald = vec3(0.20, 0.52, 0.43);
          vec3 champagne = vec3(0.90, 0.67, 0.38);
          vec3 colour = mix(emerald, champagne, 0.58 + vNormalView.y * 0.16);
          gl_FragColor = vec4(colour, rim * 0.46);
        }
      `,
    })
  );
  group.add(atmosphere);

  const ringA = makeRing(THREE, 1.36, "#d9aa67", 0.27, 1.12, 0.18, 0.42);
  const ringB = makeRing(THREE, 1.47, "#78b7a0", 0.18, 1.42, 0.56, -0.28);
  group.add(ringA, ringB);

  const markerMaterial = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: "#f2d9a4",
    depthWrite: false,
    transparent: true,
    opacity: 0.76,
  });
  const markers = [
    [0.79, 0.64, 0.58],
    [-0.88, 0.32, 0.74],
    [0.52, -0.81, 0.65],
    [-0.26, -0.96, 0.55],
    [0.11, 0.93, 0.72],
  ].map((position, index) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(index === 0 ? 0.025 : 0.017, 14, 14), markerMaterial.clone());
    marker.position.set(...position).normalize().multiplyScalar(1.18);
    marker.material.color.set(index % 2 ? "#8fd3bd" : "#f2d39a");
    group.add(marker);
    return marker;
  });

  const planetDefinitions = [
    { radius: 0.07, orbit: 1.47, phase: 0.4, speed: 0.00018, height: 0.43 },
    { radius: 0.095, orbit: 1.58, phase: 2.65, speed: -0.00013, height: 0.31 },
    { radius: 0.055, orbit: 1.67, phase: 4.7, speed: 0.0001, height: 0.52 },
  ];
  const satellites = planetDefinitions.map((definition, index) => {
    const satelliteTexture = new THREE.CanvasTexture(makeSatelliteTexture(index));
    satelliteTexture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(definition.radius, 24, 24),
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0.4,
        clearcoatRoughness: 0.28,
        map: satelliteTexture,
        metalness: 0.04,
        roughness: 0.46,
      })
    );
    group.add(mesh);
    return { ...definition, mesh };
  });

  scene.add(new THREE.HemisphereLight("#f7e4c5", "#153b38", 1.32));
  const keyLight = new THREE.DirectionalLight("#ffe0aa", 3.8);
  keyLight.position.set(4.1, 2.6, 4.8);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight("#75bca1", 1.2, 12, 2);
  fillLight.position.set(-3.4, -1.4, 3.6);
  scene.add(fillLight);

  const resize = () => {
    const rect = planetHost.getBoundingClientRect();
    const size = Math.max(1, Math.round(Math.min(rect.width, rect.height)));
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(planetHost);
  resize();

  planetHost.dataset.planetReady = "true";

  const render = (time = 0) => {
    const motionScale = reducedMotion.matches ? 0 : 1;
    const tuningScale = document.body.classList.contains("adaptive-music-selection-loading") ? 1.28 : 1;
    group.rotation.y += 0.00155 * motionScale * tuningScale;
    group.rotation.x = Math.sin(time * 0.00022) * 0.035 * motionScale;
    ringA.rotation.z += 0.0007 * motionScale * tuningScale;
    ringB.rotation.z -= 0.00048 * motionScale * tuningScale;
    keyLight.position.x = 4.1 + Math.sin(time * 0.00017) * 1.1 * motionScale;
    fillLight.position.y = -1.2 + Math.cos(time * 0.00015) * 0.52 * motionScale;

    satellites.forEach((satellite, index) => {
      const angle = time * satellite.speed * motionScale + satellite.phase;
      satellite.mesh.position.set(
        Math.cos(angle) * satellite.orbit,
        Math.sin(angle * 1.14 + index * 0.72) * satellite.height,
        Math.sin(angle) * 0.42
      );
      satellite.mesh.rotation.y += 0.003 * motionScale;
    });

    markers.forEach((marker, index) => {
      const pulse = reducedMotion.matches ? 1 : 1 + Math.sin(time * 0.0023 + index) * 0.16;
      marker.scale.setScalar(pulse);
      marker.material.opacity = 0.58 + (pulse - 1) * 0.8;
    });

    renderer.render(scene, camera);
    planetFrame = window.requestAnimationFrame(render);
  };

  const syncVisibility = () => {
    if (document.hidden) {
      window.cancelAnimationFrame(planetFrame);
      planetFrame = 0;
      return;
    }
    if (!planetFrame) planetFrame = window.requestAnimationFrame(render);
  };
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
}

function makeRing(THREE, radius, colour, opacity, rotationX, rotationY, rotationZ) {
  const material = new THREE.MeshBasicMaterial({
    color: colour,
    depthWrite: false,
    opacity,
    transparent: true,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.004, 8, 160), material);
  ring.rotation.set(rotationX, rotationY, rotationZ);
  return ring;
}

function makeContextTexture(monogramImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const ocean = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, "#0e3433");
  ocean.addColorStop(0.48, "#2f7268");
  ocean.addColorStop(1, "#071e20");
  context.fillStyle = ocean;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalAlpha = 0.16;
  context.strokeStyle = "#a8d4c4";
  context.lineWidth = 1;
  for (let y = 64; y < canvas.height; y += 62) {
    context.beginPath();
    for (let x = 0; x <= canvas.width; x += 16) {
      const wave = y + Math.sin((x + y) * 0.025) * 6;
      if (x === 0) context.moveTo(x, wave);
      else context.lineTo(x, wave);
    }
    context.stroke();
  }
  context.globalAlpha = 1;

  const lands = [
    [[0, 42], [182, 18], [252, 108], [181, 180], [34, 154]],
    [[278, 52], [444, 0], [536, 92], [476, 208], [338, 188]],
    [[606, 46], [770, 20], [848, 112], [778, 188], [652, 162]],
    [[872, 90], [1024, 48], [1024, 220], [918, 236], [850, 172]],
    [[74, 286], [242, 236], [322, 334], [246, 476], [94, 438]],
    [[416, 268], [566, 220], [660, 316], [594, 486], [454, 456]],
    [[744, 282], [936, 244], [1024, 340], [1024, 512], [838, 486], [706, 396]],
  ];

  lands.forEach((points, index) => {
    context.save();
    context.beginPath();
    points.forEach(([x, y], pointIndex) => {
      if (pointIndex === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    const land = context.createLinearGradient(points[0][0], points[0][1], points[2][0], points[2][1]);
    land.addColorStop(0, index % 2 ? "#8e5f3b" : "#653a25");
    land.addColorStop(1, index % 2 ? "#4f2b1e" : "#9a6a42");
    context.fillStyle = land;
    context.fill();
    context.clip();
    if (monogramImage) {
      const pattern = context.createPattern(monogramImage, "repeat");
      if (pattern) {
        context.globalAlpha = 0.16;
        context.fillStyle = pattern;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    context.restore();
    context.strokeStyle = "rgba(226, 182, 117, 0.66)";
    context.lineWidth = 3;
    context.stroke();
  });

  const light = context.createRadialGradient(690, 148, 12, 690, 148, 250);
  light.addColorStop(0, "rgba(255, 239, 196, 0.36)");
  light.addColorStop(1, "rgba(255, 239, 196, 0)");
  context.fillStyle = light;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function makeSatelliteTexture(seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  const palettes = [
    ["#173e3c", "#7b5232", "#d5aa68"],
    ["#234c45", "#875e3d", "#8fc5b1"],
    ["#102f31", "#65412d", "#d0b078"],
  ][seed % 3];
  background.addColorStop(0, palettes[0]);
  background.addColorStop(1, palettes[1]);
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = palettes[2];
  context.globalAlpha = 0.56;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-12, 62 - seed * 4);
  context.bezierCurveTo(42, 6 + seed * 7, 108, 102 - seed * 5, 206, 34 + seed * 8);
  context.stroke();
  return canvas;
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function initSoundDisclosure() {
  if (!soundTrigger || !soundDialog || !soundPanel) return;

  soundTrigger.addEventListener("click", openSoundDialog);
  soundCloseControls.forEach((control) => control.addEventListener("click", closeSoundDialog));
  playTrigger?.addEventListener("click", closeSoundDialog, { capture: true });

  document.addEventListener("keydown", (event) => {
    if (soundDialog.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeSoundDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(soundPanel.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])"))
      .filter((element) => !element.disabled && !element.hidden);
    if (!focusable.length) {
      event.preventDefault();
      soundPanel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function openSoundDialog() {
  if (!soundDialog || !soundTrigger) return;
  dialogReturnTarget = document.activeElement;
  soundDialog.hidden = false;
  soundDialog.setAttribute("aria-hidden", "false");
  soundTrigger.setAttribute("aria-expanded", "true");
  document.body.classList.add("homepage-sound-dialog-open");
  window.requestAnimationFrame(() => soundPanel?.focus());
}

function closeSoundDialog() {
  if (!soundDialog || soundDialog.hidden) return;
  soundDialog.hidden = true;
  soundDialog.setAttribute("aria-hidden", "true");
  soundTrigger?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("homepage-sound-dialog-open");
  if (dialogReturnTarget instanceof HTMLElement) dialogReturnTarget.focus();
  dialogReturnTarget = null;
}

function applySoundSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const lane = String(snapshot.dominant_lane || snapshot.dominantLane || "").trim().toLowerCase();
  const rate = Number(snapshot.isochronic_hz ?? snapshot.isochronicHz);
  const carrier = Number(snapshot.carrier_hz ?? snapshot.carrierHz);
  if (!lane || !Number.isFinite(rate) || !Number.isFinite(carrier)) return;

  setText("[data-homepage-sound-lane]", `${lane}-dominant`);
  setText("[data-homepage-sound-rate]", `${formatFrequency(rate)} Hz`);
  setText("[data-homepage-sound-carrier]", `${formatFrequency(carrier)} Hz`);
  setText("[data-homepage-dialog-carrier]", `${formatFrequency(carrier)} Hz`);

  const preview = document.querySelector("[data-homepage-sound-preview]");
  if (preview) preview.hidden = snapshot.status === "playing" || snapshot.status === "armed";
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function formatFrequency(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}
