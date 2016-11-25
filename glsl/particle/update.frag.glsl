#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_forceTex;
uniform int u_side;

varying vec2 v_uv;

void main() {
    vec4 pos = texture2D(u_posTex, v_uv);
    vec4 vel = texture2D(u_velTex, v_uv);
    vec4 force = texture2D(u_forceTex, v_uv);

    vel += force;

    // Write velocity
    gl_FragData[1] = vel;
	gl_FragData[0] = vec4(pos.xyz + vel.xyz, 1.0);
}
