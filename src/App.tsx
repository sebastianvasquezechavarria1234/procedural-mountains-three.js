import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import MountainShader from './MountainShader'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 60 }}
        gl={{ antialias: true, toneMapping: 4 }}
      >
        <color attach="background" args={['white']} />
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
