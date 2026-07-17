(() => {
  const THREE_URL = "https://unpkg.com/three@0.165.0/build/three.module.js";
  const state = {
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,
    sculpture: null,
    solids: [],
    ready: false,
    loading: null,
    width: 0,
    height: 0,
  };

  function clamp(value, minimum = 0, maximum = 1) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function smoothstep(edge0, edge1, value) {
    const x = clamp((value - edge0) / Math.max(.0001, edge1 - edge0));
    return x * x * (3 - 2 * x);
  }

  function createCanvas() {
    if (state.canvas) return state.canvas;
    const anchor = document.querySelector("[data-emdr-canvas]");
    if (!anchor?.parentElement) return null;
    const canvas = document.createElement("canvas");
    canvas.className = "adaptive-television-emdr-platonics";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none;z-index:4;";
    anchor.insertAdjacentElement("afterend", canvas);
    state.canvas = canvas;
    return canvas;
  }

  async function init() {
    if (state.ready) return true;
    if (state.loading) return state.loading;
    state.loading = (async () => {
      const canvas = createCanvas();
      if (!canvas) return false;
      const THREE = await import(THREE_URL);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.32;
      state.renderer = renderer;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-2.65, 2.65, 2.65, -2.65, .1, 100);
      camera.position.set(.15, .08, 5.35);
      scene.add(new THREE.HemisphereLight(0xcffaff, 0x28102d, 2.1));
      const key = new THREE.DirectionalLight(0xfff0ca, 4.8);
      key.position.set(3.8, 4.2, 5.4);
      scene.add(key);
      const cyan = new THREE.PointLight(0x45e9ff, 18, 12);
      cyan.position.set(-3.2, .8, 3.1);
      scene.add(cyan);
      const pink = new THREE.PointLight(0xff4b9b, 15, 12);
      pink.position.set(3.1, -1.6, 2.8);
      scene.add(pink);
      state.scene = scene;
      state.camera = camera;

      const sculpture = new THREE.Group();
      sculpture.rotation.x = -.1;
      scene.add(sculpture);
      state.sculpture = sculpture;

      function addSolid(name, geometryEntries, colour) {
        const group = new THREE.Group();
        const materials = [];
        const lineMaterials = [];
        geometryEntries.forEach(({ geometry, rotation = [0, 0, 0] }) => {
          const material = new THREE.MeshPhysicalMaterial({
            color: colour,
            emissive: new THREE.Color(colour).multiplyScalar(.18),
            emissiveIntensity: .42,
            metalness: .08,
            roughness: .12,
            transparent: true,
            opacity: 0,
            side: THREE.FrontSide,
            depthWrite: true,
            flatShading: true,
            clearcoat: 1,
            clearcoatRoughness: .06,
            iridescence: 1,
            iridescenceIOR: 1.36,
            iridescenceThicknessRange: [140, 560],
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
          const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf8f4e8, transparent: true, opacity: 0, depthWrite: false });
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 18), lineMaterial);
          mesh.add(edges);
          group.add(mesh);
          materials.push(material);
          lineMaterials.push(lineMaterial);
        });
        group.visible = false;
        sculpture.add(group);
        state.solids.push({ name, group, materials, lineMaterials });
      }

      addSolid("tetrahedron", [{ geometry: new THREE.TetrahedronGeometry(1.34, 0) }], 0xffd57c);
      addSolid("cube", [{ geometry: new THREE.BoxGeometry(1.72, 1.72, 1.72) }], 0x56d9ed);
      addSolid("octahedron", [{ geometry: new THREE.OctahedronGeometry(1.38, 0) }], 0xff6f9f);
      addSolid("dodecahedron", [{ geometry: new THREE.DodecahedronGeometry(1.28, 0) }], 0x9a8cff);
      addSolid("icosahedron", [{ geometry: new THREE.IcosahedronGeometry(1.31, 0) }], 0xf5e68a);
      const tetra = new THREE.TetrahedronGeometry(1.38, 0);
      addSolid("stellated octahedron", [
        { geometry: tetra, rotation: [0, 0, 0] },
        { geometry: tetra.clone(), rotation: [0, 0, Math.PI] },
      ], 0x7cecff);

      state.ready = true;
      return true;
    })().catch(() => false);
    return state.loading;
  }

  function resize() {
    if (!state.canvas || !state.renderer || !state.camera) return;
    const width = Math.max(1, Math.round(state.canvas.clientWidth || state.canvas.parentElement?.clientWidth || 1));
    const height = Math.max(1, Math.round(state.canvas.clientHeight || state.canvas.parentElement?.clientHeight || 1));
    if (width === state.width && height === state.height) return;
    state.width = width;
    state.height = height;
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.setSize(width, height, false);
    const viewHeight = 5.3;
    const viewWidth = viewHeight * width / height;
    state.camera.left = -viewWidth / 2;
    state.camera.right = viewWidth / 2;
    state.camera.top = viewHeight / 2;
    state.camera.bottom = -viewHeight / 2;
    state.camera.updateProjectionMatrix();
  }

  function render(now) {
    const runtime = window.IAMEMDR;
    const active = Boolean(runtime?.active) && Math.round(Number(runtime?.style) || 0) === 6;
    if (active && !state.ready) init();
    if (state.canvas) state.canvas.style.display = active ? "block" : "none";

    if (active && state.ready) {
      resize();
      const seconds = now * .001;
      const intensity = clamp(runtime?.intensity);
      const sequenceSpeed = .105 + intensity * .34;
      const phase = (seconds * sequenceSpeed) % state.solids.length;
      const current = Math.floor(phase);
      const fraction = phase - current;
      const transition = smoothstep(.56, .96, fraction);
      const currentWeight = Math.cos(transition * Math.PI * .5);
      const nextWeight = Math.sin(transition * Math.PI * .5);
      const next = (current + 1) % state.solids.length;

      state.solids.forEach((solid, index) => {
        const weight = index === current ? currentWeight : index === next ? nextWeight : 0;
        solid.group.visible = weight > .008;
        solid.materials.forEach((material) => {
          material.opacity = weight * .777;
          material.emissiveIntensity = .32 + intensity * .72;
        });
        solid.lineMaterials.forEach((material) => { material.opacity = weight * .777; });
        solid.group.rotation.x = seconds * (.11 + intensity * .42) + index * .31;
        solid.group.rotation.y = -seconds * (.16 + intensity * .58) - index * .27;
        solid.group.rotation.z = Math.sin(seconds * (.13 + intensity * .24) + index) * (.08 + intensity * .22);
        const pulse = 1 + Math.sin(seconds * (1.1 + intensity * 3.5) + index) * intensity * .035;
        solid.group.scale.setScalar((.92 + weight * .08) * pulse * .778);
      });

      state.sculpture.rotation.y = Math.sin(seconds * .09) * .22;
      state.camera.position.x = Math.sin(seconds * .12) * (.18 + intensity * .28);
      state.camera.position.y = .08 + Math.cos(seconds * .1) * (.08 + intensity * .1);
      state.camera.lookAt(0, 0, 0);
      state.renderer.render(state.scene, state.camera);
    }
    window.requestAnimationFrame(render);
  }

  window.IAMPlatonics = { init };
  window.requestAnimationFrame(render);
})();
