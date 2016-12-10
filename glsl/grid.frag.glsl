#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

varying float v_idx;

void main() {
    gl_FragData[0] = vec4(v_idx, v_idx, v_idx, v_idx);
}
