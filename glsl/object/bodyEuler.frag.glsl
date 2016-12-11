#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

//run on each rigidbody

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_linearMomentumTex;
uniform sampler2D u_angularMomentumTex;
uniform int u_particleSide;
uniform float u_diameter;
uniform float u_dt;

varying vec2 v_uv;

const float EPSILON = 0.0000001;

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

void main() {
    vec3 bodyPos = texture2D(u_bodyPosTex, v_uv).xyz;
    vec4 bodyRot = texture2D(u_bodyRotTex, v_uv);
    vec3 linearMomentum = texture2D(u_linearMomentumTex, v_uv).xyz;
    vec3 angularMomentum = texture2D(u_angularMomentumTex, v_uv).xyz;
    float startIndex = texture2D(u_bodyPosTex, v_uv).w;
    float numParticles = texture2D(u_linearMomentumTex, v_uv).w;

    vec3 totalForce = vec3(0.0);
    vec3 totalTorque = vec3(0.0);
    for (int i = 0; i < 1048576; i++) {
        if (i < int(startIndex) || i == int(startIndex + numParticles))
            break;

        vec2 uv = getUV(i, u_particleSide);
        vec3 pos = texture2D(u_posTex, uv).xyz;
        vec3 vel = texture2D(u_velTex, uv).xyz;
        vec3 force = texture2D(u_forceTex, uv).xyz;
        totalForce += force;
        vec3 rel_pos = pos - bodyPos;
        totalTorque += cross(rel_pos, force);
    }

    float mass = 0.2;
    //update position
    vec3 linearVel = linearMomentum / (numParticles * mass);
    vec3 newPos = bodyPos + linearVel * u_dt;
    gl_FragData[0] = vec4(newPos, startIndex);

    //update rotation
    //use cube moment of inertia for now - 6/(m*s^2)
    float inverseMomentComponent = 6.0/((numParticles * mass) * (4.0 * u_diameter * u_diameter));
    mat3 inverseMomentOfInertia = mat3(
        inverseMomentComponent, 0.0, 0.0,
        0.0, inverseMomentComponent, 0.0,
        0.0, 0.0, inverseMomentComponent
    );
    mat3 bodyRotMatrix = rot_from_quat(normalize(bodyRot));
    mat3 inverseInertiaTensor = bodyRotMatrix * inverseMomentOfInertia * transpose(bodyRotMatrix);
    vec3 angularVelocity = inverseInertiaTensor * angularMomentum;
    vec3 theta = angularVelocity * u_dt / 2.0;
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
    gl_FragData[1] = quat_mult(deltaQuat, bodyRot);

    //update linear velocity
    linearMomentum += totalForce * u_dt;
    gl_FragData[2] = vec4(linearMomentum, numParticles);

    //update angular momentum
    angularMomentum += totalTorque * u_dt;
    gl_FragData[3] = vec4(angularMomentum, 0.0);
}
