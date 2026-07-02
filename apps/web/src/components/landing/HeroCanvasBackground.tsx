import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function HeroCanvasBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let points: THREE.Points;
    let animationFrameId: number;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 600 : 1200;

    try {
      // 1. Configurar Cena e Câmera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 200;

      // 2. Configurar Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      // 3. Criar Geometria e Partículas
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i++) {
        // Distribuir num volume 3D aleatório
        positions[i] = (Math.random() - 0.5) * 600;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0x888888, // Cinza/Neutro
        size: 1.5,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      // 4. Animação
      const animate = () => {
        if (!prefersReducedMotion) {
          points.rotation.y += 0.0015;
          points.rotation.x += 0.0006;
        }
        renderer.render(scene, camera);
        if (!prefersReducedMotion) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      // Iniciar Render Loop
      if (prefersReducedMotion) {
        renderer.render(scene, camera); // Renderizar frame estático único
      } else {
        animate();
      }

      // 5. Tratamento de Resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // 6. Cleanup Rigoroso
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        if (mountRef.current && renderer) {
          mountRef.current.removeChild(renderer.domElement);
        }
        
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };

    } catch (e) {
      console.warn("WebGL não suportado ou erro na inicialização do Three.js", e);
      setWebGLSupported(false);
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-0" aria-hidden="true">
      {/* Container do Canvas (Renderizado via Three.js se suportado) */}
      {webGLSupported && (
        <div ref={mountRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen" />
      )}

      {/* 
        Overly Radial Gradient (Vinheta)
        Centro opaco combinando com o background (10,10,12) da V1, bordas transparentes 
      */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(58% 46% at 50% 42%, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.65) 45%, rgba(10,10,12,0) 78%)'
        }}
      />
    </div>
  );
}
