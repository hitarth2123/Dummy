import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A small 3D sphere (~150×150) that visualizes progress as a "filling" effect.
 * The torus knot wireframe shell fills with a glowing inner sphere based on progress.
 * Emits a particle burst at 100%.
 *
 * @param {{ progress: number }} props — 0 to 100
 */
const ProgressOrb = ({ progress = 0 }) => {
  const mountRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const SIZE = 150;

    /* ── Renderer ─────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ───────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0, 5);

    /* ── Lights ───────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x818cf8, 1.0));
    const pl = new THREE.PointLight(0x38bdf8, 3, 20);
    pl.position.set(3, 3, 5);
    scene.add(pl);

    /* ── Wireframe torus knot shell ──────────────────────── */
    const shellGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 100, 16);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    /* ── Progress fill sphere ─────────────────────────────── */
    const fillGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const fillMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8,
      emissive: 0x312e81,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.6,
      shininess: 100,
    });
    const fillSphere = new THREE.Mesh(fillGeo, fillMat);
    scene.add(fillSphere);

    /* ── Outer glow ───────────────────────────────────────── */
    const glowGeo = new THREE.SphereGeometry(1.6, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    /* ── Completion burst particles ──────────────────────── */
    const BURST_COUNT = 60;
    const burstGeo = new THREE.BufferGeometry();
    const burstPos = new Float32Array(BURST_COUNT * 3);
    const burstVel = new Float32Array(BURST_COUNT * 3);
    const burstCol = new Float32Array(BURST_COUNT * 3);
    for (let i = 0; i < BURST_COUNT; i++) {
      burstPos[i * 3] = 0;
      burstPos[i * 3 + 1] = 0;
      burstPos[i * 3 + 2] = 0;
      // Random outward velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = 0.02 + Math.random() * 0.04;
      burstVel[i * 3]     = Math.sin(phi) * Math.cos(theta) * spd;
      burstVel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * spd;
      burstVel[i * 3 + 2] = Math.cos(phi) * spd;
      // Golden-cyan color
      const c = new THREE.Color().setHSL(0.15 + Math.random() * 0.15, 1, 0.7);
      burstCol[i * 3]     = c.r;
      burstCol[i * 3 + 1] = c.g;
      burstCol[i * 3 + 2] = c.b;
    }
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
    burstGeo.setAttribute('color', new THREE.BufferAttribute(burstCol, 3));
    const burstMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const burst = new THREE.Points(burstGeo, burstMat);
    scene.add(burst);

    let burstActive = false;
    let burstTime = 0;

    /* ── Animation ────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let frameId;
    let prevComplete = false;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const p = Math.max(0, Math.min(100, progressRef.current)) / 100;

      // Shell rotation
      shell.rotation.x = t * 0.3;
      shell.rotation.y = t * 0.5;

      // Progress fill — scale the sphere based on progress
      const fillScale = 0.2 + p * 0.8;
      fillSphere.scale.set(fillScale, fillScale, fillScale);

      // Color transitions: cyan → green → gold as progress increases
      const hue = 0.55 - p * 0.4; // 0.55 (cyan) → 0.15 (gold)
      fillMat.color.setHSL(hue, 0.8, 0.55);
      fillMat.emissive.setHSL(hue, 0.6, 0.15);
      fillMat.opacity = 0.4 + p * 0.4;

      // Shell opacity increases with progress
      shellMat.opacity = 0.2 + p * 0.3;
      shellMat.color.setHSL(hue, 0.7, 0.7);

      // Glow pulses
      const glowPulse = 1 + Math.sin(t * 2) * 0.1;
      glow.scale.set(glowPulse, glowPulse, glowPulse);
      glowMat.opacity = 0.05 + p * 0.1;

      // Trigger burst at 100%
      const isComplete = p >= 1;
      if (isComplete && !prevComplete) {
        burstActive = true;
        burstTime = t;
        // Reset burst positions
        const posArr = burstGeo.attributes.position.array;
        for (let i = 0; i < BURST_COUNT * 3; i++) posArr[i] = 0;
        burstGeo.attributes.position.needsUpdate = true;
      }
      prevComplete = isComplete;

      // Animate burst
      if (burstActive) {
        const elapsed = t - burstTime;
        if (elapsed > 2) {
          burstActive = false;
          burstMat.opacity = 0;
        } else {
          burstMat.opacity = Math.max(0, 1 - elapsed / 2);
          const posArr = burstGeo.attributes.position.array;
          for (let i = 0; i < BURST_COUNT; i++) {
            posArr[i * 3]     += burstVel[i * 3];
            posArr[i * 3 + 1] += burstVel[i * 3 + 1];
            posArr[i * 3 + 2] += burstVel[i * 3 + 2];
          }
          burstGeo.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ──────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frameId);
      shellGeo.dispose(); shellMat.dispose();
      fillGeo.dispose(); fillMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      burstGeo.dispose(); burstMat.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: 150, height: 150 }}
      title={`Progress: ${Math.round(progress)}%`}
    />
  );
};

export default ProgressOrb;
