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
  };

  const THREE_URL = "https://unpkg.com/three@0.165.0/build/three.module.js";

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
      { x: -2.5, y: .88, z: -1.2, size: .105, phase: .6 },
      { x: 2.72, y: .48, z: -1.52, size: .14, phase: 2.8 },
      { x: 1.95, y: 1.35, z: -2.2, size: .072, phase: 4.7 },
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
      color: "#f2c98f", emissive: "#6d213a", emissiveIntensity: .11,
      metalness: .02, roughness: .08, opacity: .34, sheen: "#fff7df",
      transmission: .72, thickness: .58, attenuationColor: "#9d2755",
      attenuationDistance: 1.35, envMapIntensity: 1.65, role: "outer",
    });
    const downMaterial = physicalMaterial(THREE, {
      color: "#c6a7ec", emissive: "#3b146a", emissiveIntensity: .12,
      metalness: .02, roughness: .075, opacity: .31, sheen: "#f8dcff",
      transmission: .76, thickness: .54, attenuationColor: "#7930b3",
      attenuationDistance: 1.2, envMapIntensity: 1.72, role: "outer",
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
    addCoutureEdges(THREE, up, geometry, "#f7d9a9", .23);
    addCoutureEdges(THREE, down, geometry, "#ead7ff", .21);

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

    state.upPivot.add(up, innerUp, upAura);
    state.downPivot.add(down, innerDown, downAura);
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

  function render({ time, audio, rhythm, intensity, motion }) {
    if (!state.active) return;
    if (!state.ready) {
      init();
      return;
    }
    resize();
    const bass = rhythm ? rhythm[0] : (audio?.[0] || 0);
    const kick = rhythm ? rhythm[1] : 0;
    const snare = rhythm ? rhythm[2] : 0;
    const pace = (.035 + intensity * .12) * motion;
    const breath = 1 + bass * (.004 + intensity * .006) + kick * intensity * .009 + Math.sin(time * .58) * .0035;
    const separation = intensity * .007 + kick * intensity * .01;
    const sweepPosition = Math.sin(time * .42);
    const flash = Math.pow(Math.max(0, Math.sin(time * .29 - 1.4)), 34);

    state.sculpture.scale.setScalar(breath);
    state.sculpture.rotation.x = .12 + Math.sin(time * .11) * .045;
    state.sculpture.rotation.z = Math.sin(time * .075) * .018;
    state.upPivot.position.y = separation;
    state.downPivot.position.y = -separation;
    state.upPivot.rotation.y = time * pace;
    state.downPivot.rotation.y = -time * pace * .74;
    state.nestedStars.forEach((star, index) => {
      star.up.visible = intensity >= star.threshold;
      star.down.visible = intensity >= star.threshold;
      if (!star.up.visible) return;
      const nestedPace = pace * (1.08 + index * .24);
      star.up.rotation.y = time * nestedPace + index * .72;
      star.down.rotation.y = -time * nestedPace * .9 - index * .64;
      const nestedPulse = 1 + kick * intensity * (.016 + index * .008);
      star.up.scale.setScalar((index === 0 ? .27 : .69) * nestedPulse);
      star.down.scale.setScalar((index === 0 ? .27 : .69) * nestedPulse);
    });
    state.camera.position.x = .25 + Math.sin(time * .085) * .2;
    state.camera.position.y = .45 + Math.sin(time * .068) * .07;
    state.camera.position.z = 6.16 + Math.cos(time * .055) * .08;
    state.camera.lookAt(0, .04, 0);

    state.lights.sweep.position.x = sweepPosition * 3.45;
    state.lights.sweep.position.y = 1.02 + Math.cos(time * .42) * .42;
    state.lights.sweep.intensity = 10 + intensity * 8 + flash * 28 + snare * 2.2;
    state.lights.key.intensity = 2.65 + intensity * .9 + flash * 7;
    state.lights.crimson.position.x = -2.55 + Math.sin(time * .13) * .36;
    state.lights.violet.position.x = 2.55 - Math.sin(time * .13) * .36;
    state.lights.rim.intensity = 7.5 + bass * 5 + intensity * 3;

    state.materials.forEach((material) => {
      const role = material.userData.role;
      if (role === "outer") {
        material.emissiveIntensity = material.userData.baseEmissive + intensity * .16 + flash * .18;
        material.opacity = material.userData.baseOpacity * (.92 + intensity * .12);
      } else if (role === "inner") {
        material.emissiveIntensity = material.userData.baseEmissive + intensity * .44 + bass * .18 + snare * .12;
        material.opacity = material.userData.baseOpacity * (.86 + intensity * .42);
      } else if (role === "core") {
        material.emissiveIntensity = material.userData.baseEmissive + intensity * .5 + bass * .42 + kick * .16 + flash * .3;
        material.opacity = material.userData.baseOpacity * (.78 + intensity * .28);
      }
    });
    state.edgeMaterials.forEach((material, index) => {
      material.opacity = Math.min(.72, material.userData.baseOpacity * (.72 + intensity * .52) + flash * .42 + snare * (index ? .08 : .13));
    });
    if (state.core) {
      const corePulse = 1 + bass * (.025 + intensity * .025) + kick * .014;
      state.core.scale.setScalar(corePulse);
      state.core.rotation.y = -time * pace * 1.35;
      state.core.rotation.x = Math.PI / 4 + Math.sin(time * .12) * .12;
    }
    state.architecture.forEach((item) => {
      item.mesh.position.y = item.baseY + Math.sin(time * .075 + item.phase) * .035;
      item.mesh.rotation.y = Math.PI / 4 + Math.sin(time * .045 + item.phase) * .08;
      item.material.opacity = item.baseOpacity * (.68 + intensity * .5) + flash * .008;
    });
    state.pearls.forEach((item) => {
      item.mesh.position.x = item.baseX + Math.sin(time * .055 + item.phase) * .34;
      item.mesh.position.y = item.baseY + Math.cos(time * .07 + item.phase) * .11;
      item.material.opacity = .26 + intensity * .19 + flash * .12;
    });
    state.sparkles.forEach((item, index) => {
      const reveal = Math.pow(Math.max(0, Math.sin(time * .22 + item.phase)), 42);
      const reactive = snare * intensity * (index % 3 === 0 ? .42 : .16);
      item.material.opacity = Math.min(.95, reveal * (.24 + intensity * .58) + reactive + flash * .24);
      const glintScale = .085 + reveal * .11 + reactive * .05;
      item.sprite.scale.set(glintScale, glintScale, 1);
    });
    state.seedMaterial.uniforms.uTime.value = time;
    state.seedMaterial.uniforms.uBass.value = bass * .45;
    state.seedMaterial.uniforms.uTreble.value = snare * .45;
    state.seedMaterial.uniforms.uIntensity.value = intensity;
    state.seedMaterial.uniforms.uHue.value = sweepPosition * .28;
    state.renderer.render(state.scene, state.camera);
  }

  function setActive(active) {
    state.active = Boolean(active);
    const canvas = document.querySelector("[data-emdr-three-canvas]");
    canvas?.classList.toggle("is-active", state.active);
    if (state.active) init();
    else if (state.renderer) state.renderer.clear();
    return state.active;
  }

  window.IAMEMDRThree = { setActive, render, get ready() { return state.ready; } };
})();
