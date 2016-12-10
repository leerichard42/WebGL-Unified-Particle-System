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
uniform sampler2D u_linearVelTex;
uniform sampler2D u_angularMomentumTex;
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

void main() {
    vec3 bodyPos = texture2D(u_bodyPosTex, v_uv).xyz;
    vec3 linearVel = texture2D(u_linearVelTex, v_uv).xyz;
    vec3 angularMomentum = texture2D(u_angularMomentumTex, v_uv).xyz;
    float startIndex = texture2D(u_bodyPosTex, v_uv).w;
    float numParticles = texture2D(u_linearVelTex, v_uv).w;

    vec3 linearMomentum = linearVel * numParticles;
    bool groundContact = false;
    float minContact = 0.0;
    vec3 totalForce = vec3(0.0);
    vec3 newAngularMomentum = angularMomentum;

    for (int i = 0; i < 1048576; i++) {
        if (i < int(startIndex) || i == int(startIndex + numParticles))
            break;

        vec2 uv = getUV(i, u_particleSide);
        vec3 pos = texture2D(u_posTex, uv).xyz;
        vec3 vel = texture2D(u_velTex, uv).xyz;
        vec3 force = texture2D(u_forceTex, uv).xyz;

        if (pos.y < u_diameter / 2.0) {
            groundContact = true;
            if (pos.y < minContact) {
                minContact = pos.y;
            }
        }

        totalForce += force;
        vec3 rel_pos = pos - bodyPos;
        newAngularMomentum += cross(rel_pos, force) * u_dt;
    }

//    float u = 1.0;
//    if (groundContact) {
//        totalForce.y += 9.8 * numParticles;
//        totalForce.y += 600.0 * (u_diameter / 2.0 - minContact) * numParticles;
//        totalForce.y -= 40.0 * linearVel.y * numParticles;
//        vec3 dir = normalize(linearVel);
//        totalForce += -1.0 * dir * u;
//    }

    //update position
    vec3 newPos = bodyPos + linearVel * u_dt;
    gl_FragData[0] = vec4(newPos, startIndex);

    //update rotation
    rot_from_quat(vec4(0.0, 0.0, 0.0, 1.0));

    //update linear velocity
    linearMomentum += totalForce * u_dt;
    vec3 newVel = linearMomentum / numParticles;
    gl_FragData[2] = vec4(newVel, numParticles);

    //update angular momentum
    gl_FragData[3] = vec4(newAngularMomentum, 0.0);
}
