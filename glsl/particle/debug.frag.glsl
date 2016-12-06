#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_gridTex;

varying vec2 v_uv;

void main() {
    float num_tex = 4.0;
    
    if (v_uv.x < 1./num_tex) {
        vec4 pos = texture2D(u_posTex, vec2(v_uv.x * num_tex, v_uv.y));
        gl_FragColor = pos;
    } else if (v_uv.x > 1./num_tex && v_uv.x < 2./num_tex) {
        vec4 vel = texture2D(u_velTex, vec2(v_uv.x * num_tex - 1.0, v_uv.y));
        gl_FragColor = abs(vel);
    } else if (v_uv.x > 2./num_tex && v_uv.x < 3./num_tex) {
        vec4 force = texture2D(u_forceTex, vec2(v_uv.x * num_tex - 2.0, v_uv.y));
        gl_FragColor = abs(force) * 0.9;
    } else if (v_uv.x > 3./num_tex) {
        vec4 grid = texture2D(u_gridTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y));
        gl_FragColor = grid;
    }
}
