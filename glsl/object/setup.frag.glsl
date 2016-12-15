#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

//run on each particle, write to A particle pos/vel tex

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_relPosTex;
uniform sampler2D u_linearMomentumTex;
uniform sampler2D u_angularMomentumTex;
uniform int u_bodySide;
uniform float u_time;

varying vec2 v_uv;

vec4 quat_from_axis_angle(vec3 axis, float angle) {
  vec4 qr;
  float half_angle = (angle * 0.5) * 3.14159 / 180.0;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec4 quat_conj(vec4 q) {
  return vec4(-q.x, -q.y, -q.z, q.w);
}

vec4 quat_mult(vec4 q1, vec4 q2) {
  vec4 qr;
  qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
  qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
  qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
  qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
  return qr;
}

vec3 rotate_pos(vec3 pos, vec4 q) {
    return quat_mult(quat_mult(q, vec4(pos, 0.0)), quat_conj(q)).xyz;
}

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

// Calculate the position and velocity of each rigid body particle in world space
void main() {
    vec4 posTexel = texture2D(u_posTex, v_uv);
    vec4 velTexel = texture2D(u_velTex, v_uv);
    vec4 forceTexel = texture2D(u_forceTex, v_uv);
    vec4 relPosTexel = texture2D(u_relPosTex, v_uv);
    int index = int(relPosTexel.w);
    if (index > -1) {
        vec2 uv = getUV(index, u_bodySide);
        vec4 bodyPos = texture2D(u_bodyPosTex, uv);
        vec4 bodyRot = texture2D(u_bodyRotTex, uv);
        vec4 linearMomentumTexel = texture2D(u_linearMomentumTex, uv);
        vec3 linearMomentum = linearMomentumTexel.xyz;
        float mass = posTexel.w;
        float numParticles = linearMomentumTexel.w;
        vec3 linearVel = linearMomentum / (numParticles * mass);
        vec3 angularMomentum = texture2D(u_angularMomentumTex, uv).xyz;

        vec3 currRelPos = rotate_pos(relPosTexel.xyz, bodyRot);
        vec3 pos = bodyPos.xyz + vec3(0.0, 0.0, 0.7 * sin(u_time/2.0)) + currRelPos;
        vec3 vel = linearVel + cross(angularMomentum, currRelPos);
        gl_FragData[0] = vec4(pos, mass);
        gl_FragData[1] = vec4(vel, 1.0);
        gl_FragData[2] = forceTexel;
        gl_FragData[3] = relPosTexel;
    }
    else {
        gl_FragData[0] = posTexel;
        gl_FragData[1] = velTexel;
        gl_FragData[2] = forceTexel;
        gl_FragData[3] = relPosTexel;
    }
}
