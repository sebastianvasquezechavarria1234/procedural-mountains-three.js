import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import MountainShader from './MountainShader'

function OrbitSphere() {
  const texture = useLoader(THREE.TextureLoader, '/bg.jpg')
  texture.colorSpace = THREE.SRGBColorSpace

  return (
    <mesh>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 60 }}
        gl={{ antialias: true, toneMapping: 4 }}
      >
        <OrbitSphere />

        <group>
          <MountainShader />
        </group>

        <OrbitControls
          minDistance={5}
          maxDistance={35}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          enableDamping
          dampingFactor={0.05}
        />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.4}
            intensity={0.4}
          />
          <Vignette
            eskil={false}
            offset={0.2}
            darkness={0.6}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
