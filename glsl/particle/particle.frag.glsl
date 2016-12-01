#version 100
precision highp float;
precision highp int;

varying vec4 v_position;
varying vec4 v_velocity;
varying vec4 v_force;

void main() {
    gl_FragData[0] = vec4(v_position.xyz, 1);
}
