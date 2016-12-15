WebGL Unified Particle System
======================

**Richard Lee and Ottavio Hartman**

A unified particle and rigid body simulation in WebGL, inspired by ((this GPU Gems article)).<br>


//live demo <br>
Try the live demo ((here)).<br>
This project requires a WebGL capable browser which supports the extensions 'OES_texture_float',
'OES_texture_float_linear', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', and 'EXT_frag_depth'.
>**Controls**<br>
>`click + drag` : Rotate camera view<br>
>`right click + drag` : Pan camera view<br>
>`mouse scroll` : Zoom camera

//video

## Features

### Discrete Element Method

### Uniform Grid

### Rigid Bodies
//rigid body indexing image
//

### Particle Rendering

### Arbitrary Model Loading

## Performance Analysis

- Tested on:
 * Firefox 49.0.2, Windows 10, i5-3570K @ 3.40GHz 16GB, Radeon HD 7900
 * Google Chrome 54.0.2840.71, Windows 10, FX-8320 @ 3.50GHz 8GB, GTX 1060 3GB

### naive vs grid, with increasing # of particles
### performance among scenes






### References
http://http.developer.nvidia.com/GPUGems3/gpugems3_ch29.html //gpu gems
http://learningwebgl.com/blog/?p=1786 //rendering to texture
http://developer.download.nvidia.com/presentations/2010/gdc/Direct3D_Effects.pdf //point rendering

* [Three.js](https://github.com/mrdoob/three.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [stats.js](https://github.com/mrdoob/stats.js) by [@mrdoob](https://github.com/mrdoob) and contributors
* [webgl-debug](https://github.com/KhronosGroup/WebGLDeveloperTools) by Khronos Group Inc.
* [glMatrix](https://github.com/toji/gl-matrix) by [@toji](https://github.com/toji) and contributors
* [minimal-gltf-loader](https://github.com/shrekshao/minimal-gltf-loader) by [@shrekshao](https://github.com/shrekshao)
