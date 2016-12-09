#version 100
precision highp float;
precision highp int;

//run on each particle, write to A particle pos/vel tex

uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_relPosTex;
uniform float u_testAngle;
//linearVelTex
//angularVelTex

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

// Calculate the position and velocity of each rigid body particle in world space
void main() {
//    vec3 bodyPos = texture2D(u_bodyPosTex, v_uv).xyz;
//    vec4 bodyRot = texture2D(u_bodyRotTex, v_uv);
    vec3 bodyPos = 0.5 * vec3(sin(u_testAngle / 60.0), 0.0, cos(u_testAngle / 60.0));
    vec4 bodyRot = quat_from_axis_angle(vec3(0.0, 1.0, 0.0), u_testAngle);
    vec4 initRelPos = texture2D(u_relPosTex, v_uv);

    int index = int(initRelPos.w);
    if (index > -1) {
        vec3 currRelPos = rotate_pos(initRelPos.xyz, bodyRot);
        vec3 pos = bodyPos + currRelPos;
//        vec3 vel = linearVel + cross(angularVel, currRelPos);
        gl_FragData[0] = vec4(pos, 1.0);
//        gl_FragData[1] = vec4(vel, 1.0);
    }
}
