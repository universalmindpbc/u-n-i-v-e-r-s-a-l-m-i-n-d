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
    seedMaterial: null,
    nestedStars: [],
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
          vec3 champagne = vec3(1.0, .77, .42);
          vec3 ice = vec3(.38, .82, 1.0);
          vec3 colour = mix(champagne, ice, .5 + .5 * sin(uTime * .11 + p.x * 1.8 + uHue));
          float alpha = line * (.34 + uIntensity * .42 + uTreble * .16) * phrase * uOpacity;
          colour += mix(vec3(.05, .025, .01), vec3(.01, .06, .09), .5 + .5 * sin(uTime * .08)) * pool;
          alpha += pool * (.018 + uIntensity * .022) * uOpacity;
          gl_FragColor = vec4(colour, alpha);
        }
      `,
    });
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
      clearcoatRoughness: .08,
      iridescence: 1,
      iridescenceIOR: 1.38,
      iridescenceThicknessRange: [120, 620],
      sheen: 1,
      sheenRoughness: .22,
      sheenColor: new THREE.Color(options.sheen),
      blending: THREE.NormalBlending,
    });
    state.materials.push(material);
    return material;
  }

  function addSculpture(THREE, scene) {
    const geometry = tetrahedronGeometry(THREE);
    const upMaterial = physicalMaterial(THREE, {
      color: "#72cce7", emissive: "#0a3d56", emissiveIntensity: .42,
      metalness: .28, roughness: .13, opacity: .56, sheen: "#b7f6ff",
    });
    const downMaterial = physicalMaterial(THREE, {
      color: "#ed7ca2", emissive: "#57142f", emissiveIntensity: .38,
      metalness: .26, roughness: .14, opacity: .54, sheen: "#ffd0a3",
    });
    const innerUpMaterial = physicalMaterial(THREE, {
      color: "#67d5e6", emissive: "#093f57", emissiveIntensity: .7,
      metalness: .08, roughness: .12, opacity: .2, sheen: "#82fff0",
    });
    const innerDownMaterial = physicalMaterial(THREE, {
      color: "#ff6c9c", emissive: "#651630", emissiveIntensity: .62,
      metalness: .08, roughness: .12, opacity: .18, sheen: "#ffb66e",
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

    const innerUp = new THREE.Mesh(geometry, innerUpMaterial);
    innerUp.scale.setScalar(.46);
    innerUp.rotation.y = Math.PI / 3;
    const innerDown = new THREE.Mesh(geometry, innerDownMaterial);
    innerDown.scale.setScalar(.46);
    innerDown.rotation.z = Math.PI;
    innerDown.rotation.y = -Math.PI / 3;

    [
      { scale: .27, threshold: .36, offset: Math.PI / 5 },
      { scale: .69, threshold: .68, offset: -Math.PI / 7 },
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
      color: "#63dfff", transparent: true, opacity: .045, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    upAura.scale.setScalar(1.055);
    const downAura = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: "#ff5caa", transparent: true, opacity: .04, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    downAura.scale.setScalar(1.055);
    downAura.rotation.z = Math.PI;

    state.upPivot.add(up, innerUp, upAura);
    state.downPivot.add(down, innerDown, downAura);
    state.sculpture.add(state.upPivot, state.downPivot);
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
      state.camera.position.set(.62, .52, 5.9);

      state.scene.add(new THREE.HemisphereLight(0xddeeff, 0x261716, 1.05));
      const key = new THREE.DirectionalLight(0xffe7c4, 2.8);
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
      const cyan = new THREE.PointLight(0x37cfee, 20, 9, 2);
      cyan.position.set(-2.8, .4, 2.4);
      const rose = new THREE.PointLight(0xff4d94, 18, 9, 2);
      rose.position.set(2.7, -.15, 2.2);
      state.scene.add(cyan, rose);

      addSculpture(THREE, state.scene);

      state.seedMaterial = seedMaterial(THREE);
      const seed = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 3.05, 1, 1), state.seedMaterial);
      seed.rotation.x = -Math.PI / 2;
      seed.position.set(0, -1.46, .08);
      state.scene.add(seed);

      const receiver = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 4.2),
        new THREE.ShadowMaterial({ transparent: true, opacity: .12, color: 0x09060a })
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
    const pace = (.1 + intensity * .58) * motion;
    const breath = 1 + bass * (.008 + intensity * .012) + kick * intensity * .026 + Math.sin(time * .72) * .006;
    const separation = intensity * .018 + kick * intensity * .022;

    state.sculpture.scale.setScalar(breath);
    state.sculpture.rotation.x = .16 + Math.sin(time * .13) * .075;
    state.sculpture.rotation.z = Math.sin(time * .09) * .026;
    state.upPivot.position.y = separation;
    state.downPivot.position.y = -separation;
    state.upPivot.rotation.y = time * pace;
    state.downPivot.rotation.y = -time * pace * .92;
    state.nestedStars.forEach((star, index) => {
      star.up.visible = intensity >= star.threshold;
      star.down.visible = intensity >= star.threshold;
      if (!star.up.visible) return;
      const nestedPace = pace * (1.28 + index * .38);
      star.up.rotation.y = time * nestedPace + index * .72;
      star.down.rotation.y = -time * nestedPace * .9 - index * .64;
      const nestedPulse = 1 + kick * intensity * (.016 + index * .008);
      star.up.scale.setScalar((index === 0 ? .27 : .69) * nestedPulse);
      star.down.scale.setScalar((index === 0 ? .27 : .69) * nestedPulse);
    });
    state.camera.position.x = .58 + Math.sin(time * .11) * .68;
    state.camera.position.y = .5 + Math.sin(time * .085) * .13;
    state.camera.position.z = 5.88 + Math.cos(time * .07) * .14;
    state.camera.lookAt(0, .04, 0);

    state.materials.forEach((material, index) => {
      const inner = index > 1;
      material.emissiveIntensity = (inner ? .46 : .2) + intensity * (inner ? .82 : .68) + snare * (inner ? .22 : .16) + kick * .08;
      material.opacity = .9;
    });
    state.seedMaterial.uniforms.uTime.value = time;
    state.seedMaterial.uniforms.uBass.value = bass * .45;
    state.seedMaterial.uniforms.uTreble.value = snare * .45;
    state.seedMaterial.uniforms.uIntensity.value = intensity;
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
