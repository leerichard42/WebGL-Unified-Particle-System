#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_bodyForceTex;
uniform sampler2D u_bodyTorqueTex;
uniform sampler2D u_linearMomentumTex;
uniform sampler2D u_angularMomentumTex;
uniform int u_particleSide;

varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    vec4 bodyPosTexel = texture2D(u_bodyPosTex, v_uv);
    vec4 linearMomentumTexel = texture2D(u_linearMomentumTex, v_uv);
    vec3 bodyPos = bodyPosTexel.xyz;
    float startIndex = bodyPosTexel.w;
    float numParticles = linearMomentumTexel.w;

    vec3 totalForce = vec3(0.0);
    vec3 totalTorque = vec3(0.0);
    for (int i = 0; i < 1048576; i++) {
        if (i < int(startIndex))
            continue;
        if (i == int(startIndex + numParticles))
            break;

        vec2 uv = getUV(i, u_particleSide);
        vec3 pos = texture2D(u_posTex, uv).xyz;
        vec3 force = texture2D(u_forceTex, uv).xyz;
        totalForce += force;
        vec3 rel_pos = pos - bodyPos;
        totalTorque += cross(rel_pos, force);
    }

    gl_FragData[0] = bodyPosTexel;
    gl_FragData[1] = texture2D(u_bodyRotTex, v_uv);
//    gl_FragData[2] = texture2D(u_bodyForceTex, v_uv);
//    gl_FragData[3] = texture2D(u_bodyTorqueTex, v_uv);
    gl_FragData[2] = vec4(totalForce, 1.0);
    gl_FragData[3] = vec4(totalTorque, 1.0);
    gl_FragData[4] = linearMomentumTexel;
    gl_FragData[5] = texture2D(u_angularMomentumTex, v_uv);
}
