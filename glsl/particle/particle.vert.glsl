#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform sampler2D u_posTex;
uniform int u_side;

attribute float a_idx;

varying vec4 v_position;

void main() {
    int idx = int(a_idx);

    float v = float(idx / u_side) / float(u_side);
    float u = float(idx - (idx / u_side) * u_side) / float(u_side);
    vec4 pos = texture2D(u_posTex, vec2(u, v));

    gl_Position = u_cameraMat * pos;
    v_position = pos;
	gl_PointSize = 10.0;
}
