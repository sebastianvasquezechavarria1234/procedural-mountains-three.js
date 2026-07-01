import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// Vertex shader del agua: ondulaciones suaves con simplex noise
const waterVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWaveHeight;

  uniform float uTime;

  // Simplex noise rápido 2D para las olas
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 xv = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(xv) - 0.5;
    vec3 a0 = xv - floor(xv + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Ondulaciones suaves del agua (doble capa para mayor naturalidad)
    float wave1 = snoise(pos.xy * 0.8 + vec2(uTime * 0.15, uTime * 0.1)) * 0.04;
    float wave2 = snoise(pos.xy * 1.6 + vec2(-uTime * 0.1, uTime * 0.18)) * 0.02;
    pos.z += wave1 + wave2;
    vWaveHeight = wave1 + wave2;

    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
  }
`

// Fragment shader del agua: color del agua con reflexión de Fresnel simulada
const waterFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vWaveHeight;

  uniform float uTime;
  uniform vec3 uSunDirection;
  uniform vec3 uCameraPos;

  void main() {
    // Color base del agua (azul profundo con variación)
    vec3 waterDeep    = vec3(0.01, 0.08, 0.16);  // Agua profunda casi negra
    vec3 waterShallow = vec3(0.05, 0.22, 0.35);  // Agua poco profunda azul-turquesa
    vec3 waterColor   = mix(waterDeep, waterShallow, 0.5 + vWaveHeight * 5.0);

    // Efecto de Fresnel simulado: el agua se hace más reflectante en ángulos rasantes
    vec3 viewDir = normalize(uCameraPos - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
    
    // Reflexión del cielo en el agua
    vec3 skyReflection = vec3(0.4, 0.6, 0.9); // Color del cielo reflejado
    waterColor = mix(waterColor, skyReflection, fresnel * 0.6);

    // Brillo especular del sol en el agua
    vec3 lightDir = normalize(uSunDirection);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vec3(0.0, 1.0, 0.0), halfVec), 0.0), 128.0);
    waterColor += vec3(1.0, 0.95, 0.8) * spec * 0.8;

    // Pequeños destellos blancos en las crestas de las olas
    float foam = smoothstep(0.01, 0.035, vWaveHeight);
    waterColor = mix(waterColor, vec3(0.9, 0.95, 1.0), foam * 0.3);

    gl_FragColor = vec4(waterColor, 0.88); // Semitransparente
  }
`

export default function WaterPlane() {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(() => ({
    uTime:         { value: 0 },
    uSunDirection: { value: new THREE.Vector3(0.8, 0.6, 0.6) },
    uCameraPos:    { value: new THREE.Vector3() },
  }), [])

  useFrame(({ clock, camera }) => {
    uniforms.uTime.value = clock.getElapsedTime()
    uniforms.uCameraPos.value.copy(camera.position)
  })

  return (
    // El agua se posiciona a -1.6 (cerca del nivel del suelo, en los valles)
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <planeGeometry args={[40, 40, 128, 128]} />
      <shaderMaterial
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false} // Evita artefactos de orden de transparencia
      />
    </mesh>
  )
}
