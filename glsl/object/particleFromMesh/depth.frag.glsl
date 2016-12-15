#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

varying float texID;
varying vec3 pos;

void main() {
    if (int(texID) == 0) {
        gl_FragData[0] = vec4(pos, 1); 
    } else if (int(texID) == 1) {
        gl_FragData[1] = vec4(pos, 1);
    }
}
