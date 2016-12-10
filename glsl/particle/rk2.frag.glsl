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
    int index = int(texture2D(u_relPosTex, v_uv).w);
    if (index == -1) {
        vec3 pos = texture2D(u_posTex, v_uv).xyz;
        vec3 vel_1 = texture2D(u_velTex1, v_uv).xyz;
        vec3 force_1 = texture2D(u_forceTex1, v_uv).xyz;
        vec3 vel_2 = texture2D(u_velTex2, v_uv).xyz;
        vec3 force_2 = texture2D(u_forceTex2, v_uv).xyz;

        vec3 newPos = pos + ((u_dt / 2.0) * (vel_1 + vel_2));
        vec3 newVel = vel_1 + ((u_dt / 2.0) * (force_1 + force_2));

    	//Update position and velocity
        gl_FragData[0] = vec4(newPos, 1.0);
        gl_FragData[1] = vec4(newVel, 1.0);
    }
}
