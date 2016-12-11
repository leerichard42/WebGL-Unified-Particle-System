#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_gridTex;
uniform sampler2D u_bodyPosTex;

varying vec2 v_uv;

void main() {
    float num_tex = 4.0;

    if (v_uv.y < 0.5) {
        if (v_uv.x < 1./num_tex) {
            vec4 pos = texture2D(u_posTex, vec2(v_uv.x * num_tex, v_uv.y * 2.0));
            gl_FragColor = pos;
        } else if (v_uv.x > 1./num_tex && v_uv.x < 2./num_tex) {
            vec4 vel = texture2D(u_velTex, vec2(v_uv.x * num_tex - 1.0, v_uv.y * 2.0));
            gl_FragColor = abs(vel);
        } else if (v_uv.x > 2./num_tex && v_uv.x < 3./num_tex) {
            vec4 force = texture2D(u_forceTex, vec2(v_uv.x * num_tex - 2.0, v_uv.y * 2.0));
            gl_FragColor = abs(force) * 0.9;
        } else if (v_uv.x > 3./num_tex) {
            vec4 grid = texture2D(u_gridTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0));
            gl_FragColor = vec4(grid.rgb * .005, 1);
        }
    }
    else {
        if (v_uv.x < 1./num_tex) {
            vec4 bodyPos = texture2D(u_bodyPosTex, vec2(v_uv.x * num_tex, v_uv.y * 2.0));
            gl_FragColor = vec4(bodyPos.xyz, 1.0);
        }
        else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
//        } else if (v_uv.x > 1./num_tex && v_uv.x < 2./num_tex) {
//            vec4 vel = texture2D(u_velTex, vec2(v_uv.x * num_tex - 1.0, v_uv.y * 2.0));
//            gl_FragColor = abs(vel);
//        } else if (v_uv.x > 2./num_tex && v_uv.x < 3./num_tex) {
//            vec4 force = texture2D(u_forceTex, vec2(v_uv.x * num_tex - 2.0, v_uv.y * 2.0));
//            gl_FragColor = abs(force) * 0.9;
//        } else if (v_uv.x > 3./num_tex) {
//            vec4 grid = texture2D(u_gridTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0));
//            gl_FragColor = grid;
//        }
    }

}
