<div align="center">

# ⛰️ Montañas

### Procedural Terrain Shader — Real-Time Mountain Generation

<br>

> *No models. No heightmaps. Every peak, every valley, every shadow is born from equations executed directly on the GPU.*

<br>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<br>

<img src="preview.jpg" alt="Montañas — Procedural Terrain Preview" width="100%" />

</div>

---

## Index

| # | Section | What you'll find |
|:-:|---------|------------------|
| 1 | [What is this](#1-what-is-this) | The idea behind the project |
| 2 | [What it does](#2-what-it-does) | Capabilities and features |
| 3 | [How it works](#3-how-it-works) | The technical core of the shader |
| 4 | [Stack](#4-stack) | Technologies and why they're here |
| 5 | [Quick start](#5-quick-start) | Zero to mountains in 3 commands |
| 6 | [Structure](#6-structure) | What lives where |
| 7 | [Tuning](#7-tuning) | Adjustable parameters |
| 8 | [Performance](#8-performance) | What each pixel costs |
| 9 | [License](#9-license) | |

---

## 1. What is this

A procedural terrain shader built with **React Three Fiber** and **custom GLSL** that generates mountains in real time inside the browser.

The terrain doesn't come from a file. There's no hidden `.obj` or imported heightmap. All geometry is calculated per-vertex in the vertex shader using mathematical noise functions — which means that every time it renders, the mountain range emerges from pure arithmetic.

The result is a surface with **262,144 vertices**, each displaced by a combination of **Simplex Noise** and **Ridged Multifractal FBM**, colored by biomes that respond to height and slope, wrapped in atmospheric fog and finished with bloom and vignette.

> A shader laboratory disguised as a landscape.

---

## 2. What it does

### Terrain generation

- **8 octaves of FBM with ridged noise** — Sharp ridges, smooth valleys. Each octave doubles the frequency and halves the amplitude, creating fractal detail from macro shape down to fine cracks.
- **Macro-variation** — A very low frequency noise pass acts as a multiplicative mask, clustering mountain ranges into regions and leaving plains between them.
- **Per-octave rotation** — A 2×2 rotation matrix is applied to coordinates on each pass, breaking the grid alignment that betrays procedural noise.

### Coloration and biomes

Four base colors are dynamically blended based on relative height and surface inclination:

| Bioma | Color | When it appears |
|:-----:|:-----:|-----------------|
| Forest | `#142012` | Low, flat areas |
| Tundra | `#2E3821` | Moderate elevation, low slope |
| Rock | `#383533` | Steep slopes or mid-range heights |
| Snow | `#DEEBF8` | High peaks with relatively flat surfaces |

Transitions use `smoothstep` — there are never hard edges.

### Lighting

A **Blinn-Phong** model composed of three layers:

1. **Ambient** — Blueish zenith light that fills shadows
2. **Diffuse** — Classic Lambert with configurable solar direction
3. **Specular** — Applied only to snow, simulating ice glint

### Atmosphere and post-processing

- **Exponential squared fog** — Intensifies with distance, simulating real atmospheric scattering
- **Bloom** — Soft glow in high luminance areas
- **Vignette** — Peripheral darkening that directs the eye to the center
- **Gamma correction** — Perceptual correction from linear to sRGB space

---

## 3. How it works

The shader is split into two parts that communicate through varying variables.

### Vertex Shader

This is where the terrain is born. For each vertex of the plane:

```
1.  XY coordinates of the plane are received (position)
2.  Scaled by uScale
3.  getElevation() is evaluated → a Float representing height
4.  position.z is displaced by that value
5.  Normals are calculated by finite differences (two extra samples)
6.  Projected to clip space
```

**The elevation generator** is the heartland of the project:

```
getElevation(p)
├── snoise()          → Base 2D Simplex Noise
├── ridgedNoise()     → (1 - |snoise|)² — turns valleys into ridges
├── FBM 8 octaves    → Weighted accumulation with adaptive weight
├── macroNoise()      → Low-frequency mask for regional variation
└── × uMaxHeight      → Final scaling
```

The adaptive weight (`weight`) is key: if a vertex already has high elevation, subsequent octaves contribute more. If it's in a valley, they're attenuated. This produces pronounced ridges and flat valley floors.

### Fragment Shader

Receives interpolations from the vertex shader (height, normal, position, distance) and computes the final color:

```
1.  Biome is determined by height + slope
2.  Blinn-Phong lighting is applied (ambient + diffuse + specular)
3.  Deep shadows are darkened
4.  Fog is mixed based on distance to camera
5.  Gamma correction is applied
```

### Vertex → Fragment Communication

| Variable | Type | Content |
|----------|------|---------|
| `vElevation` | `float` | Absolute height of the vertex |
| `vNormal` | `vec3` | World-space normal calculated by finite differences |
| `vPosition` | `vec3` | World-space position |
| `vDistance` | `float` | Distance to the camera plane (for fog) |

---

## 4. Stack

| Technology | Version | Why it's here |
|-----------|:-------:|---------------|
| React | 19.2 | UI framework. The R3F Canvas lives inside a React tree |
| Three.js | 0.185 | The WebGL engine. Handles scene, cameras and render pipeline |
| React Three Fiber | 9.6 | Declarative bridge between React and Three.js |
| Drei | 10.7 | Orbit controls and helpers that prevent boilerplate |
| Postprocessing | 3.0 | Bloom and Vignette with declarative API |
| Tailwind CSS | 4.3 | Layout styles outside the Canvas |
| Vite | 8.1 | Dev server with HMR, production bundler |
| TypeScript | 6.0 | Type safety in React components |

### Notable absences

There are no procedural generation libraries. Simplex noise, FBM, and all elevation logic are implemented directly in GLSL within the project.

---

## 5. Quick start

**Prerequisites:** Node.js ≥ 18

```bash
# Clone
git clone https://github.com/your-user/montanas.git
cd montanas

# Install
npm install

# Run
npm run dev
```

The dev server starts at **`http://localhost:5173`** with hot reload enabled.

### Available scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Compiles TypeScript + generates optimized bundle |
| `npm run preview` | Serves the production build locally |

---

## 6. Structure

```
montañas/
├── index.html                ← HTML entry point
├── vite.config.js            ← Vite configuration + plugins
├── tsconfig.json             ← TypeScript rules
├── package.json              ← Dependencies and scripts
│
├── public/
│   ├── favicon.ico
│   └── preview.jpg           ← Project preview image
│
└── src/
    ├── main.tsx              ← React app mount
    ├── index.css             ← Global styles (Tailwind)
    ├── App.tsx               ← Scene: Canvas, camera, lights, post-processing
    ├── MountainShader.tsx    ← Vertex + Fragment shader for terrain
    └── WaterPlane.tsx        ← Water shader (inactive component)
```

### Recommended reading order

If you want to understand the project, the natural order is:

1. **`App.tsx`** — How the scene is assembled
2. **`MountainShader.tsx`** — The terrain generator (vertex shader → fragment shader)
3. **`WaterPlane.tsx`** — A second shader as a pattern reference

---

## 7. Tuning

All visual parameters are controlled through uniforms passed to the shader.

### Terrain

| Uniform | Type | Default | What it controls |
|---------|:----:|:-------:|------------------|
| `uMaxHeight` | `float` | `7.0` | Maximum height of the peaks |
| `uScale` | `float` | `0.12` | Base noise frequency — lower = broader mountains |

### Lighting

| Uniform | Type | Default | What it controls |
|---------|:----:|:-------:|------------------|
| `uSunDirection` | `vec3` | `(0.8, 0.6, 0.6)` | Direction of the sunlight |
| `uSunColor` | `vec3` | `(1.0, 0.93, 0.85)` | Color temperature of the sun |

### Atmosphere

| Uniform | Type | Default | What it controls |
|---------|:----:|:-------:|------------------|
| `uFogColor` | `vec3` | `#8AB4F8` | Sky / fog color |
| `uFogDensity` | `float` | `0.025` | Density — higher = denser fog |

### Camera

| Parameter | Value | Limit |
|-----------|:-----:|-------|
| Min distance | 5 | Can't get closer |
| Max distance | 35 | Can't go further |
| Min polar angle | `0.2` | Prevents top-down view |
| Max polar angle | `π/2 - 0.05` | Prevents seeing under the terrain |

### Post-processing

| Effect | Parameter | Default |
|--------|-----------|:-------:|
| Bloom | `intensity` | `0.4` |
| Bloom | `luminanceThreshold` | `0.6` |
| Vignette | `darkness` | `0.6` |

---

## 8. Performance

### How it's measured

The shader runs **twice per vertex** in the vertex shader (once for elevation, once for normals via finite differences) and **once per pixel** in the fragment shader.

| Metric | Value |
|--------|:-----:|
| Total vertices | 512 × 512 = **262,144** |
| `snoise` evaluations per vertex | ~16 |
| Operations per pixel (fragment) | ~50 |
| Textures used | 0 |

### Key optimizations

- **`useMemo` on uniforms** — The uniform structure is created once, not per frame
- **Minimal `useFrame`** — Only updates `uCameraPos` (1 copy per frame)
- **Normals by finite differences** — Cheaper than analytical derivatives, cost of 2 extra `getElevation` samples
- **No textures** — Eliminates GPU memory fetches, everything is pure arithmetic

### Potential bottleneck

The 512×512 vertex geometry is the practical limit. Going to 1024×1024 would multiply cost by 4x. If more resolution is needed, the strategy would be adaptive tessellation or LOD (Level of Detail).

---



<div align="center">

*A landscape that didn't exist until the GPU painted it.*
</br>

Made with ❤️ by <a href="https://sebas-dev.vercel.app/" target="_blank" rel="noopener noreferrer">Sebastián V</a>


</div>
