#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_bodyPosTex;
uniform sampler2D u_linearVelTex1;
uniform sampler2D u_forceTex1;
uniform sampler2D u_linearVelTex2;
uniform sampler2D u_forceTex2;
uniform int u_particleSide;
uniform float u_diameter;
uniform float u_dt;

varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    float startIndex = texture2D(u_bodyPosTex, v_uv).w;
    float numParticles = texture2D(u_linearVelTex1, v_uv).w;

    vec3 bodyPos = texture2D(u_bodyPosTex, v_uv).xyz;
    vec3 linearVel1 = texture2D(u_linearVelTex1, v_uv).xyz;
    vec3 linearVel2 = texture2D(u_linearVelTex2, v_uv).xyz;

    vec3 force_1 = vec3(0.0);
    vec3 force_2 = vec3(0.0);
    for (int i = 0; i < 1048576; i++) {
        if (i < int(startIndex) || i == int(startIndex + numParticles))
            break;

        vec2 uv = getUV(i, u_particleSide);
        force_1 += texture2D(u_forceTex1, uv).xyz;
        force_2 += texture2D(u_forceTex2, uv).xyz;
    }

    vec3 newPos = bodyPos + ((u_dt / 2.0) * (linearVel1 + linearVel2));
    vec3 newVel = linearVel1 + ((u_dt / 2.0) * (force_1 + force_2) / numParticles);

    //Update position and velocity
    gl_FragData[0] = vec4(newPos, startIndex);
    gl_FragData[2] = vec4(newVel, numParticles);
}
