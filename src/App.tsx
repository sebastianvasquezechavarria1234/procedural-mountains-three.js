import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MountainShader from './MountainShader'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas camera={{ position: [0, 8, 18], fov: 60 }}>
        <OrbitControls
          // Límites de zoom (distancia mínima y máxima a la escena)
          minDistance={5}
          maxDistance={35}
          // Límites del ángulo vertical:
          //   0 = mirar desde arriba (cenital)
          //   Math.PI/2 = mirar horizontalmente (horizonte)
          // Limitamos a ~80° para que nunca pase por debajo del plano
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2 - 0.05}
          // Suavizado de la cámara para movimiento más cinematográfico
          enableDamping
          dampingFactor={0.05}
        />
        <MountainShader />
      </Canvas>
    </div>
  )
}
