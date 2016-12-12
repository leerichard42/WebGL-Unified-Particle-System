#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

varying float v_idx;

void main() {
    float idx = v_idx;
    if (idx == 0.0) {
        idx = .5;
    }
    gl_FragData[0] = vec4(idx, idx, idx, idx);
}
