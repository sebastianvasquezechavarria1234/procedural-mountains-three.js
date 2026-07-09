<div align="center">

# ⛰️ Montañas

### Procedural Terrain Shader — Generación de Terreno en Tiempo Real

<br>

> *No hay modelos. No hay texturas de altura. Cada pico, cada valle, cada sombra nace de ecuaciones ejecutadas directamente en la GPU.*

<br>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Índice

| # | Sección | Qué encontrarás |
|:-:|---------|-----------------|
| 1 | [Qué es esto](#1-qué-es-esto) | La idea detrás del proyecto |
| 2 | [Qué hace](#2-qué-hace) | Capacidades y características |
| 3 | [Cómo funciona](#3-cómo-funciona) | El corazón técnico del shader |
| 4 | [Stack](#4-stack) | Tecnologías y por qué están aquí |
| 5 | [Arranque rápido](#5-arranque-rápido) | De cero a montañas en 3 comandos |
| 6 | [Estructura](#6-estructura) | Qué vive dónde |
| 7 | [Tuning](#7-tuning) | Parámetros ajustables |
| 8 | [Rendimiento](#8-rendimiento) | Qué cuesta cada píxel |
| 9 | [Licencia](#9-licencia) | |

---

## 1. Qué es esto

Un terrain shader procedural construido con **React Three Fiber** y **GLSL personalizado** que genera montañas en tiempo real dentro del navegador.

El terreno no viene de un archivo. No hay un `.obj` oculto ni un mapa de alturas importado. Toda la geometría se calcula por vértice en el vertex shader usando funciones de ruido matemático — lo que significa que cada vez que se renderiza, la cordillera emerge de pura aritmética.

El resultado es una superficie con 262,144 vértices, cada uno desplazado por una combinación de **Simplex Noise** y **Ridged Multifractal FBM**, coloreada por biomas que responden a la altura y la pendiente, envuelta en niebla atmosférica y terminada con bloom y viñette.

> Un laboratorio de shaders disfrazado de paisaje.

---

## 2. Qué hace

### Generación de terreno

- **8 octavas de FBM con ridged noise** — Crestas afiladas, valles suaves. Cada octava dobla la frecuencia y reduce la amplitud a la mitad, creando detalle fractal desde la forma macro hasta las grietas finas.
- **Macro-variación** — Un pase de ruido de muy baja frecuencia actúa como máscara multiplicativa, agrupando cordilleras en regiones y dejando llanuras entre ellas.
- **Rotación por octava** — Una matriz de rotación 2×2 se aplica a las coordenadas en cada pasada, rompiendo la alineación de grilla que delata al ruido procedural.

### Coloración y biomas

Cuatro colores base se mezclan dinámicamente según la altura relativa y la inclinación de la superficie:

| Bioma | Color | Cuándo aparece |
|-------|:-----:|----------------|
| Bosque | `#142012` | Zonas bajas y planas |
| Tundra | `#2E3821` | Elevación moderada, poca pendiente |
| Roca | `#383533` | Pendientes pronunciadas o alturas medias |
| Nieve | `#DEEBF8` | Cumbres altas con superficie relativamente plana |

Las transiciones usan `smoothstep` — nunca hay bordes duros.

### Iluminación

Un modelo **Binn-Phong** compuesto por tres capas:

1. **Ambiente** — Luz cenital azulada que llena las sombras
2. **Difusa** — Lambert clásico con dirección solar configurable
3. **Especular** — Solo se aplica sobre nieve, simulando el brillo del hielo

### Atmósfera y postprocesado

- **Niebla exponencial al cuadrado** — Se intensifica con la distancia, simulando dispersión atmosférica real
- **Bloom** — Resplandor suave en las zonas de alta luminancia
- **Viñette** — Oscurecimiento periférico que dirige la mirada al centro
- **Gamma correction** — Corrección perceptual de espacio lineal a sRGB

---

## 3. Cómo funciona

El shader se divide en dos partes que se comunican a través de varying variables.

### Vertex Shader

Es donde nace el terreno. Para cada vértice del plano:

```
1.  Se reciben las coordenadas XY del plano (position)
2.  Se escala por uScale
3.  Se evalúa getElevation() → un Float que representa la altura
4.  Se desplaza position.z por ese valor
5.  Se calculan normales por diferencias finitas (dos muestras extra)
6.  Se proyecta a clip space
```

**El generador de elevación** es el heartland del proyecto:

```
getElevation(p)
├── snoise()          → Simplex Noise 2D base
├── ridgedNoise()     → (1 - |snoise|)² — convierte valles en crestas
├── FBM 8 octavas     → Acumulación ponderada con peso adaptativo
├── macroNoise()      → Máscara de baja frecuencia para variación regional
└── × uMaxHeight      → Escalado final
```

El peso adaptativo (`weight`) es clave: si un vértice ya tiene elevación alta, las siguientes octavas contribuyen más. Si está en un valle, se atenúan. Esto produce crestas pronunciadas y fondos de valleplanos.

### Fragment Shader

Recibe las interpolaciones del vertex shader (altura, normal, posición, distancia) y calcula el color final:

```
1.  Se determina el bioma por altura + pendiente
2.  Se aplica iluminación Blinn-Phong (ambient + diffuse + specular)
3.  Se oscurecen sombras profundas
4.  Se mezcla con niebla según la distancia a cámara
5.  Se aplica corrección gamma
```

### Comunicación Vertex → Fragment

| Variable | Tipo | Contenido |
|----------|------|-----------|
| `vElevation` | `float` | Altura absoluta del vértice |
| `vNormal` | `vec3` | Normal world-space calculada por diferencias finitas |
| `vPosition` | `vec3` | Posición world-space |
| `vDistance` | `float` | Distancia al plano de la cámara (para niebla) |

---

## 4. Stack

| Tecnología | Versión | Por qué está aquí |
|-----------|:-------:|--------------------|
| React | 19.2 | Framework UI. El Canvas de R3F vive dentro de un árbol React |
| Three.js | 0.185 | El motor WebGL. Maneja la escena, cámaras y render pipeline |
| React Three Fiber | 9.6 | Puente declarativo entre React y Three.js |
| Drei | 10.7 | Controles orbitales y helpers que evitarían código repetido |
| Postprocessing | 3.0 | Bloom y Viñette con API declarativa |
| Tailwind CSS | 4.3 | Estilos del layout externo al Canvas |
| Vite | 8.1 | Dev server con HMR, bundler de producción |
| TypeScript | 6.0 | Seguridad de tipos en los componentes React |

### Dependencias notables ausentes

No hay librerías de generación procedural. El ruido simplex, el FBM y toda la lógica de elevación están implementados directamente en GLSL dentro del proyecto.

---

## 5. Arranque rápido

**Prerrequisitos:** Node.js ≥ 18

```bash
# Clonar
git clone https://github.com/tu-usuario/montanas.git
cd montanas

# Instalar
npm install

# Ejecutar
npm run dev
```

El servidor de desarrollo arranca en **`http://localhost:5173`** con hot reload habilitado.

### Scripts disponibles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Compila TypeScript + genera bundle optimizado |
| `npm run preview` | Sirve el build de producción localmente |

---

## 6. Estructura

```
montañas/
├── index.html                ← Punto de entrada HTML
├── vite.config.js            ← Configuración de Vite + plugins
├── tsconfig.json             ← Reglas de TypeScript
├── package.json              ← Dependencias y scripts
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── main.tsx              ← Montaje de la aplicación React
    ├── index.css             ← Estilos globales (Tailwind)
    ├── App.tsx               ← Escena: Canvas, cámara, luces, postprocesado
    ├── MountainShader.tsx    ← Vertex + Fragment shader del terreno
    └── WaterPlane.tsx        ← Shader de agua (componente inactivo)
```

### Lectura recomendada

Si quieres entender el proyecto, el orden natural es:

1. **`App.tsx`** — Cómo se monta la escena
2. **`MountainShader.tsx`** — El generador de terreno (vertex shader → fragment shader)
3. **`WaterPlane.tsx`** — Un segundo shader como referencia de patrones

---

## 7. Tuning

Todos los parámetros visuales se controlan mediante uniforms que se pasan al shader.

### Terreno

| Uniform | Tipo | Default | Qué controla |
|---------|:----:|:-------:|--------------|
| `uMaxHeight` | `float` | `7.0` | Altura máxima de las cumbres |
| `uScale` | `float` | `0.12` | Frecuencia base del ruido — valores bajos = montañas más amplias |

### Iluminación

| Uniform | Tipo | Default | Qué controla |
|---------|:----:|:-------:|--------------|
| `uSunDirection` | `vec3` | `(0.8, 0.6, 0.6)` | Dirección de la luz solar |
| `uSunColor` | `vec3` | `(1.0, 0.93, 0.85)` | Temperatura de color del sol |

### Atmósfera

| Uniform | Tipo | Default | Qué controla |
|---------|:----:|:-------:|--------------|
| `uFogColor` | `vec3` | `#8AB4F8` | Color del cielo / niebla |
| `uFogDensity` | `float` | `0.025` | Densidad — mayor = niebla más opaca |

### Cámara

| Parámetro | Valor | Límite |
|-----------|:-----:|--------|
| Distancia mínima | 5 | No permite acercarse más |
| Distancia máxima | 35 | No permite alejarse más |
| Ángulo polar mín | `0.2` | Evita vista cenital |
| Ángulo polar máx | `π/2 - 0.05` | Evita ver debajo del terreno |

### Postprocesado

| Efecto | Parámetro | Default |
|--------|-----------|:-------:|
| Bloom | `intensity` | `0.4` |
| Bloom | `luminanceThreshold` | `0.6` |
| Viñette | `darkness` | `0.6` |

---

## 8. Rendimiento

### Cómo se mide

El shader se ejecuta **dos veces por vértice** en el vertex shader (una para la elevación, otra para las normales por diferencias finitas) y **una vez por píxel** en el fragment shader.

| Métrica | Valor |
|---------|:-----:|
| Vértices totales | 512 × 512 = **262,144** |
| Evaluaciones de `snoise` por vértice | ~16 |
| Operaciones por píxel (fragment) | ~50 |
| Texturas utilizadas | 0 |

### Optimizaciones clave

- **`useMemo` en uniforms** — La estructura de uniforms solo se crea una vez, no por frame
- **`useFrame` mínimo** — Solo actualiza `uCameraPos` (1 copia por frame)
- **Normales por diferencias finitas** — Más baratas que derivadas analíticas, costo de 2 muestras adicionales de `getElevation`
- **Sin texturas** — Elimina fetches de memoria GPU, todo es aritmética pura

### Cuello de botella potencial

La geometría de 512×512 vértices es el límite práctico. Subir a 1024×1024 multiplicaría el costo por 4x. Si se necesita más resolución, la estrategia sería implementar tessellation adaptativa o LOD (Level of Detail).

---

## 9. Licencia

Proyecto de uso educativo y personal. No está licenciado para producción.

---

<div align="center">

*Un paisaje que no existió hasta que la GPU lo pintó.*

</div>
