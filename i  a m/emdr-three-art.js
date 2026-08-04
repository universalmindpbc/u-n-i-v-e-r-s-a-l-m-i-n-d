(function () {
  const state = {
    active: false,
    ready: false,
    loading: null,
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,
    sculpture: null,
    upPivot: null,
    downPivot: null,
    materials: [],
    edgeMaterials: [],
    facetMaterials: [],
    seedMaterial: null,
    nestedStars: [],
    architecture: [],
    pearls: [],
    sparkles: [],
    core: null,
    lights: null,
    environmentTexture: null,
    lastWidth: 0,
    lastHeight: 0,
    diagnosticFrame: 0,
    lastRenderTime: 0,
    motionEnvelope: { bass: 0, kick: 0, snare: 0, accent: 0 },
  };

  const THREE_URL = "https://unpkg.com/three@0.165.0/build/three.module.js";
  const STELLA_VISIBLE_TURN = Math.PI * 2 / 3;
  const STELLA_MANUAL_LOW_SECONDS = 10;
  const STELLA_MANUAL_HIGH_SECONDS = 2;
  const STELLA_AUTOMATION_PHRASE_BEATS = 64;

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function smoothStep(value) {
    const t = clamp01(value);
    return t * t * (3 - 2 * t);
  }

  function cyclicKeyframe(phase, values) {
    const segments = Math.max(1, values.length - 1);
    const scaled = clamp01(phase) * segments;
    const index = Math.min(segments - 1, Math.floor(scaled));
    const mix = smoothStep(scaled - index);
    return values[index] + (values[index + 1] - values[index]) * mix;
  }

  function settle(current, target, deltaSeconds, attackSeconds, releaseSeconds) {
    const duration = target > current ? attackSeconds : releaseSeconds;
    const glide = 1 - Math.exp(-Math.max(0, deltaSeconds) / Math.max(.001, duration));
    return current + (target - current) * glide;
  }

  function updateMotionEnvelope(time, audio, rhythm) {
    const deltaSeconds = state.lastRenderTime
      ? Math.max(1 / 240, Math.min(.1, time - state.lastRenderTime))
      : 1 / 60;
    state.lastRenderTime = time;
    const targets = {
      bass: clamp01(rhythm ? rhythm[0] : (audio?.[0] || 0)),
      kick: clamp01(rhythm?.[1]),
      snare: clamp01(rhythm?.[2]),
      accent: clamp01(rhythm?.[3]),
    };
    state.motionEnvelope.bass = settle(state.motionEnvelope.bass, targets.bass, deltaSeconds, .12, .72);
    state.motionEnvelope.kick = settle(state.motionEnvelope.kick, targets.kick, deltaSeconds, .045, .48);
    state.motionEnvelope.snare = settle(state.motionEnvelope.snare, targets.snare, deltaSeconds, .055, .64);
    state.motionEnvelope.accent = settle(state.motionEnvelope.accent, targets.accent, deltaSeconds, .08, .88);
    return state.motionEnvelope;
  }

  function automationComposition(automated, beatPosition) {
    const wrappedBeat = ((Number(beatPosition) % STELLA_AUTOMATION_PHRASE_BEATS) + STELLA_AUTOMATION_PHRASE_BEATS) % STELLA_AUTOMATION_PHRASE_BEATS;
    const phase = wrappedBeat / STELLA_AUTOMATION_PHRASE_BEATS;
    const sceneIndex = Math.min(3, Math.floor(phase * 4));
    if (!automated) {
      return { phase, scene: "manual", bloom: 0, separation: 0, orbit: 0, camera: 0, light: 0 };
    }
    return {
      phase,
      scene: ["gather", "open", "orbit", "resolve"][sceneIndex],
      bloom: cyclicKeyframe(phase, [.08, .42, 1, .62, .08]),
      separation: cyclicKeyframe(phase, [.04, .3, 1, .58, .04]),
      orbit: cyclicKeyframe(phase, [0, .28, .66, 1, 0]),
      camera: cyclicKeyframe(phase, [0, .24, .7, .42, 0]),
      light: cyclicKeyframe(phase, [.12, .55, 1, .72, .12]),
    };
  }

  function tetrahedronGeometry(THREE) {
    const apex = [0, 1.24, 0];
    const baseY = -0.413333;
    const radius = 1.17;
    const base = Array.from({ length: 3 }, (_, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / 3;
      return [Math.cos(angle) * radius, baseY, Math.sin(angle) * radius];
    });
    const vertices = [apex, ...base];
    const faces = [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]];
    const positions = [];
    faces.forEach((face) => face.forEach((index) => positions.push(...vertices[index])));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function seedMaterial(THREE) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
        uIntensity: { value: .6 },
        uOpacity: { value: 1 },
        uHue: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uBass;
        uniform float uTreble;
        uniform float uIntensity;
        uniform float uOpacity;
        uniform float uHue;
        #define TAU 6.28318530718
        float ring(vec2 p, vec2 centre, float radius, float width) {
          float d = abs(length(p - centre) - radius);
          return 1.0 - smoothstep(width, width + fwidth(d) * 1.35, d);
        }
        void main() {
          vec2 p = (vUv - .5) * 2.0;
          p.x *= 1.08;
          float radius = .315 + uBass * .018;
          float line = ring(p, vec2(0.0), radius, .008 + uTreble * .006);
          for (int i = 0; i < 6; i++) {
            float a = float(i) * TAU / 6.0 + uTime * .018;
            vec2 centre = vec2(cos(a), sin(a)) * radius;
            line = max(line, ring(p, centre, radius, .008 + uTreble * .006));
          }
          float pool = exp(-dot(p * vec2(.84, 1.12), p * vec2(.84, 1.12)) * 2.65);
          float phrase = .82 + .18 * sin(uTime * .28);
          vec3 champagne = vec3(1.0, .82, .58);
          vec3 pearl = vec3(1.0, .94, .97);
          vec3 violet = vec3(.43, .10, .82);
          vec3 crimson = vec3(.72, .02, .16);
          float chroma = .5 + .5 * sin(uTime * .09 + p.x * 1.65 + uHue);
          vec3 colour = mix(mix(champagne, pearl, chroma), mix(crimson, violet, chroma), .18 + uIntensity * .18);
          float alpha = line * (.10 + uIntensity * .17 + uTreble * .10) * phrase * uOpacity;
          colour += mix(crimson, violet, .5 + .5 * sin(uTime * .07)) * pool * .08;
          alpha += pool * (.004 + uIntensity * .007) * uOpacity;
          gl_FragColor = vec4(colour, alpha);
        }
      `,
    });
  }

  function environmentTexture(THREE) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 384;
    const context = canvas.getContext("2d");
    const base = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    base.addColorStop(0, "#47155f");
    base.addColorStop(.22, "#f1c994");
    base.addColorStop(.42, "#fff8ee");
    base.addColorStop(.62, "#8d164b");
    base.addColorStop(.82, "#7d3bc3");
    base.addColorStop(1, "#f6d7ae");
    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);

    [
      { x: .13, width: .018, colour: "rgba(255, 252, 243, .96)" },
      { x: .29, width: .055, colour: "rgba(255, 214, 159, .76)" },
      { x: .51, width: .014, colour: "rgba(255, 255, 255, .98)" },
      { x: .69, width: .045, colour: "rgba(156, 28, 82, .82)" },
      { x: .87, width: .022, colour: "rgba(220, 185, 255, .9)" },
    ].forEach((band) => {
      const gradient = context.createLinearGradient(
        canvas.width * (band.x - band.width), 0,
        canvas.width * (band.x + band.width), 0
      );
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(.5, band.colour);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  function sparkleTexture(THREE) {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const context = canvas.getContext("2d");
    context.translate(48, 48);
    context.fillStyle = "rgba(255, 248, 229, .98)";
    context.beginPath();
    context.moveTo(0, -46);
    context.lineTo(4, -6);
    context.lineTo(18, 0);
    context.lineTo(4, 5);
    context.lineTo(0, 46);
    context.lineTo(-4, 5);
    context.lineTo(-18, 0);
    context.lineTo(-4, -6);
    context.closePath();
    context.fill();
    context.fillStyle = "rgba(255,255,255,1)";
    context.beginPath();
    context.arc(0, 0, 3.2, 0, Math.PI * 2);
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function physicalMaterial(THREE, options) {
    const material = new THREE.MeshPhysicalMaterial({
      color: options.color,
      emissive: options.emissive,
      emissiveIntensity: options.emissiveIntensity,
      metalness: options.metalness,
      roughness: options.roughness,
      transparent: true,
      opacity: options.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: options.clearcoatRoughness ?? .055,
      transmission: options.transmission ?? 0,
      thickness: options.thickness ?? 0,
      ior: options.ior ?? 1.48,
      attenuationColor: new THREE.Color(options.attenuationColor || options.color),
      attenuationDistance: options.attenuationDistance ?? 1.4,
      envMapIntensity: options.envMapIntensity ?? 1.35,
      specularIntensity: 1,
      specularColor: new THREE.Color(options.specular || "#fff7e9"),
      iridescence: options.iridescence ?? .72,
      iridescenceIOR: 1.34,
      iridescenceThicknessRange: options.iridescenceThicknessRange || [160, 520],
      sheen: 1,
      sheenRoughness: options.sheenRoughness ?? .18,
      sheenColor: new THREE.Color(options.sheen),
      blending: THREE.NormalBlending,
    });
    material.userData.baseOpacity = options.opacity;
    material.userData.baseEmissive = options.emissiveIntensity;
    material.userData.role = options.role || "glass";
    state.materials.push(material);
    return material;
  }

  function addCoutureEdges(THREE, mesh, geometry, colour, opacity) {
    const material = new THREE.LineBasicMaterial({
      color: colour,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    material.userData.baseOpacity = opacity;
    state.edgeMaterials.push(material);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 12), material);
    edges.scale.setScalar(1.003);
    mesh.add(edges);
  }

  function coutureFacetMaterial(THREE, primary, secondary) {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: .6 },
        uSweep: { value: 0 },
        uFlash: { value: 0 },
        uPrimary: { value: new THREE.Color(primary) },
        uSecondary: { value: new THREE.Color(secondary) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -viewPosition.xyz;
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSweep;
        uniform float uFlash;
        uniform vec3 uPrimary;
        uniform vec3 uSecondary;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDirection = normalize(vViewPosition);
          float rim = pow(1.0 - abs(dot(normal, viewDirection)), 2.65);
          float cut = pow(max(0.0, dot(normal, normalize(vec3(-.18, .72, .68)))), 11.0);
          float sweep = exp(-pow(vWorldPosition.x - uSweep * 1.45, 2.0) * 7.0);
          float prismatic = .5 + .5 * sin(uTime * .055 + normal.x * 2.2 + normal.y * 1.6);
          vec3 colour = mix(uPrimary, uSecondary, prismatic);
          colour = mix(colour, vec3(1.0, .985, .95), cut * .72 + uFlash * .55);
          float alpha = rim * (.075 + uIntensity * .075);
          alpha += cut * (.045 + uIntensity * .035);
          alpha += sweep * (rim * .14 + cut * .055);
          alpha += uFlash * (rim * .22 + cut * .14);
          gl_FragColor = vec4(colour, min(alpha, .46));
        }
      `,
    });
    state.facetMaterials.push(material);
    return material;
  }

  function addTemple(THREE, scene) {
    const group = new THREE.Group();
    group.position.set(0, -.24, -2.35);
    const geometry = new THREE.OctahedronGeometry(1, 0);
    const specifications = [
      { x: -3.15, y: -.24, z: -.42, width: .18, height: 1.18, colour: "#f5d6aa", opacity: .045, phase: .2 },
      { x: -2.34, y: .08, z: -.18, width: .14, height: 1.7, colour: "#fff6e8", opacity: .06, phase: 1.1 },
      { x: -1.63, y: -.34, z: .08, width: .12, height: 1.06, colour: "#7c2cb6", opacity: .052, phase: 2.3 },
      { x: 1.58, y: -.31, z: .05, width: .12, height: 1.12, colour: "#941b4e", opacity: .055, phase: 3.1 },
      { x: 2.28, y: .04, z: -.18, width: .15, height: 1.72, colour: "#ead3ff", opacity: .06, phase: 4.2 },
      { x: 3.08, y: -.27, z: -.46, width: .18, height: 1.23, colour: "#f4c890", opacity: .045, phase: 5.4 },
    ];
    specifications.forEach((specification) => {
      const material = new THREE.MeshPhysicalMaterial({
        color: specification.colour,
        emissive: specification.colour,
        emissiveIntensity: .08,
        metalness: .04,
        roughness: .14,
        clearcoat: 1,
        clearcoatRoughness: .08,
        transparent: true,
        opacity: specification.opacity,
        depthWrite: false,
        transmission: .34,
        thickness: .25,
        ior: 1.42,
        envMapIntensity: 1.1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(specification.x, specification.y, specification.z);
      mesh.scale.set(specification.width, specification.height, specification.width);
      mesh.rotation.y = Math.PI / 4;
      group.add(mesh);
      state.architecture.push({
        mesh,
        material,
        baseY: specification.y,
        baseOpacity: specification.opacity,
        phase: specification.phase,
      });
    });
    scene.add(group);

    const pearlGeometry = new THREE.SphereGeometry(1, 24, 16);
    [
      { x: -2.5, y: .88, z: -1.2, size: .07, phase: .6 },
      { x: 2.72, y: .48, z: -1.52, size: .095, phase: 2.8 },
      { x: 1.95, y: 1.35, z: -2.2, size: .05, phase: 4.7 },
    ].forEach((specification) => {
      const material = new THREE.MeshPhysicalMaterial({
        color: "#fff8ef",
        roughness: .16,
        metalness: .08,
        clearcoat: 1,
        clearcoatRoughness: .04,
        iridescence: .8,
        iridescenceIOR: 1.31,
        iridescenceThicknessRange: [180, 430],
        transparent: true,
        opacity: .42,
        depthWrite: false,
        envMapIntensity: 1.8,
      });
      const mesh = new THREE.Mesh(pearlGeometry, material);
      mesh.position.set(specification.x, specification.y, specification.z);
      mesh.scale.setScalar(specification.size);
      scene.add(mesh);
      state.pearls.push({
        mesh,
        material,
        baseX: specification.x,
        baseY: specification.y,
        phase: specification.phase,
      });
    });
  }

  function addSculpture(THREE, scene) {
    const geometry = tetrahedronGeometry(THREE);
    const upMaterial = physicalMaterial(THREE, {
      color: "#fff4df", emissive: "#7d2948", emissiveIntensity: .075,
      metalness: .01, roughness: .045, opacity: .23, sheen: "#fffdf8",
      transmission: .9, thickness: .62, attenuationColor: "#be5574",
      attenuationDistance: 1.65, envMapIntensity: 2.65, role: "outer",
    });
    const downMaterial = physicalMaterial(THREE, {
      color: "#ede2ff", emissive: "#451279", emissiveIntensity: .08,
      metalness: .01, roughness: .04, opacity: .215, sheen: "#fbf2ff",
      transmission: .91, thickness: .58, attenuationColor: "#6d28a5",
      attenuationDistance: 1.48, envMapIntensity: 2.75, role: "outer",
    });
    const innerUpMaterial = physicalMaterial(THREE, {
      color: "#fff4e4", emissive: "#8f224e", emissiveIntensity: .28,
      metalness: .01, roughness: .09, opacity: .17, sheen: "#fffdf7",
      transmission: .82, thickness: .34, attenuationColor: "#bd3565",
      attenuationDistance: .86, envMapIntensity: 1.9, role: "inner",
    });
    const innerDownMaterial = physicalMaterial(THREE, {
      color: "#d24a81", emissive: "#68134a", emissiveIntensity: .3,
      metalness: .01, roughness: .09, opacity: .18, sheen: "#e8c7ff",
      transmission: .68, thickness: .32, attenuationColor: "#681096",
      attenuationDistance: .74, envMapIntensity: 1.82, role: "inner",
    });

    state.sculpture = new THREE.Group();
    state.sculpture.position.y = .18;
    state.upPivot = new THREE.Group();
    state.downPivot = new THREE.Group();

    const up = new THREE.Mesh(geometry, upMaterial);
    const down = new THREE.Mesh(geometry, downMaterial);
    down.rotation.z = Math.PI;
    up.castShadow = true;
    down.castShadow = true;
    addCoutureEdges(THREE, up, geometry, "#ffe0a9", .34);
    addCoutureEdges(THREE, down, geometry, "#e5caff", .31);

    const upFacet = new THREE.Mesh(geometry, coutureFacetMaterial(THREE, "#f2c17e", "#fffaf2"));
    const downFacet = new THREE.Mesh(geometry, coutureFacetMaterial(THREE, "#7525c7", "#f2dfff"));
    upFacet.scale.setScalar(1.006);
    downFacet.scale.setScalar(1.006);
    downFacet.rotation.z = Math.PI;

    const innerUp = new THREE.Mesh(geometry, innerUpMaterial);
    innerUp.scale.setScalar(.46);
    innerUp.rotation.y = Math.PI / 3;
    const innerDown = new THREE.Mesh(geometry, innerDownMaterial);
    innerDown.scale.setScalar(.46);
    innerDown.rotation.z = Math.PI;
    innerDown.rotation.y = -Math.PI / 3;

    [
      { scale: .27, threshold: .36, offset: Math.PI / 5 },
      { scale: .69, threshold: .76, offset: -Math.PI / 7 },
    ].forEach((specification) => {
      const nestedUp = new THREE.Mesh(geometry, innerUpMaterial);
      const nestedDown = new THREE.Mesh(geometry, innerDownMaterial);
      nestedUp.scale.setScalar(specification.scale);
      nestedDown.scale.setScalar(specification.scale);
      nestedUp.rotation.y = specification.offset;
      nestedDown.rotation.y = -specification.offset;
      nestedDown.rotation.z = Math.PI;
      nestedUp.visible = false;
      nestedDown.visible = false;
      state.upPivot.add(nestedUp);
      state.downPivot.add(nestedDown);
      state.nestedStars.push({ up: nestedUp, down: nestedDown, threshold: specification.threshold });
    });

    const upAura = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: "#ffd9a2", transparent: true, opacity: .014, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    upAura.scale.setScalar(1.055);
    const downAura = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: "#ab54ee", transparent: true, opacity: .012, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    downAura.scale.setScalar(1.055);
    downAura.rotation.z = Math.PI;

    state.upPivot.add(up, innerUp, upAura, upFacet);
    state.downPivot.add(down, innerDown, downAura, downFacet);
    state.sculpture.add(state.upPivot, state.downPivot);

    const coreMaterial = physicalMaterial(THREE, {
      color: "#a4124d", emissive: "#7b073b", emissiveIntensity: .56,
      metalness: .03, roughness: .1, opacity: .62, sheen: "#f4c6ff",
      transmission: .18, thickness: .48, attenuationColor: "#4b0a78",
      attenuationDistance: .65, envMapIntensity: 2.1, iridescence: .55, role: "core",
    });
    state.core = new THREE.Mesh(new THREE.OctahedronGeometry(.31, 0), coreMaterial);
    state.core.rotation.set(Math.PI / 4, Math.PI / 4, 0);
    state.sculpture.add(state.core);

    const glintTexture = sparkleTexture(THREE);
    [
      [0, 1.27, .16], [1.02, -.4, .42], [-1.02, -.42, .48],
      [.72, .26, -.72], [-.62, .37, .82], [.04, -.98, .58],
    ].forEach((position, index) => {
      const material = new THREE.SpriteMaterial({
        map: glintTexture,
        color: index % 3 === 1 ? 0xf3d4ff : 0xfff5dc,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(...position);
      sprite.scale.setScalar(.11);
      state.sculpture.add(sprite);
      state.sparkles.push({ sprite, material, phase: index * 1.37 + .4 });
    });

    scene.add(state.sculpture);
  }

  async function init() {
    if (state.ready) return true;
    if (state.loading) return state.loading;
    state.loading = (async () => {
      const THREE = window.THREE || await import(THREE_URL);
      window.THREE = THREE;
      state.canvas = document.querySelector("[data-emdr-three-canvas]");
      if (!state.canvas) return false;

      const renderer = new THREE.WebGLRenderer({ canvas: state.canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      state.renderer = renderer;

      state.scene = new THREE.Scene();
      state.camera = new THREE.PerspectiveCamera(34, 1, .1, 30);
      state.camera.position.set(.26, .46, 6.18);

      state.environmentTexture = environmentTexture(THREE);
      state.scene.environment = state.environmentTexture;

      state.scene.add(new THREE.HemisphereLight(0xfff7ed, 0x512060, .72));
      const key = new THREE.DirectionalLight(0xffe2b8, 3.15);
      key.position.set(3.2, 4.6, 4.3);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = .1;
      key.shadow.camera.far = 12;
      key.shadow.camera.left = -3.2;
      key.shadow.camera.right = 3.2;
      key.shadow.camera.top = 3.2;
      key.shadow.camera.bottom = -3.2;
      state.scene.add(key);
      const crimson = new THREE.PointLight(0xb51555, 10, 8, 2);
      crimson.position.set(-2.7, -.1, 2.1);
      const violet = new THREE.PointLight(0x7a2ee6, 12, 8, 2);
      violet.position.set(2.65, .2, 2.05);
      const sweep = new THREE.PointLight(0xfff0cf, 12, 8, 1.8);
      sweep.position.set(-3.2, 1.25, 3.2);
      const rim = new THREE.PointLight(0xf9e4ff, 9, 8, 2);
      rim.position.set(0, 1.15, -2.3);
      state.scene.add(crimson, violet, sweep, rim);
      state.lights = { key, crimson, violet, sweep, rim };

      addTemple(THREE, state.scene);
      addSculpture(THREE, state.scene);

      state.seedMaterial = seedMaterial(THREE);
      const seed = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 3.05, 1, 1), state.seedMaterial);
      seed.rotation.x = -Math.PI / 2;
      seed.position.set(0, -1.46, .08);
      state.scene.add(seed);
      state.seedMaterial.uniforms.uOpacity.value = .72;

      const receiver = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 4.2),
        new THREE.ShadowMaterial({ transparent: true, opacity: .065, color: 0x39133f })
      );
      receiver.rotation.x = -Math.PI / 2;
      receiver.position.y = -1.48;
      receiver.receiveShadow = true;
      state.scene.add(receiver);

      state.ready = true;
      return true;
    })().catch((error) => {
      console.error("EMDR 3D artwork failed to initialise", error);
      state.loading = null;
      return false;
    });
    return state.loading;
  }

  function resize() {
    if (!state.renderer || !state.canvas) return;
    const width = Math.max(1, state.canvas.clientWidth);
    const height = Math.max(1, state.canvas.clientHeight);
    if (width === state.lastWidth && height === state.lastHeight) return;
    state.lastWidth = width;
    state.lastHeight = height;
    state.renderer.setSize(width, height, false);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
  }

  function render({ time, audio, rhythm, intensity, motion, automated = false, beatPosition = 0 }) {
    if (!state.active) return;
    if (!state.ready) {
      init();
      return;
    }
    resize();
    const envelope = updateMotionEnvelope(time, audio, rhythm);
    const bass = envelope.bass;
    const kick = envelope.kick;
    const snare = envelope.snare;
    const accent = envelope.accent;
    const movement = Math.max(.12, Math.min(1, Number(motion) || 1));
    const composition = automationComposition(automated, beatPosition);
    const normalizedIntensity = Math.max(0, Math.min(1, intensity / .77));
    const manualLowPace = STELLA_VISIBLE_TURN / STELLA_MANUAL_LOW_SECONDS;
    const manualHighPace = STELLA_VISIBLE_TURN / STELLA_MANUAL_HIGH_SECONDS;
    const manualPace = manualLowPace + (manualHighPace - manualLowPace) * Math.pow(normalizedIntensity, 1.22);
    const pace = manualPace * (1 + composition.orbit * .08) * movement;
    const rhythmicPulse = Math.max(kick, snare, accent);
    const breathWave = .5 + .5 * Math.sin(time * .58);
    const breath = Math.max(.82, Math.min(1.12,
      .88
      + breathWave * (.035 + normalizedIntensity * .025) * movement
      + composition.bloom * .08 * movement
      + bass * .025 * movement
      - kick * .035 * movement
      + snare * .018 * movement
    ));
    const separation = .012 + normalizedIntensity * .025
      + composition.separation * .12 * movement
      + snare * .09 * movement
      + accent * .04 * movement
      + kick * .018 * movement;
    const phraseAngle = composition.phase * Math.PI * 2;
    const automationTwist = automated ? Math.sin(phraseAngle) * .26 * composition.orbit * movement : 0;
    const sweepPosition = Math.sin(time * .42) * .72 + Math.sin(phraseAngle) * composition.light * .28;
    const flash = Math.pow(Math.max(0, Math.sin(time * .29 - 1.4)), 34) * (automated ? .9 : .4);

    state.sculpture.scale.setScalar(breath);
    state.sculpture.rotation.x = .12 + Math.sin(time * .11) * .075 * movement + composition.camera * .035 * movement;
    state.sculpture.rotation.z = Math.sin(time * .075) * .032 * movement + Math.sin(phraseAngle) * composition.orbit * .045 * movement;
    state.upPivot.position.y = separation;
    state.downPivot.position.y = -separation;
    state.upPivot.scale.setScalar(1 + composition.bloom * .04 * movement - kick * (.055 + normalizedIntensity * .025) * movement + snare * .028 * movement + accent * .018 * movement);
    state.downPivot.scale.setScalar(1 + composition.bloom * .04 * movement + snare * (.065 + normalizedIntensity * .025) * movement - kick * .025 * movement + accent * .018 * movement);
    state.upPivot.rotation.x = composition.separation * .18 * movement + snare * .1 * movement;
    state.downPivot.rotation.x = -composition.separation * .18 * movement - kick * .065 * movement;
    state.upPivot.rotation.z = composition.orbit * .09 * movement + accent * .06 * movement;
    state.downPivot.rotation.z = -composition.orbit * .09 * movement - accent * .06 * movement;
    state.upPivot.rotation.y = time * pace + automationTwist;
    state.downPivot.rotation.y = -time * pace * .74 - automationTwist * .82;
    state.nestedStars.forEach((star, index) => {
      star.up.visible = normalizedIntensity >= star.threshold;
      star.down.visible = normalizedIntensity >= star.threshold;
      if (!star.up.visible) return;
      const nestedPace = pace * (1.08 + index * .24);
      star.up.rotation.y = time * nestedPace + index * .72;
      star.down.rotation.y = -time * nestedPace * .9 - index * .64;
      const nestedPulse = 1
        + composition.bloom * (.11 + index * .035) * movement
        + snare * (.1 + index * .035) * movement
        + accent * (.055 + index * .02) * movement
        - kick * .035 * movement;
      star.up.scale.setScalar((index === 0 ? .27 : .69) * nestedPulse);
      star.down.scale.setScalar((index === 0 ? .27 : .69) * nestedPulse);
    });
    state.camera.position.x = .25 + Math.sin(time * .085) * .3 * movement + Math.sin(phraseAngle) * composition.camera * .28 * movement;
    state.camera.position.y = .45 + Math.sin(time * .068) * .1 * movement + composition.bloom * .08 * movement;
    state.camera.position.z = 6.16 + Math.cos(time * .055) * .14 * movement - composition.camera * .32 * movement + kick * .04 * movement;
    state.camera.lookAt(0, .04 + snare * .03 * movement, 0);

    state.lights.sweep.position.x = sweepPosition * 3.45;
    state.lights.sweep.position.y = 1.02 + Math.cos(time * .42) * .42;
    state.lights.sweep.intensity = 10 + intensity * 8 + composition.light * 8 + flash * 28 + snare * 7 + accent * 4;
    state.lights.key.intensity = 2.65 + intensity * .9 + composition.bloom * 2.6 + flash * 7 + kick * 1.4;
    state.lights.crimson.position.x = -2.55 + Math.sin(time * .13) * .36;
    state.lights.violet.position.x = 2.55 - Math.sin(time * .13) * .36;
    state.lights.rim.intensity = 7.5 + bass * 7 + intensity * 3 + composition.light * 5 + snare * 3;

    state.materials.forEach((material) => {
      const role = material.userData.role;
      if (role === "outer") {
        material.emissiveIntensity = material.userData.baseEmissive + intensity * .16 + composition.light * .12 + flash * .18 + accent * .1;
        material.opacity = material.userData.baseOpacity * (.78 + intensity * .1 + composition.bloom * .14);
      } else if (role === "inner") {
        material.emissiveIntensity = material.userData.baseEmissive + intensity * .44 + bass * .24 + snare * .28 + composition.light * .2;
        material.opacity = material.userData.baseOpacity * (.86 + intensity * .42 + composition.bloom * .28);
      } else if (role === "core") {
        material.emissiveIntensity = material.userData.baseEmissive + intensity * .5 + bass * .5 + kick * .3 + snare * .18 + composition.light * .32 + flash * .3;
        material.opacity = material.userData.baseOpacity * (.78 + intensity * .28 + composition.bloom * .16);
      }
    });
    state.edgeMaterials.forEach((material, index) => {
      material.opacity = Math.min(.84, material.userData.baseOpacity * (.72 + intensity * .52 + composition.light * .38) + flash * .42 + snare * (index ? .18 : .28) + accent * .12);
    });
    state.facetMaterials.forEach((material) => {
      material.uniforms.uTime.value = time;
      material.uniforms.uIntensity.value = intensity;
      material.uniforms.uSweep.value = sweepPosition;
      material.uniforms.uFlash.value = flash;
    });
    if (state.core) {
      const corePulse = Math.max(.86, Math.min(1.16,
        1 + breathWave * .03 * movement + composition.bloom * .06 * movement + bass * .06 * movement - kick * .09 * movement + snare * .04 * movement
      ));
      state.core.scale.setScalar(corePulse);
      state.core.rotation.y = -time * pace * 1.35;
      state.core.rotation.x = Math.PI / 4 + Math.sin(time * .12) * .12 * movement + composition.orbit * .16 * movement;
    }
    state.architecture.forEach((item) => {
      item.mesh.position.y = item.baseY + Math.sin(time * .075 + item.phase) * (.04 + composition.bloom * .04) * movement;
      item.mesh.rotation.y = Math.PI / 4 + Math.sin(time * .045 + item.phase) * (.1 + composition.orbit * .08) * movement;
      item.material.opacity = item.baseOpacity * (.68 + intensity * .5 + composition.light * .42) + flash * .008;
    });
    state.pearls.forEach((item) => {
      item.mesh.position.x = item.baseX + Math.sin(time * .055 + item.phase) * .34;
      item.mesh.position.y = item.baseY + Math.cos(time * .07 + item.phase) * .11;
      item.material.opacity = .16 + intensity * .13 + flash * .09;
    });
    state.sparkles.forEach((item, index) => {
      const reveal = Math.pow(Math.max(0, Math.sin(time * .22 + item.phase)), 42);
      const reactive = (snare * (index % 3 === 0 ? .68 : .28) + accent * (index % 2 === 0 ? .34 : .16)) * movement;
      item.material.opacity = Math.min(.98, reveal * (.24 + intensity * .58 + composition.light * .28) + reactive + flash * .24);
      const glintScale = .085 + reveal * .11 + reactive * .075;
      item.sprite.scale.set(glintScale, glintScale, 1);
    });
    state.seedMaterial.uniforms.uTime.value = time;
    state.seedMaterial.uniforms.uBass.value = bass * .45;
    state.seedMaterial.uniforms.uTreble.value = snare * .45;
    state.seedMaterial.uniforms.uIntensity.value = intensity;
    state.seedMaterial.uniforms.uHue.value = sweepPosition * .28;
    state.diagnosticFrame += 1;
    if (state.diagnosticFrame % 20 === 0 && state.canvas) {
      state.canvas.dataset.emdrStellaControl = automated ? "automate" : "manual";
      state.canvas.dataset.emdrStellaPace = pace.toFixed(4);
      state.canvas.dataset.emdrStellaVisibleTurnSeconds = (STELLA_VISIBLE_TURN / Math.max(pace, .0001)).toFixed(2);
      state.canvas.dataset.emdrStellaPulse = rhythmicPulse.toFixed(4);
      state.canvas.dataset.emdrStellaBeatPosition = Number(beatPosition).toFixed(3);
      state.canvas.dataset.emdrStellaAutomationScene = composition.scene;
      state.canvas.dataset.emdrStellaAutomationPhase = composition.phase.toFixed(3);
      state.canvas.dataset.emdrStellaSeparation = separation.toFixed(4);
      state.canvas.dataset.emdrStellaScale = breath.toFixed(4);
      state.canvas.dataset.emdrStellaKickGesture = kick.toFixed(4);
      state.canvas.dataset.emdrStellaSnareGesture = snare.toFixed(4);
      state.canvas.dataset.emdrStellaAccentGesture = accent.toFixed(4);
    }
    state.renderer.render(state.scene, state.camera);
  }

  function setActive(active) {
    state.active = Boolean(active);
    state.lastRenderTime = 0;
    if (!state.active) state.motionEnvelope = { bass: 0, kick: 0, snare: 0, accent: 0 };
    const canvas = document.querySelector("[data-emdr-three-canvas]");
    canvas?.classList.toggle("is-active", state.active);
    if (state.active) init();
    else if (state.renderer) state.renderer.clear();
    return state.active;
  }

  window.IAMEMDRThree = { setActive, render, get ready() { return state.ready; } };
})();
