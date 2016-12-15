#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex1;
uniform sampler2D u_forceTex1;
uniform sampler2D u_velTex2;
uniform sampler2D u_forceTex2;
uniform sampler2D u_relPosTex;
uniform float u_diameter;
uniform float u_dt;

varying vec2 v_uv;

void main() {
    vec4 posTexel = texture2D(u_posTex, v_uv);
    vec4 velTexel_1 = texture2D(u_velTex1, v_uv);
    vec4 velTexel_2 = texture2D(u_velTex2, v_uv);
    vec4 forceTexel_1 = texture2D(u_forceTex1, v_uv);
    vec4 forceTexel_2 = texture2D(u_forceTex2, v_uv);
    vec4 relPosTexel = texture2D(u_relPosTex, v_uv);
    int index = int(texture2D(u_relPosTex, v_uv).w);
    int isActive = int(velTexel_1.w);
//    int isActive = 1;
    if (index == -1 && isActive == 1) {
        vec3 pos = posTexel.xyz;
        vec3 vel_1 = velTexel_1.xyz;
        vec3 force_1 = forceTexel_1.xyz;
        vec3 vel_2 = velTexel_2.xyz;
        vec3 force_2 = forceTexel_2.xyz;
        float mass = posTexel.w;

        vec3 newPos = pos + ((u_dt / 2.0) * (vel_1 + vel_2));
        vec3 newVel = vel_1 + ((u_dt / 2.0) * (force_1/mass + force_2/mass));

    	//Update position and velocity
        gl_FragData[0] = vec4(newPos, mass);
        gl_FragData[1] = vec4(newVel, velTexel_1.w);
        gl_FragData[2] = texture2D(u_forceTex1, v_uv);
        gl_FragData[3] = relPosTexel;
    }
    else {
        gl_FragData[0] = posTexel;
        gl_FragData[1] = velTexel_1;
        gl_FragData[2] = forceTexel_1;
        gl_FragData[3] = relPosTexel;
    }
}
