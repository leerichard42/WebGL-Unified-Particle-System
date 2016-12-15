#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_relPosTex;
uniform float u_dt;

varying vec2 v_uv;

void main() {
    vec4 posTexel = texture2D(u_posTex, v_uv);
    vec4 velTexel = texture2D(u_velTex, v_uv);
    vec4 forceTexel = texture2D(u_forceTex, v_uv);
    vec4 relPosTexel = texture2D(u_relPosTex, v_uv);
    int index = int(relPosTexel.w);
    int isActive = int(velTexel.w);
//    int isActive = 1;
    if (index == -1 && isActive == 1) {
        vec3 pos = posTexel.xyz;
        vec3 vel = velTexel.xyz;
        vec3 force = forceTexel.xyz;
        float mass = posTexel.w;

        vec3 newPos = pos + vel * u_dt;
        vec3 newVel = vel + (force / mass) * u_dt;

        //Update position and velocity
        gl_FragData[0] = vec4(newPos, mass);
        gl_FragData[1] = vec4(newVel, velTexel.w);
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
