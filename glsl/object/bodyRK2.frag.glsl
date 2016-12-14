#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_forceTex_1;
uniform sampler2D u_forceTex_2;
uniform sampler2D u_torqueTex_1;
uniform sampler2D u_torqueTex_2;
uniform sampler2D u_linearMomentumTex_1;
uniform sampler2D u_linearMomentumTex_2;
uniform sampler2D u_angularMomentumTex_1;
uniform sampler2D u_angularMomentumTex_2;

uniform int u_particleSide;
uniform float u_diameter;
uniform float u_dt;

varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

mat3 rot_from_quat(vec4 q) {
  return mat3(
    1.0-2.0*q.y*q.y-2.0*q.z*q.z, 2.0*q.x*q.y+2.0*q.w*q.z, 2.0*q.x*q.z-2.0*q.w*q.y,
    2.0*q.x*q.y+2.0*q.w*q.z, 1.0-2.0*q.x*q.x-2.0*q.z*q.z, 2.0*q.y*q.z+2.0*q.w*q.x,
    2.0*q.x*q.z+2.0*q.w*q.y, 2.0*q.y*q.z-2.0*q.w*q.x, 1.0-2.0*q.x*q.x-2.0*q.y*q.y
  );
}

vec4 quat_mult(vec4 q1, vec4 q2) {
  vec4 qr;
  qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
  qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
  qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
  qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
  return qr;
}

mat3 transpose(mat3 m) {
  return mat3(m[0][0], m[1][0], m[2][0],
              m[0][1], m[1][1], m[2][1],
              m[0][2], m[1][2], m[2][2]);
}

const float EPSILON = 0.0000001;

void main() {
    vec4 bodyPosTexel = texture2D(u_bodyPosTex, v_uv);
    float startIndex = bodyPosTexel.w;
    float mass = texture2D(u_posTex, getUV(int(startIndex), u_particleSide)).w;
    vec3 bodyPos = bodyPosTexel.xyz;

    vec4 bodyRot = texture2D(u_bodyRotTex, v_uv);

    vec3 force_1 = texture2D(u_forceTex_1, v_uv).xyz;
    vec3 force_2 = texture2D(u_forceTex_2, v_uv).xyz;

    vec3 torque_1 = texture2D(u_torqueTex_1, v_uv).xyz;
    vec3 torque_2 = texture2D(u_torqueTex_2, v_uv).xyz;
    
    vec4 linearMomentumTexel_1 = texture2D(u_linearMomentumTex_1, v_uv);
    float numParticles = linearMomentumTexel_1.w;
    vec3 linearMomentum_1 = texture2D(u_linearMomentumTex_1, v_uv).xyz;

    vec4 linearMomentumTexel_2 = texture2D(u_linearMomentumTex_2, v_uv);
    vec3 linearMomentum_2 = texture2D(u_linearMomentumTex_2, v_uv).xyz;

    vec3 linearVel_1 = linearMomentum_1 / (numParticles * mass);
    vec3 linearVel_2 = linearMomentum_2 / (numParticles * mass);

    vec3 angularMomentum_1 = texture2D(u_angularMomentumTex_1, v_uv).xyz;
    vec3 angularMomentum_2 = texture2D(u_angularMomentumTex_2, v_uv).xyz;


    vec3 newPos = bodyPos + ((u_dt / 2.0) * (linearVel_1 + linearVel_2));

    float inverseMomentComponent = 6.0/((numParticles * mass) * (4.0 * u_diameter * u_diameter));
    mat3 inverseMomentOfInertia = mat3(
        inverseMomentComponent, 0.0, 0.0,
        0.0, inverseMomentComponent, 0.0,
        0.0, 0.0, inverseMomentComponent
    );
    mat3 bodyRotMatrix = rot_from_quat(normalize(bodyRot));
    mat3 inverseInertiaTensor = bodyRotMatrix * inverseMomentOfInertia * transpose(bodyRotMatrix);
    vec3 angularVelocity_1 = inverseInertiaTensor * angularMomentum_1;
    vec3 angularVelocity_2 = inverseInertiaTensor * angularMomentum_2;
    vec3 theta = ((angularVelocity_1 + angularVelocity_2) / 2.0) * u_dt / 2.0;
    float angle = length(theta);
    float s;
    vec4 deltaQuat;
    if (angle * angle * angle * angle / 24.0 < EPSILON) {
        deltaQuat.w = 1.0 - angle * angle / 2.0;
        s = 1.0 - angle * angle / 6.0;
    }
    else {
        deltaQuat.w = cos(angle);
        s = sin(angle) / angle;
    }
    deltaQuat.xyz = theta * s;
    vec4 newRot = quat_mult(deltaQuat, bodyRot);

    vec3 newLinearMomentum = linearMomentum_1 + ((u_dt / 2.0) * (force_1 + force_2));
    vec3 newAngularMomentum = angularMomentum_1 + ((u_dt / 2.0) * (torque_1 + torque_2));

    gl_FragData[0] = vec4(newPos, startIndex);
    gl_FragData[1] = newRot;
    gl_FragData[2] = vec4(force_1, 1.0);
    gl_FragData[3] = vec4(torque_1, 1.0);
    gl_FragData[4] = vec4(newLinearMomentum, numParticles);
    gl_FragData[5] = vec4(newAngularMomentum, 0.0);
}
