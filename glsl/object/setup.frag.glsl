#version 100
precision highp float;
precision highp int;

//run on each particle, write to A particle pos/vel tex

uniform sampler2D u_bodyPosTex;
uniform sampler2D u_bodyRotTex;
uniform sampler2D u_relPosTex;
//linearVelTex
//angularVelTex

varying vec2 v_uv;

// Calculate the position and velocity of each rigid body particle in world space
void main() {
    vec3 bodyPos = texture2D(u_bodyPosTex, v_uv).xyz;
    vec3 bodyVel = texture2D(u_bodyRotTex, v_uv).xyz;
    vec4 relPos = texture2D(u_relPosTex, v_uv);
    int index = int(relPos.w);

    if (index > -1) {
        vec3 pos = bodyPos + relPos.xyz;
        gl_FragData[0] = vec4(pos, 1.0);
//        gl_FragData[1] = vec4(vel, 1.0);
    }
}
