import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A small, self-contained 3D canvas (~300×300) that renders a floating
 * glowing AI core with orbiting subject-themed shapes and particle trails.
 * Designed to sit inside the dashboard welcome banner.
 */
const FloatingAICore = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const SIZE = 300;

    /* ── Renderer ─────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ───────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    /* ── Lights ───────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x818cf8, 1.2));
    const pl = new THREE.PointLight(0x38bdf8, 4, 30);
    pl.position.set(5, 5, 8);
    scene.add(pl);
    const pl2 = new THREE.PointLight(0xc084fc, 3, 30);
    pl2.position.set(-5, -3, 6);
    scene.add(pl2);

    /* ── Central dodecahedron core ─────────────────────────── */
    const coreGeo = new THREE.DodecahedronGeometry(1.5, 0);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0xa5b4fc,
      emissive: 0x312e81,
      emissiveIntensity: 0.8,
      shininess: 150,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Wireframe shell around core
    const shellGeo = new THREE.DodecahedronGeometry(1.75, 0);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    // Inner glow sphere
    const innerGlowGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    scene.add(innerGlow);

    /* ── Orbiting subject shapes ──────────────────────────── */
    const subjectData = [
      { color: 0x38bdf8, shape: 'octahedron', orbit: 3.0, speed: 1.2, size: 0.3 },
      { color: 0xc084fc, shape: 'tetrahedron', orbit: 3.0, speed: 0.9, size: 0.28 },
      { color: 0x22d3ee, shape: 'icosahedron', orbit: 3.0, speed: 1.5, size: 0.25 },
      { color: 0xf472b6, shape: 'octahedron', orbit: 3.5, speed: 0.7, size: 0.22 },
      { color: 0xa5b4fc, shape: 'tetrahedron', orbit: 3.5, speed: 1.1, size: 0.26 },
      { color: 0x67e8f9, shape: 'dodecahedron', orbit: 2.5, speed: 1.4, size: 0.2 },
    ];

    const orbiters = subjectData.map((d, i) => {
      let geo;
      switch (d.shape) {
        case 'tetrahedron': geo = new THREE.TetrahedronGeometry(d.size, 0); break;
        case 'icosahedron': geo = new THREE.IcosahedronGeometry(d.size, 0); break;
        case 'dodecahedron': geo = new THREE.DodecahedronGeometry(d.size, 0); break;
        default: geo = new THREE.OctahedronGeometry(d.size, 0);
      }
      const mat = new THREE.MeshPhongMaterial({
        color: d.color,
        emissive: d.color,
        emissiveIntensity: 0.5,
        shininess: 120,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { ...d, phase: (i / subjectData.length) * Math.PI * 2 };
      scene.add(mesh);
      return { mesh, geo, mat, data: d, phase: mesh.userData.phase };
    });

    /* ── Connection lines from core to orbiters ──────────── */
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const lines = orbiters.map(() => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      return { line, geo: lineGeo };
    });

    /* ── Particle trail ring ──────────────────────────────── */
    const TRAIL_COUNT = 200;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(TRAIL_COUNT * 3);
    const trailCol = new Float32Array(TRAIL_COUNT * 3);
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const angle = (i / TRAIL_COUNT) * Math.PI * 2;
      const r = 2.8 + Math.random() * 1.2;
      trailPos[i * 3]     = Math.cos(angle) * r;
      trailPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      trailPos[i * 3 + 2] = Math.sin(angle) * r;

      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6);
      trailCol[i * 3]     = c.r;
      trailCol[i * 3 + 1] = c.g;
      trailCol[i * 3 + 2] = c.b;
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
    const trailMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const trailParticles = new THREE.Points(trailGeo, trailMat);
    scene.add(trailParticles);

    /* ── Hover interaction ────────────────────────────────── */
    let isHovered = false;
    const onEnter = () => { isHovered = true; };
    const onLeave = () => { isHovered = false; };
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);

    /* ── Animation ────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let frameId;
    let hoverScale = 1;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Hover scale interpolation
      const targetScale = isHovered ? 1.12 : 1.0;
      hoverScale += (targetScale - hoverScale) * 0.06;

      // Core rotation & pulse
      core.rotation.x = t * 0.4;
      core.rotation.y = t * 0.6;
      const pulse = 1 + Math.sin(t * 2.5) * 0.06;
      core.scale.set(pulse * hoverScale, pulse * hoverScale, pulse * hoverScale);

      // Shell counter-rotation
      shell.rotation.x = -t * 0.3;
      shell.rotation.y = -t * 0.5;
      shell.scale.set(hoverScale, hoverScale, hoverScale);

      // Inner glow breathe
      const glowPulse = 1 + Math.sin(t * 3) * 0.15;
      innerGlow.scale.set(glowPulse, glowPulse, glowPulse);
      innerGlowMat.opacity = 0.15 + Math.sin(t * 2) * 0.08;

      // Orbiting shapes
      orbiters.forEach((o, i) => {
        const angle = o.phase + t * o.data.speed * 0.5;
        const orbitR = o.data.orbit * hoverScale;
        o.mesh.position.set(
          Math.cos(angle) * orbitR,
          Math.sin(angle * 1.3) * (orbitR * 0.3),
          Math.sin(angle) * orbitR,
        );
        o.mesh.rotation.x += 0.025;
        o.mesh.rotation.y += 0.035;

        // Update connection line
        const linePos = lines[i].geo.attributes.position.array;
        linePos[3] = o.mesh.position.x;
        linePos[4] = o.mesh.position.y;
        linePos[5] = o.mesh.position.z;
        lines[i].geo.attributes.position.needsUpdate = true;
      });

      // Trail particle ring rotation
      trailParticles.rotation.y = t * 0.15;
      trailParticles.rotation.x = Math.sin(t * 0.2) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ──────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);

      coreGeo.dispose(); coreMat.dispose();
      shellGeo.dispose(); shellMat.dispose();
      innerGlowGeo.dispose(); innerGlowMat.dispose();
      trailGeo.dispose(); trailMat.dispose();
      lineMat.dispose();

      orbiters.forEach((o) => { o.geo.dispose(); o.mat.dispose(); });
      lines.forEach((l) => { l.geo.dispose(); });

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-auto"
      style={{ width: 300, height: 300 }}
    />
  );
};

export default FloatingAICore;
