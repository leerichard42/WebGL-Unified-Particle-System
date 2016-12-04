#version 100
precision highp float;
precision highp int;

varying vec4 v_position;
varying vec4 v_velocity;
varying vec4 v_force;

void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) - 0.5;
    gl_FragData[0] = vec4(uv, 0, length(uv) < 0.5 ? 1 : 0);
}
