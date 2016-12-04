#version 100
precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform int u_posTexSize; 
uniform int u_gridSize;
uniform float u_num2DTex;
uniform float u_particleDiameter;

attribute float a_idx;
varying float v_idx;

vec2 uvFrom3D(vec3 pos) {
    float u = pos.x + float(u_gridSize) * (pos.z - u_num2DTex * floor(pos.z / u_num2DTex));

    float v = pos.y + float(u_gridSize) * floor(pos.x / u_num2DTex);

    return vec2(u, v);
}

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    vec4 pos = texture2D(u_posTex, getUV(int(a_idx), u_posTexSize));

    vec3 voxelIndex = (vec3(pos) - vec3(-u_gridSize, -u_gridSize, -u_gridSize)) / u_particleDiameter;

    vec2 gridUV = uvFrom3D(voxelIndex);

    //gl_Position = vec4(gridUV, 0, 1);
    gl_Position = vec4(a_idx / 200.0,a_idx / 200.0, 0., 1.);
    v_idx = a_idx;
}

/*
In the VS, the particle position is read from the particle position texture, 

vec4 pos = texture2D(u_posTex, v_uv);

and the voxel index is calculated with Equation 9. 

uniform1 d = .1
uniform3v s = -grid corner
g = (p - s) / d 

Then the coordinates in the grid texture are calculated from the voxel index (as described in Section 29.2.2), 

3d -> 2d

the vertex position is set to the grid coordinates, 

gl_Position = pos ?

and the color is set to the particle index

grid.frag.glsl
    gl_FragColor = vec4(a_idx, 0, 0, 1);
*/