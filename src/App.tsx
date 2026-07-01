import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MountainShader from './MountainShader'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <color attach="background" args={['#0a0a1a']} />
        <OrbitControls />
        <MountainShader />
      </Canvas>
    </div>
  )
}
