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
uniform float u_dt;

varying vec2 v_uv;

void main() {
    vec3 pos = texture2D(u_posTex, v_uv).xyz;
    vec3 bodyPos = texture2D(u_bodyPosTex, v_uv).xyz;
    vec3 linearVel = texture2D(u_linearVelTex, v_uv).xyz;
    float startIndex = texture2D(u_bodyPosTex, v_uv).w;
    float numParticles = texture2D(u_linearVelTex, v_uv).w;

    vec3 linearMomentum = linearVel * numParticles;
    for (int i = 0; i < 1048576; i++) {
        if (i == int(startIndex + numParticles))
            break;
        vec3 force = texture2D(u_forceTex, v_uv).xyz;
        linearMomentum += force * u_dt;
    }

    //update position
    //pos = pos + linearVel * u_dt
    gl_FragData[0] = vec4(vec3(bodyPos + linearVel * u_dt), startIndex);

    //update rotation

    //update linear velocity
    //linearVel = linearMomentum / numParticles
    gl_FragData[2] = vec4(linearMomentum / numParticles, numParticles);

    //update angular velocity
}
