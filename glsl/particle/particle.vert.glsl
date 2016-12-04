#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform int u_side;
uniform float u_diameter;
uniform float u_nearPlaneHeight;

attribute float a_idx;

varying vec4 v_position;
varying vec4 v_velocity;
varying vec4 v_force;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    int idx = int(a_idx);

    vec2 uv = getUV(idx, u_side);
    vec4 pos = texture2D(u_posTex, uv);
    vec4 vel = texture2D(u_velTex, uv);
    vec4 force = texture2D(u_forceTex, uv);

    v_position = pos;
    v_velocity = vel;
    v_force = force;
    gl_Position = u_cameraMat * pos;
	gl_PointSize = (u_nearPlaneHeight * u_diameter) / gl_Position.w;
}
