#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

varying float v_idx;

void main() {
    gl_FragData[3] = vec4(1, 0, 0, 1);
}
