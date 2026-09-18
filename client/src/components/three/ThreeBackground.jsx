import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Cosmic Aurora / Nebula background rendered with raw Three.js.
 *
 * @param {{ variant?: 'dashboard' | 'login' }} props
 *   - 'dashboard' (default): subtler, faster-rotating scene
 *   - 'login': more dramatic, slower, brighter nebula for the auth page
 */
const ThreeBackground = ({ variant = 'dashboard' }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    /* ── Renderer ─────────────────────────────────────────── */
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ───────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 30);

    /* ── Palette ──────────────────────────────────────────── */
    const isLogin = variant === 'login';
    const palette = {
      indigo:  new THREE.Color(0x818cf8),
      cyan:    new THREE.Color(0x38bdf8),
      violet:  new THREE.Color(0xc084fc),
      rose:    new THREE.Color(0xf472b6),
      deep:    new THREE.Color(0x312e81),
      teal:    new THREE.Color(0x22d3ee),
    };

    /* ── Lights ───────────────────────────────────────────── */
    const ambient = new THREE.AmbientLight(0x818cf8, isLogin ? 0.6 : 0.4);
    scene.add(ambient);
    const pl1 = new THREE.PointLight(0x38bdf8, isLogin ? 3.5 : 2.5, 80);
    pl1.position.set(20, 15, 20);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0xc084fc, isLogin ? 3.0 : 2.0, 80);
    pl2.position.set(-20, -15, 20);
    scene.add(pl2);

    /* ── 1. Deep-space particle field ─────────────────────── */
    const PARTICLE_COUNT = isLogin ? 4000 : 3000;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pColors = new Float32Array(PARTICLE_COUNT * 3);
    const pSizes = new Float32Array(PARTICLE_COUNT);
    const pSpeeds = new Float32Array(PARTICLE_COUNT); // individual twinkle speeds

    const colorChoices = [palette.indigo, palette.cyan, palette.violet, palette.teal];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const spread = isLogin ? 70 : 55;
      pPositions[i3]     = (Math.random() - 0.5) * spread;
      pPositions[i3 + 1] = (Math.random() - 0.5) * spread;
      pPositions[i3 + 2] = (Math.random() - 0.5) * spread;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      pColors[i3]     = c.r;
      pColors[i3 + 1] = c.g;
      pColors[i3 + 2] = c.b;

      pSizes[i] = 0.08 + Math.random() * 0.25;
      pSpeeds[i] = 0.5 + Math.random() * 2.0;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

    const pMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ── 2. Flowing aurora ribbons ────────────────────────── */
    const auroraGroup = new THREE.Group();
    scene.add(auroraGroup);

    const AURORA_COUNT = isLogin ? 5 : 3;
    const auroras = [];

    for (let a = 0; a < AURORA_COUNT; a++) {
      const points = [];
      const SEGMENTS = 120;
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = (i / SEGMENTS) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(t) * (12 + a * 3),
          Math.sin(t * 2) * (3 + a * 1.5),
          Math.sin(t * 1.5) * (8 + a * 2)
        ));
      }

      const curve = new THREE.CatmullRomCurve3(points, true);
      const tubeGeo = new THREE.TubeGeometry(curve, 200, 0.08 + a * 0.03, 8, true);

      const auroraColors = [
        [palette.indigo, palette.cyan],
        [palette.violet, palette.teal],
        [palette.cyan, palette.rose],
        [palette.teal, palette.indigo],
        [palette.rose, palette.violet],
      ];
      const [colA, colB] = auroraColors[a % auroraColors.length];

      // Apply gradient vertex colors
      const vertCount = tubeGeo.attributes.position.count;
      const colArr = new Float32Array(vertCount * 3);
      for (let i = 0; i < vertCount; i++) {
        const mix = (Math.sin((i / vertCount) * Math.PI * 4) + 1) * 0.5;
        const mixed = colA.clone().lerp(colB, mix);
        colArr[i * 3]     = mixed.r;
        colArr[i * 3 + 1] = mixed.g;
        colArr[i * 3 + 2] = mixed.b;
      }
      tubeGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

      const tubeMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: isLogin ? 0.5 : 0.35,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * 0.3
      );
      auroraGroup.add(tube);
      auroras.push({ mesh: tube, geo: tubeGeo, speed: 0.03 + Math.random() * 0.04, axis: a % 2 === 0 ? 'y' : 'x' });
    }

    /* ── 3. Orbital light rings ──────────────────────────── */
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const ringConfigs = [
      { radius: 14, tube: 0.04, color: palette.indigo, rotX: Math.PI / 3,  rotY: 0.2,  speed: 0.15 },
      { radius: 18, tube: 0.03, color: palette.cyan,   rotX: -Math.PI / 4, rotY: 0.5,  speed: -0.12 },
      { radius: 22, tube: 0.025, color: palette.violet, rotX: Math.PI / 6,  rotY: -0.3, speed: 0.08 },
      { radius: 10, tube: 0.05, color: palette.teal,   rotX: Math.PI / 2,  rotY: 0.1,  speed: -0.2 },
    ];

    const rings = ringConfigs.map((cfg) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 150);
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: isLogin ? 0.45 : 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = cfg.rotX;
      mesh.rotation.y = cfg.rotY;
      ringGroup.add(mesh);
      return { mesh, geo, mat, speed: cfg.speed };
    });

    /* ── 4. Nebula fog volumes ────────────────────────────── */
    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);

    const nebulaConfigs = [
      { pos: [8, 5, -15],  radius: 8,  color: palette.indigo, baseOpacity: 0.06 },
      { pos: [-12, -8, -20], radius: 12, color: palette.violet, baseOpacity: 0.05 },
      { pos: [0, 10, -25],  radius: 15, color: palette.cyan,   baseOpacity: 0.04 },
      { pos: [-5, -5, -10], radius: 6,  color: palette.rose,   baseOpacity: 0.03 },
    ];

    const nebulae = nebulaConfigs.map((cfg) => {
      const geo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: isLogin ? cfg.baseOpacity * 2 : cfg.baseOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...cfg.pos);
      nebulaGroup.add(mesh);
      return { mesh, geo, mat, baseOpacity: cfg.baseOpacity };
    });

    /* ── 5. Central subtle glow core ─────────────────────── */
    const glowGeo = new THREE.SphereGeometry(3, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: palette.indigo,
      transparent: true,
      opacity: isLogin ? 0.12 : 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowSphere);

    /* ── Mouse interaction ────────────────────────────────── */
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    /* ── Resize handler ───────────────────────────────────── */
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    /* ── Animation loop ───────────────────────────────────── */
    const clock = new THREE.Clock();
    let frameId;
    const speedMul = isLogin ? 0.6 : 1.0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth mouse tracking
      targetX += (mouseX - targetX) * 0.03;
      targetY += (mouseY - targetY) * 0.03;

      // Particle field rotation + twinkle
      particles.rotation.y = t * 0.02 * speedMul + targetX * 0.15;
      particles.rotation.x = Math.sin(t * 0.01) * 0.1 - targetY * 0.1;

      // Animate particle colors (slow cycling)
      const colAttr = pGeo.attributes.color;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const phase = t * pSpeeds[i] * 0.3;
        const twinkle = (Math.sin(phase) + 1) * 0.5;
        colAttr.array[i3]     *= 0.998; // subtle fade
        colAttr.array[i3]     += twinkle * 0.002;
        // keep g and b channels stable for color identity
      }
      colAttr.needsUpdate = true;

      // Aurora ribbon rotation
      auroras.forEach((a) => {
        if (a.axis === 'y') {
          a.mesh.rotation.y += a.speed * 0.01 * speedMul;
        } else {
          a.mesh.rotation.x += a.speed * 0.01 * speedMul;
        }
        a.mesh.rotation.z = Math.sin(t * a.speed) * 0.1;
      });

      // Orbital rings
      rings.forEach((r) => {
        r.mesh.rotation.z += r.speed * 0.005 * speedMul;
        r.mat.opacity = (isLogin ? 0.45 : 0.3) + Math.sin(t * 0.5 + r.speed) * 0.08;
      });

      // Nebula breathing
      nebulae.forEach((n, i) => {
        const breathe = Math.sin(t * 0.3 + i * 1.5) * 0.5 + 0.5;
        n.mat.opacity = (isLogin ? n.baseOpacity * 2 : n.baseOpacity) * (0.6 + breathe * 0.4);
        const s = 1 + Math.sin(t * 0.2 + i) * 0.08;
        n.mesh.scale.set(s, s, s);
      });

      // Central glow pulse
      const glowPulse = 1 + Math.sin(t * 1.5) * 0.15;
      glowSphere.scale.set(glowPulse, glowPulse, glowPulse);
      glowMat.opacity = (isLogin ? 0.12 : 0.07) + Math.sin(t * 2) * 0.03;

      // Camera parallax
      camera.position.x = targetX * 2;
      camera.position.y = targetY * 1.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ──────────────────────────────────────────── */
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);

      // Dispose particles
      pGeo.dispose();
      pMat.dispose();

      // Dispose auroras
      auroras.forEach((a) => {
        a.geo.dispose();
        a.mesh.material.dispose();
      });

      // Dispose rings
      rings.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      });

      // Dispose nebulae
      nebulae.forEach((n) => {
        n.geo.dispose();
        n.mat.dispose();
      });

      // Dispose glow
      glowGeo.dispose();
      glowMat.dispose();

      // Remove canvas
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default ThreeBackground;
