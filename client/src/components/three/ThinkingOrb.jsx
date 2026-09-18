import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A tiny pulsating 3D "thinking" indicator (~60×60) with orbiting electron
 * particles and color-cycling emissive glow. Used while the AI tutor streams.
 */
const ThinkingOrb = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const SIZE = 60;

    /* ── Renderer ─────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ───────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 5);

    /* ── Lights ───────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x818cf8, 1.5));
    const pl = new THREE.PointLight(0x38bdf8, 3, 15);
    pl.position.set(2, 2, 4);
    scene.add(pl);

    /* ── Central pulsating sphere ─────────────────────────── */
    const coreGeo = new THREE.SphereGeometry(0.6, 24, 24);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8,
      emissive: 0x312e81,
      emissiveIntensity: 0.8,
      shininess: 150,
      transparent: true,
      opacity: 0.85,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    /* ── Outer glow ───────────────────────────────────────── */
    const glowGeo = new THREE.SphereGeometry(1.0, 20, 20);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    /* ── Electron orbit rings ─────────────────────────────── */
    const RING_COUNT = 3;
    const electronRings = [];
    const electronColors = [0x38bdf8, 0xa5b4fc, 0x22d3ee];
    const ringRotations = [
      { x: 0, y: 0 },
      { x: Math.PI / 3, y: Math.PI / 4 },
      { x: -Math.PI / 4, y: Math.PI / 3 },
    ];

    for (let r = 0; r < RING_COUNT; r++) {
      // Orbit path (thin torus)
      const orbitGeo = new THREE.TorusGeometry(1.3, 0.008, 8, 64);
      const orbitMat = new THREE.MeshBasicMaterial({
        color: electronColors[r],
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const orbit = new THREE.Mesh(orbitGeo, orbitMat);
      orbit.rotation.x = ringRotations[r].x;
      orbit.rotation.y = ringRotations[r].y;
      scene.add(orbit);

      // Electron particle on ring
      const elGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const elMat = new THREE.MeshBasicMaterial({
        color: electronColors[r],
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const electron = new THREE.Mesh(elGeo, elMat);
      scene.add(electron);

      electronRings.push({
        orbit, orbitGeo, orbitMat,
        electron, elGeo, elMat,
        speed: 2.5 + r * 0.8,
        rotX: ringRotations[r].x,
        rotY: ringRotations[r].y,
      });
    }

    /* ── Animation ────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Core breathing
      const breathe = 1 + Math.sin(t * 3) * 0.12;
      core.scale.set(breathe, breathe, breathe);

      // Color cycling: cyan → indigo → cyan
      const hue = 0.55 + Math.sin(t * 1.5) * 0.1;
      coreMat.color.setHSL(hue, 0.8, 0.6);
      coreMat.emissive.setHSL(hue - 0.1, 0.7, 0.2);

      // Glow pulse
      const glowScale = 1 + Math.sin(t * 4) * 0.15;
      glow.scale.set(glowScale, glowScale, glowScale);
      glowMat.opacity = 0.08 + Math.sin(t * 2) * 0.06;
      glowMat.color.setHSL(hue, 0.6, 0.6);

      // Electron orbits
      electronRings.forEach((ring) => {
        const angle = t * ring.speed;
        // Position on the ring plane
        const x = Math.cos(angle) * 1.3;
        const y = Math.sin(angle) * 1.3;

        // Apply ring rotation to electron position
        const pos = new THREE.Vector3(x, y, 0);
        const euler = new THREE.Euler(ring.rotX, ring.rotY, 0);
        pos.applyEuler(euler);
        ring.electron.position.copy(pos);

        // Subtle orbit wobble
        ring.orbit.rotation.z = Math.sin(t * 0.5 + ring.speed) * 0.05;
      });

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ──────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frameId);
      coreGeo.dispose(); coreMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      electronRings.forEach((ring) => {
        ring.orbitGeo.dispose(); ring.orbitMat.dispose();
        ring.elGeo.dispose(); ring.elMat.dispose();
      });
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="inline-flex items-center justify-center"
      style={{ width: 60, height: 60 }}
    />
  );
};

export default ThinkingOrb;
