#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

varying float v_idx;

void main() {
    gl_FragData[3] = vec4(v_idx / 1000., 0, 0, 1);
    //gl_FragColor = vec4(1, 0, 0, 1);
}
