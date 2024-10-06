"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import exoplanetsData from './exoplanets.json';

const App: React.FC = () => {
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const zoomDuration = 1;

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current?.clientWidth! / mountRef.current?.clientHeight!,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      mountRef.current?.clientWidth!,
      mountRef.current?.clientHeight!
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 100;

    const starGeometry = new THREE.SphereGeometry(0.2, 24, 24);
    exoplanetsData.forEach((planet: any, index: number) => {
      const color = new THREE.Color(planet.color);
      const starMaterial = new THREE.MeshBasicMaterial({ color });
      const star = new THREE.Mesh(starGeometry, starMaterial);

      const distanceScale = 2;
      const xPos = (index - (exoplanetsData.length / 2)) * distanceScale;
      const yPos = Math.sin(index) * 5;
      const zPos = -parseFloat(planet.distance.replace(' light years', '')) * 0.2;

      star.position.set(xPos, yPos, zPos);
      star.userData = planet;

      const glowMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
      const glowSphere = new THREE.Mesh(starGeometry, glowMaterial);
      glowSphere.scale.set(1.5, 1.5, 1.5);
      star.add(glowSphere);

      scene.add(star);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, false);

      if (intersects.length > 0) {
        const clickedStar = intersects[0].object;
        const planetData = clickedStar.userData;
        setSelectedPlanet(planetData);
        zoomToStar(clickedStar.position);
      }
    };

    const zoomToStar = (position: THREE.Vector3) => {
      const originalPosition = camera.position.clone();
      const targetPosition = new THREE.Vector3(position.x, position.y, position.z + 1);
      const startTime = performance.now();

      const animateZoom = (time: number) => {
        const elapsed = (time - startTime) / (zoomDuration * 1000);
        const progress = Math.min(elapsed, 1);
        camera.position.lerpVectors(originalPosition, targetPosition, progress);
        camera.lookAt(position);

        if (progress < 1) {
          requestAnimationFrame(animateZoom);
        }
      };

      requestAnimationFrame(animateZoom);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
    <section
      className='background-style'
      style={{ position: "absolute", width: '100vw', height: "100vh" }}
    ></section>
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    <div className="info-panel">
      <h1>
        Exoplanet Visualizer
      </h1>
      {selectedPlanet ? (
        <div>
          <h2>
            {selectedPlanet.name}
          </h2>
          <p>{selectedPlanet.description}</p>
          <p>
            <strong>Size:</strong> {selectedPlanet.size}
          </p>
          <p>
            <strong>Distance from Earth:</strong> {selectedPlanet.distance}
          </p>
          <img
            src={selectedPlanet.imagePath}
            alt={selectedPlanet.name}
            className="planet-image"
            height={200}
            width={20}
          />
        </div>
      ) : (
        <p>Click on a star to see details about the exoplanet.</p>
      )}
    </div>
  </div>
  );
};

export default App;
