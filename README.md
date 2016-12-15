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
In order to increase the performance of the shaders, a uniform grid was created so each particle could search its nearest neighbors when doing physics calculations. The procedure for generating and updating the uniform grid was adapted from [GPU gems](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch29.html).

A 3D texture represents the voxels in the uniform grid, and each pixel stores the index of the particles contained within it. Since WebGL 1 does not support 3D textures, we adapted a mapping from a 3D texture coordinate onto a 2D texture. The 2D texture can be seen below:

![](img/3D_grid.gif)

The uniform grid is divided into cells of width the same as the diameter of the particles. The reasoning behind this is that it minimized the number of neighboring cells that must be searched in the physics calculations while minimizing the number of particles in a cell. Ideally, each grid cell could hold only one particle, but in practice this is not the case--particles can "squeeze" into a cell depennding on the conditions. In order to handle this edge case, we use a process for updating the grid which fits up to four particle indices in each grid cell. This scattering operation requires a vertex shader to be run in 4 passes, each pass filling in a different component of the grid texture (R, G, B, A) with a particle index. Each pass exploits the fact that the particles are render in ascending index order, with increasing depths. By manipulating the stencil and depth buffers, we successfully populate the 3D grid texture with up to four particles per cell. This process is shown below:

![](http://http.developer.nvidia.com/GPUGems3/elementLinks/29fig08.jpg)
(Image credit: [NVIDIA Gpu Gems](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch29.html))

##### Pitfalls
The uniform grid performs very well under the right conditions (see the Performance Analysis section). However, the uniform grid breaks down in other conditions. If we were to implement particles of different sizes, for example, we'd have to make the uniform grid's cell size equal to the diameter of the smallest particle. In cases where the particle sizes vary greatly, this will mean each particle has to search a large number of neighboring cells, decreasing the performance benefit of the uniform grid.

Another case we ran into where the uniform grid began failing was when too many heavy particles were stacked on top of each other. In this scenario, the pressure of the particles managed to squeeze more than 4 particles into some cells. This made the sea of particles "pop" as particles confused themselves with other particles because of the id lookup in the grid cell. 

Finally, since textures have a maximum limit of 4096x4096 on most computers with WebGL, the grid size is limited to around 255 cells per side (256*256*256 = 4096*4096). This means that as the size of the particles decrease (which increases the number of cells per side on the grid), the uniform grid becomes inviable at a certain point.



### Rigid Bodies
//rigid body indexing image
//

### Particle Rendering

### Arbitrary Model Loading
Defining rigid bodies by hand is quite tedious. We implemented a method of generating rigid body definitions through a process called [depth peeling](https://en.wikipedia.org/wiki/Depth_peeling). Essentially, we bound any volume (in this case, a duck), with a uniform voxel grid. We render an orthographic, axis-aligned projection of the object into a texture, and then, keeping the depth texture untouched, we render the object again with `gl.DepthFunc` set to `gl.GREATER`. Now we have two images: one representing the first point of contact of a "ray" coming from the camera, one representing the second point of contact of that ray:

![](img/depth_ducks.PNG)

![](http://http.developer.nvidia.com/GPUGems3/elementLinks/29fig04.jpg)
(Image credit: [NVIDIA Gpu Gems](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch29.html))

Next, we run a fragment shader which calculates a unique voxel position for its `uv` coordinate. This is similar to the 3D grid since it is a 2D representation of a 3D cube. The fragment shader then calculates if the 3D position of the voxel is in between the two depth peel images--if it is, it writes a `1` to a texture. This texture looks something like this for the duck:

![](img/duck_final.PNG)

Finally, the values in this texture are converted to relative positions and fed into the rigid body shaders. This process allows us to define different resolutions of meshes--a high resolution screenshot of the duck is shown below.

![](img/duck_voxel.PNG)

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
