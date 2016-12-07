#version 100
precision highp float;
precision highp int;

uniform sampler2D u_posTex;

uniform int u_posTexSize;
uniform int u_gridSideLength;
uniform int u_gridTexSize;
uniform int u_gridTexTileDimensions;
uniform float u_particleDiameter;

attribute float a_idx;
varying float v_idx;

vec2 uvFrom3D(vec3 pos) {
    float u = pos.x + float(u_gridSideLength) * (pos.z - float(u_gridTexTileDimensions) * floor(pos.z / float(u_gridTexTileDimensions)));

    float v = pos.y + float(u_gridSideLength) * floor(pos.x / float(u_gridTexTileDimensions));

    return vec2(u, v) / float(u_gridTexSize);
}

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    vec4 pos = texture2D(u_posTex, getUV(int(a_idx), u_posTexSize));

    vec3 voxelIndex = (vec3(pos) - vec3(-u_gridSideLength, -u_gridSideLength, -u_gridSideLength)) / u_particleDiameter;

    vec2 gridUV = uvFrom3D(voxelIndex);

    gl_Position = vec4(gridUV, 0, 1);
    //gl_Position = vec4(a_idx / 10., a_idx / 10., 0, 1);
    gl_PointSize = 1.0;
    v_idx = a_idx;
}