#version 100
precision highp float;
precision highp int;

attribute vec3 a_position;

varying vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 1.0);
    v_uv = a_position.xy * 0.5 + 0.5;
}
