#version 100    

precision highp float;
precision highp int;

uniform int u_texID;
uniform mat4 u_cameraMat;

varying float texID;
varying vec3 pos;

attribute vec4 a_position;

void main() {
    vec4 position = u_cameraMat * a_position;
    gl_Position = position;
    texID = float(u_texID);
    pos = a_position.xyz;
}