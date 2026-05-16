"use client";

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, ContactShadows, Environment, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

type RegionProps = {
  position: [number, number, number];
  args: [number, number, number?]; // Can be used for box or cylinder geometry
  label: string;
  id: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  rotation?: [number, number, number];
  type?: 'head' | 'torso' | 'limb';
};

// Skin/Anatomical material
const SkinMaterial = (isSelected: boolean, isHovered: boolean) => (
  <meshStandardMaterial
    color={isSelected ? "#007AFF" : isHovered ? "#cfecff" : "#e0e0e0"}
    roughness={0.4}
    metalness={0.1}
    emissive={isSelected ? "#007AFF" : "#000000"}
    emissiveIntensity={isSelected ? 0.3 : 0}
  />
);

function BodyPart({ position, args, label, id, selectedId, onSelect, rotation = [0, 0, 0], type = 'limb' }: RegionProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedId === id;

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1.05, 0.1));
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1));
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {type === 'head' && <sphereGeometry args={[args[0], 64, 64]} />}
        {type === 'torso' && <boxGeometry args={[args[0], args[1], args[2] || 1]} />}
        {type === 'limb' && <capsuleGeometry args={[args[0], args[1], 32, 64]} />}
        {SkinMaterial(isSelected, hovered)}
      </mesh>
      
      {(hovered || isSelected) && (
        <Html position={[args[0] + 0.5, 0, 0]} center className="pointer-events-none">
          <div className="bg-black/90 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-xl">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

export function HumanModel3D({ selectedRegion, onSelectRegion }: { selectedRegion: string | null, onSelectRegion: (id: string) => void }) {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }} className="w-full h-full cursor-grab active:cursor-grabbing">
      <Environment preset="studio" />
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />

      <PresentationControls
        global
        rotation={[0, 0, 0]}
        polar={[-0.2, 0.2]}
        azimuth={[-0.5, 0.5]}
        config={{ mass: 2, tension: 400 }}
      >
        <Float speed={1.5} rotationIntensity={0.1}>
          <group position={[0, -1, 0]}>
            <BodyPart type="head" id="head" label="Head & Neck" position={[0, 3.2, 0]} args={[0.6, 0]} selectedId={selectedRegion} onSelect={onSelectRegion} />
            <mesh position={[0, 2.4, 0]}>
              <cylinderGeometry args={[0.25, 0.3, 0.6]} />
              <meshStandardMaterial color="#d1d5db" />
            </mesh>
            <BodyPart type="torso" id="chest" label="Chest" position={[0, 1.2, 0]} args={[1.5, 1.8, 0.8]} selectedId={selectedRegion} onSelect={onSelectRegion} />
            <BodyPart type="torso" id="abdomen" label="Abdomen" position={[0, -0.2, 0]} args={[1.3, 1.0, 0.8]} selectedId={selectedRegion} onSelect={onSelectRegion} />
            
            <BodyPart type="limb" id="limbs" label="Left Arm" position={[-1.2, 0.8, 0]} args={[0.25, 2]} rotation={[0, 0, -0.2]} selectedId={selectedRegion} onSelect={onSelectRegion} />
            <BodyPart type="limb" id="limbs" label="Right Arm" position={[1.2, 0.8, 0]} args={[0.25, 2]} rotation={[0, 0, 0.2]} selectedId={selectedRegion} onSelect={onSelectRegion} />
            
            <BodyPart type="limb" id="limbs" label="Left Leg" position={[-0.4, -2.5, 0]} args={[0.3, 2.5]} selectedId={selectedRegion} onSelect={onSelectRegion} />
            <BodyPart type="limb" id="limbs" label="Right Leg" position={[0.4, -2.5, 0]} args={[0.3, 2.5]} selectedId={selectedRegion} onSelect={onSelectRegion} />
          </group>
        </Float>
      </PresentationControls>

      <ContactShadows position={[0, -5, 0]} opacity={0.5} scale={10} blur={2} />
    </Canvas>
  );
}
