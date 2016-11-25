#version 100
precision highp float;
precision highp int;

varying vec4 v_position;

void main() {
    gl_FragData[0] = vec4(v_position.xyz, 1);
}
