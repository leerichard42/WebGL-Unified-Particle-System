#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;

attribute vec3 a_position;

void main() {
    gl_Position = u_cameraMat * vec4(a_position, 1.0);
	gl_PointSize = 10.0;
}
