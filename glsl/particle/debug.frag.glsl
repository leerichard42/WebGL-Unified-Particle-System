#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform int u_side;

varying vec2 v_uv;

void main() {

    if (v_uv.x > (.333)) {
        if (v_uv.x > .667) {
            vec4 force = texture2D(u_forceTex, vec2(v_uv.x * 3.0 - 2.0, v_uv.y));
            gl_FragColor = force * 1000000.0;
        } else {
            vec4 vel = texture2D(u_velTex, vec2(v_uv.x * 3.0 - 1.0, v_uv.y));
            gl_FragColor = vel * 10000.0;
        }
    } else {
        vec4 pos = texture2D(u_posTex, vec2(v_uv.x * 3.0, v_uv.y));
        gl_FragColor = pos;
    }
}