#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_forceTex1;
uniform sampler2D u_forceTex2;
uniform sampler2D u_torqueTex1;
uniform sampler2D u_torqueTex2;
uniform sampler2D u_linearMomentumTex1;
uniform sampler2D u_linearMomentumTex2;
uniform sampler2D u_angularMomentumTex1;
uniform sampler2D u_angularMomentumTex2;

uniform int u_particleSide;
uniform float u_dt;

varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
//    vec4 bodyPosTexel = texture2D(u_bodyPosTex, v_uv);
//    float startIndex = bodyPosTexel.w;
//    float mass = texture2D(u_posTex, getUV(int(startIndex), u_particleSide)).w;
//    vec3 bodyPos = bodyPosTexel.xyz;
//
//    vec4 linearMomentumTexel1 = texture2D(u_linearMomentumTex1, v_uv);
//    float numParticles = linearMomentumTexel1.w;
//    vec3 linearMomentum1 = texture2D(u_linearMomentumTex1, v_uv).xyz;
//
//    vec4 linearMomentumTexel2 = texture2D(u_linearMomentumTex2, v_uv);
//    vec3 linearMomentum2 = texture2D(u_linearMomentumTex2, v_uv).xyz;
//
//    vec3 linearVel1 = linearMomentum1 / numParticles;
//    vec3 linearVel2 = linearMomentum2 / numParticles;
//
//    float mass = texture2D(u_posTex, getUV(int(startIndex), u_particleSide)).w;
//
//
//    vec3 newPos = bodyPos + ((u_dt / 2.0) * (linearVel1 + linearVel2));
//    vec3 newRot =
//    vec3 newVel = linearVel1 + ((u_dt / 2.0) * (force_1 + force_2) / numParticles);
//
//
//    gl_FragData[0] = vec4(newPos, startIndex);
//    gl_FragData[1] = texture2D(u_bodyRotTex, v_uv);
////    gl_FragData[2] = vec4(newVel, numParticles);
//    gl_FragData[2] = vec4(totalForce, 1.0);
//    gl_FragData[3] = vec4(totalTorque, 1.0);
//
//    gl_FragData[4] = linearMomentumTexel;
//    gl_FragData[5] = texture2D(u_angularMomentumTex, v_uv);
}
