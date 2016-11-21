#version 100
precision highp float;
precision highp int;

varying vec4 v_position;

void main() {
    gl_FragColor = vec4(abs(v_position.xyz) * 0.4, 1);
}
