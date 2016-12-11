#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform int u_side;
uniform int u_bodySide;
uniform float u_diameter;
uniform float u_nearPlaneHeight;

attribute float a_idx;

varying vec4 v_eyePos;
varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    int idx = int(a_idx);

    vec2 uv = getUV(idx, u_side);
    vec3 pos = texture2D(u_posTex, uv).xyz;
    vec4 vel = texture2D(u_velTex, uv);

    v_eyePos = u_cameraMat * vec4(pos, 1.0);
    v_uv = uv;
    gl_Position = u_cameraMat * vec4(pos, 1.0);
	gl_PointSize = (u_nearPlaneHeight * u_diameter) / gl_Position.w;
}
