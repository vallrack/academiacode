'use client';

import * as THREE from 'three';
import { useRef, useMemo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, TorusKnot, Text } from '@react-three/drei';

function Shape({ geometry, material, position, rotationSpeed, ...props }: any) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * rotationSpeed.x;
      ref.current.rotation.y += delta * rotationSpeed.y;
    }
  });
  return (
    <mesh ref={ref} position={position} {...props}>
      {geometry}
      {material}
    </mesh>
  );
}

function FloatingShapes() {
    const { viewport } = useThree();
    const shapes = useMemo(() => {
        const primaryColor = '#3F51B5'; 
        const accentColor = '#FFAB40';
        const secondaryColor = '#E0E0E0';
    
        return [
          {
            id: 'main-shape',
            geometry: <Icosahedron args={[1, 0]} />,
            material: <meshStandardMaterial color={primaryColor} roughness={0.3} metalness={0.7} />,
            position: [0, 0, 0],
            rotationSpeed: { x: 0.1, y: 0.15 },
          },
          {
            id: 'knot-1',
            geometry: <TorusKnot args={[viewport.width / 3, 0.05, 200, 16]} />,
            material: <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.2} />,
            position: [0, 0, -2],
            rotationSpeed: { x: -0.05, y: -0.1 },
          },
          {
            id: 'knot-2',
            geometry: <TorusKnot args={[viewport.width / 4, 0.03, 300, 20]} />,
            material: <meshStandardMaterial color={secondaryColor} roughness={0.8} metalness={0.1} />,
            position: [0, 0, 1],
            rotationSpeed: { x: 0.2, y: 0.05 },
          },
        ];
      }, [viewport]);

    return (
        <group>
            {shapes.map(({ id, ...rest }) => (
                <Shape key={id} {...rest} />
            ))}
        </group>
    )
}

function FloatingText() {
    const textRef = useRef<any>();
    useFrame(({ clock }) => {
        if(textRef.current) {
            textRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
        }
    });

    return(
        <group ref={textRef}>
            <Suspense fallback={null}>
                <Text
                    position={[0, 2, 0]}
                    fontSize={0.6}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/Inter-Bold.ttf"
                >
                    AcademiaCode
                </Text>
                <Text
                    position={[0, 1.3, 0]}
                    fontSize={0.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={4}
                    textAlign="center"
                    font="/fonts/Inter-Regular.ttf"
                >
                    La plataforma moderna para la evaluación de código académico.
                </Text>
            </Suspense>
        </group>
    );
}

export default function InteractiveScene() {
  const mouse = useRef([0, 0]);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const { viewport } = state;
    const x = (mouse.current[0] / viewport.width) * 2;
    const y = (mouse.current[1] / viewport.height) * 2;
    if (groupRef.current) {
        groupRef.current.rotation.set(-y * 0.1, x * 0.2, 0);
        groupRef.current.position.set(x * 0.5, -y * 0.25, 0);
    }
  });

  return (
    <>
      <ambientLight intensity={2} />
      <pointLight position={[10, 10, 10]} intensity={300} />
      <pointLight position={[-10, -10, -5]} intensity={150} />
      <directionalLight position={[0, 5, -5]} intensity={3} />
      
      <group ref={groupRef}>
        <FloatingShapes />
        <FloatingText />
      </group>
    </>
  );
}
