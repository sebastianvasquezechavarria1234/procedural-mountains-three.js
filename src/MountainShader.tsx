import { useRef, useMemo, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  // 1. Noise
  // Simplex Noise 2D
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // 4. Ridged Noise (Montañas realistas)
  // Genera crestas afiladas tomando el valor absoluto invertido
  float ridgedNoise(vec2 p) {
    float n = snoise(p);
    n = 1.0 - abs(n);
    return n * n; // Cuadrado para hacer los picos más agudos y los valles más planos
  }

  // 8. Uniforms
  uniform float uMaxHeight;
  uniform float uScale;

  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistance; // Distancia a la cámara para la niebla atmosférica

  // 2. FBM (Ridged Multifractal)
  // Este es el algoritmo estándar de la industria para generar cadenas montañosas.
  // Combina múltiples octavas de ruido con pesos dinámicos para que los valles
  // sean suaves y los picos sean muy escarpados.
  float getElevation(vec2 p) {
    vec2 pos = p * uScale;
    
    // Macro-variación: Ruido de muy baja frecuencia para agrupar cordilleras
    // Esto rompe la uniformidad, creando regiones de montañas altas y regiones de llanuras
    float macroNoise = snoise(pos * 0.3) * 0.5 + 0.5; 
    // Suavizamos el rango para que haya un buen contraste entre zonas altas y bajas
    macroNoise = smoothstep(0.0, 0.8, macroNoise);
    
    float value = 0.0;
    float amplitude = 0.6;
    float frequency = 1.0;
    float weight = 1.0; // Ayuda a aplanar los valles
    
    // Rotación para romper la alineación de la grilla del simplex noise
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    
    for (int i = 0; i < 8; i++) {
      // Usamos ridged noise puro para las montañas
      float n = ridgedNoise(pos * frequency);
      
      // Aplicamos el peso. Si estamos en un valle, los detalles finos se suavizan.
      n *= weight;
      weight = clamp(n * 2.0, 0.0, 1.0);
      
      value += n * amplitude;
      
      frequency *= 2.0;
      amplitude *= 0.5;
      pos = rot * pos; // Rotar coordenadas en cada octava para mayor naturalidad
    }
    
    // Elevación base de la montaña
    float baseElevation = value * value * 0.7;
    
    // Aplicamos el macro-ruido como una máscara multiplicativa, 
    // sumando un mínimo (0.15) para que no queden agujeros totalmente planos.
    float finalElevation = baseElevation * (macroNoise + 0.15);
    
    return finalElevation * uMaxHeight;
  }

  void main() {
    vec3 pos = position;
    
    // 5. Elevación del terreno
    float elevation = getElevation(pos.xy);
    pos.z += elevation;
    
    vElevation = elevation;
    vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

    // 6. Cálculo de normales procedural
    float offset = 0.05; // Offset más amplio para evitar "facetado" o ruido
    float elevationX = getElevation(position.xy + vec2(offset, 0.0));
    float elevationY = getElevation(position.xy + vec2(0.0, offset));
    
    vec3 p0 = vec3(position.x, position.y, elevation);
    vec3 pX = vec3(position.x + offset, position.y, elevationX);
    vec3 pY = vec3(position.x, position.y + offset, elevationY);
    
    vec3 tangentX = normalize(pX - p0);
    vec3 tangentY = normalize(pY - p0);
    
    vec3 objectNormal = normalize(cross(tangentX, tangentY));
    vNormal = normalize((modelMatrix * vec4(objectNormal, 0.0)).xyz);

    vec4 mvPosition = viewMatrix * vec4(vPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Calculamos la distancia desde la cámara para la niebla atmosférica
    vDistance = -mvPosition.z;
  }
`;

const fragmentShader = `
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDistance;

  uniform float uMaxHeight;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  void main() {
    // 7. Coloreado por altura y pendiente (Biome Blending Ultra Realista)
    // Tonos extraídos de fotografías aéreas alpinas
    vec3 colorValley = vec3(0.08, 0.12, 0.07);  // Bosque de pinos muy denso y oscuro
    vec3 colorBase = vec3(0.18, 0.22, 0.13);    // Tundra subalpina, musgo seco
    vec3 colorRock = vec3(0.22, 0.21, 0.20);    // Roca de granito gris neutro
    vec3 colorSnow = vec3(0.85, 0.90, 0.95);    // Nieve blanca con dispersión azul del cielo

    float h = vElevation / uMaxHeight; // Altura normalizada 0.0 a 1.0
    vec3 normal = normalize(vNormal);
    float slope = dot(normal, vec3(0.0, 1.0, 0.0)); // 1.0 = totalmente plano, 0.0 = vertical
    float steepness = 1.0 - slope; // 0.0 = plano, 1.0 = vertical

    // Base del terreno (mezcla entre bosque y pradera por altura)
    vec3 terrainColor = mix(colorValley, colorBase, smoothstep(0.0, 0.15, h));

    // La roca se revela en pendientes escarpadas (sin importar si está bajo o alto)
    // Y también por altura natural (por encima de la línea de árboles)
    float rockMixBySlope = smoothstep(0.3, 0.5, steepness);
    float rockMixByHeight = smoothstep(0.35, 0.55, h);
    terrainColor = mix(terrainColor, colorRock, max(rockMixBySlope, rockMixByHeight));

    // Añadir nieve en las cumbres, pero solo se acumula donde no es muy empinado
    // Las grietas o paredes verticales altas seguirán siendo roca
    float snowAccumulation = smoothstep(0.55, 0.75, h) * smoothstep(0.4, 0.8, slope);
    terrainColor = mix(terrainColor, colorSnow, snowAccumulation);

    // 9. Renderizado final (Iluminación)
    vec3 lightDir = normalize(uSunDirection);
    
    // Iluminación difusa (Lambert)
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Luz ambiental (cielo iluminando sombras)
    vec3 ambientLight = vec3(0.20, 0.30, 0.45) * terrainColor * 0.8; // Más azul para dar escala
    
    // Color principal direccional
    vec3 diffuseLight = diff * uSunColor * terrainColor;

    vec3 finalColor = ambientLight + diffuseLight;

    // 10. Niebla Atmosférica (Fog Exponencial)
    // Es indispensable para percibir la escala masiva. Oculta el fondo suavemente.
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vDistance * vDistance);
    finalColor = mix(finalColor, uFogColor, clamp(fogFactor, 0.0, 1.0));

    // Corrección gamma sutil para contraste cinemático
    finalColor = pow(finalColor, vec3(0.9));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function MountainShader() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()

  // Sincronizar color del cielo de Three.js con nuestra niebla
  useEffect(() => {
    scene.background = new THREE.Color(0x8ab4f8) // Un azul de cielo claro y fotorealista
  }, [scene])

  const uniforms = useMemo(() => ({
    uMaxHeight: { value: 7.0 },               // Elevación máxima ajustada a la nueva escala
    uScale: { value: 0.12 },                  // Zoom del ruido a un punto medio exacto
    uSunDirection: { value: new THREE.Vector3(0.8, 0.6, 0.6) }, // Sol más bajo (atardecer/amanecer)
    uSunColor: { value: new THREE.Color(1.0, 0.93, 0.85) },     // Luz dorada cálida
    uFogColor: { value: new THREE.Color(0x8ab4f8) },            // Color del cielo/niebla
    uFogDensity: { value: 0.025 },                              // Densidad para difuminar montañas lejanas
  }), [])



  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[40, 40, 512, 512]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
