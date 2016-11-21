#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform sampler2D u_posTex;

attribute vec2 a_uv;

varying vec4 v_position;

void main() {
    vec4 pos = texture2D(u_posTex, a_uv);

    gl_Position = u_cameraMat * pos;
    v_position = pos;
	gl_PointSize = 10.0;
}
