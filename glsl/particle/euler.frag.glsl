#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform sampler2D u_relPosTex;
uniform float u_diameter;
uniform float u_dt;

varying vec2 v_uv;

void main() {
    int index = int(texture2D(u_relPosTex, v_uv).w);
    if (index == -1) {
        vec3 pos = texture2D(u_posTex, v_uv).xyz;
        vec3 vel = texture2D(u_velTex, v_uv).xyz;
        vec3 force = texture2D(u_forceTex, v_uv).xyz;

        //Check boundary conditions
        vec3 newPos = pos + vel * u_dt;

        //Update velocity
        vec3 newVel = vel + force * u_dt;

        //Update position and velocity
        gl_FragData[0] = vec4(newPos, 1.0);
        gl_FragData[1] = vec4(newVel, 1.0);
    }
}
