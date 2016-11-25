#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform sampler2D u_posTex;
uniform int u_side;

attribute float a_idx;

varying vec4 v_position;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    int idx = int(a_idx);

    vec4 pos = texture2D(u_posTex, getUV(idx, u_side));

    gl_Position = u_cameraMat * pos;
    v_position = pos;
	gl_PointSize = 10.0;
}
