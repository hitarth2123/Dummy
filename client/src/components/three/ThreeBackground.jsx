import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparent canvas background
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x818cf8, 1.8);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x38bdf8, 4.5, 60);
    pointLight1.position.set(12, 12, 12);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xc084fc, 4.0, 60);
    pointLight2.position.set(-12, -12, 12);
    scene.add(pointLight2);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Rotating Neural Brain Core
    const coreGeo = new THREE.IcosahedronGeometry(2.8, 3);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x818cf8,
      emissive: 0x312e81,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const centralCore = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(centralCore);

    const innerGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: false,
      transparent: true,
      opacity: 0.45
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerSphere);

    // 2. Orbital Rings
    function createRing(radius, tubeRadius, color, rotX, rotY) {
      const ringGeo = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, wireframe: true });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = rotX;
      ring.rotation.y = rotY;
      return ring;
    }
    const ring1 = createRing(5.0, 0.05, 0x818cf8, Math.PI / 3, 0.2);
    const ring2 = createRing(7.0, 0.04, 0x38bdf8, -Math.PI / 4, 0.4);
    const ring3 = createRing(9.2, 0.03, 0xc084fc, Math.PI / 6, -0.3);
    coreGroup.add(ring1, ring2, ring3);

    // 3. Orbiting Neural Nodes
    const nodeGroup = new THREE.Group();
    coreGroup.add(nodeGroup);
    const topics = [
      { name: 'AI', radius: 5.0, angle: 0, color: 0x38bdf8, size: 0.55 },
      { name: 'DBMS', radius: 5.0, angle: (Math.PI * 2) / 3, color: 0x818cf8, size: 0.5 },
      { name: 'RAG', radius: 5.0, angle: (Math.PI * 4) / 3, color: 0x67e8f9, size: 0.45 },
      { name: 'ML', radius: 7.0, angle: Math.PI / 4, color: 0xa855f7, size: 0.6 },
      { name: 'OS', radius: 7.0, angle: Math.PI, color: 0xc084fc, size: 0.5 },
      { name: 'Cloud', radius: 7.0, angle: (Math.PI * 7) / 4, color: 0x3b82f6, size: 0.45 },
      { name: 'Embed', radius: 9.2, angle: Math.PI / 2, color: 0x22d3ee, size: 0.45 },
      { name: 'Exam', radius: 9.2, angle: (Math.PI * 3) / 2, color: 0xf43f5e, size: 0.52 },
    ];
    const nodes = [];
    topics.forEach((t) => {
      const g = new THREE.DodecahedronGeometry(t.size, 0);
      const m = new THREE.MeshPhongMaterial({ color: t.color, emissive: t.color, emissiveIntensity: 0.5, shininess: 100 });
      const mesh = new THREE.Mesh(g, m);
      mesh.userData = t;
      nodeGroup.add(mesh);
      nodes.push(mesh);
    });

    // 4. Connecting Laser Synapses
    const linesGroup = new THREE.Group();
    coreGroup.add(linesGroup);
    nodes.forEach(() => {
      const lm = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.45 });
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
      linesGroup.add(new THREE.Line(lg, lm));
    });

    // 5. Floating Glowing Particle Field
    const particlesCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(particlesCount * 3);
    const col = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 45;
      pos[i + 1] = (Math.random() - 0.5) * 45;
      pos[i + 2] = (Math.random() - 0.5) * 45;
      col[i] = 0.4 + Math.random() * 0.5;
      col[i + 1] = 0.6 + Math.random() * 0.4;
      col[i + 2] = 1.0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Mouse Interaction
    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      coreGroup.rotation.y = t * 0.2 + targetX * 0.8;
      coreGroup.rotation.x = Math.sin(t * 0.15) * 0.2 - targetY * 0.5;
      
      const s = 1 + Math.sin(t * 2.5) * 0.08;
      centralCore.scale.set(s, s, s);
      innerSphere.scale.set(1 / s, 1 / s, 1 / s);

      ring1.rotation.z = t * 0.3;
      ring2.rotation.z = -t * 0.22;
      ring3.rotation.z = t * 0.15;

      nodes.forEach((n, i) => {
        const d = n.userData;
        const a = d.angle + t * (0.4 / (d.radius * 0.3));
        const x = Math.cos(a) * d.radius;
        const y = Math.sin(a * 1.4) * (d.radius * 0.35);
        const z = Math.sin(a) * d.radius;
        n.position.set(x, y, z);
        n.rotation.x += 0.02;
        n.rotation.y += 0.03;

        const line = linesGroup.children[i];
        if (line) {
          const p = line.geometry.attributes.position.array;
          p[3] = x; p[4] = y; p[5] = z;
          line.geometry.attributes.position.needsUpdate = true;
        }
      });

      particles.rotation.y = t * 0.05;
      particles.rotation.x = Math.sin(t * 0.04) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      coreGeo.dispose(); coreMat.dispose(); innerGeo.dispose(); innerMat.dispose(); pGeo.dispose(); pMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default ThreeBackground;
