import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import MountainShader from './MountainShader'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas
        camera={{ position: [0, 8, 18], fov: 60 }}
        gl={{ antialias: true, toneMapping: 4 /* ACESFilmicToneMapping */ }}
      >
        <OrbitControls
          minDistance={5}
          maxDistance={35}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Terreno montañoso procedural */}
        <MountainShader />

        {/* 2. Post-procesado cinematográfico
            EffectComposer aplica efectos en pantalla completa sobre el render final.
            Bloom: hace que las luces brillantes "deramen" luz a su alrededor (nieve brillante).
            Vignette: oscurece los bordes del encuadre para enfocar al centro, como una lente de cámara. */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.6}  // Solo brillan los píxeles más luminosos que esto
            luminanceSmoothing={0.4}  // Transición suave del umbral
            intensity={0.4}           // Intensidad del efecto (sutil, no excesivo)
          />
          <Vignette
            eskil={false}
            offset={0.2}    // Qué tan adentro empieza el oscurecimiento
            darkness={0.6}  // Qué tan oscuros se hacen los bordes
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
