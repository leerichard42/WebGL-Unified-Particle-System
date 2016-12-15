#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_gridTex;
uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_linearMomentumTex;
uniform sampler2D u_angularMomentumTex;
uniform sampler2D u_relPosTex;
uniform sampler2D u_bodyForceTex;
uniform sampler2D u_bodyTorqueTex;

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
            gl_FragColor = abs(force);
        } else if (v_uv.x > 3./num_tex) {
            vec4 grid = texture2D(u_gridTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0));
            gl_FragColor = vec4(grid.rgb * .005, 1);
        }
    }
    else {
        if (v_uv.x < 1./num_tex) {
            vec4 bodyPos = texture2D(u_bodyPosTex, vec2(v_uv.x * num_tex, v_uv.y * 2.0 - 1.0));
            gl_FragColor = vec4(bodyPos.xyz / 4.0, 1.0);
//            gl_FragColor = vec4(vec3(bodyPos.w) / 36.0, 1.0);
        } else if (v_uv.x > 1./num_tex && v_uv.x < 2./num_tex) {
            vec4 bodyRot = texture2D(u_bodyRotTex, vec2(v_uv.x * num_tex - 1.0, v_uv.y * 2.0 - 1.0));
            gl_FragColor = bodyRot;
        } else if (v_uv.x > 2./num_tex && v_uv.x < 3./num_tex) {
//            vec4 vel = texture2D(u_linearMomentumTex, vec2(v_uv.x * num_tex - 2.0, v_uv.y * 2.0 - 1.0));
//            gl_FragColor = vec4(abs(vel).xyz, 1.0);

            vec4 torque = texture2D(u_bodyTorqueTex, vec2(v_uv.x * num_tex - 2.0, v_uv.y * 2.0 - 1.0));
            gl_FragColor = vec4(abs(torque).xyz, 1.0);
//        } else if (v_uv.x > 3./num_tex) {
//            vec4 momentum = texture2D(u_angularMomentumTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0 - 1.0));
//            gl_FragColor = vec4(abs(momentum).xyz, 1.0);

            vec4 relPos = texture2D(u_relPosTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0 - 1.0));
//            gl_FragColor = vec4(abs(relPos.xyz), 1.0);
            gl_FragColor = vec4(vec3((relPos.w+1.0)/4.0), 1.0);

//            vec4 pos = texture2D(u_posTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0 - 1.0));
//            gl_FragColor = pos;

//            vec4 force = texture2D(u_bodyForceTex, vec2(v_uv.x * num_tex - 3.0, v_uv.y * 2.0 - 1.0));
//            gl_FragColor = vec4(abs(force.xyz), 1.0);
        }
    }

}
