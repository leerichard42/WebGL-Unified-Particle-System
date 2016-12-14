#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

varying float texID;
varying vec3 pos;

void main() {
    if (int(texID) == 0) {
        gl_FragColor = vec4(pos.x + .5, 0, 0, 1);
    }
}
