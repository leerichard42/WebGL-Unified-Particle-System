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

    // float dt = 0.01;
    float dt = 0.01;
    vec4 newPos = vec4(pos.xyz + vel.xyz * dt, 1.0);
    // vec4 newVel = vel * 0.99 + vec4(0.0, -9.8, 0.0, 1.0) * dt;
    vec4 newVel = vel * 0.99 + force * dt;
    float diameter = 0.1;
    if (newPos.y <= diameter / 2.0) { //distance from particle center to ground is radius
        newPos.y = pos.y;
        newVel.y = 0.0;
    }
    // float bound = 0.5;
    // if (abs(newPos.x) >= bound) { //distance from particle center to ground is radius
    //     newPos.x = pos.x;
    //     newVel.x = 0.0;
    // }
    // if (abs(newPos.z) >= bound) { //distance from particle center to ground is radius
    //     newPos.z = pos.z;
    //     newVel.z = 0.0;
    // }

    //Update position and velocity
	gl_FragData[0] = newPos;
    gl_FragData[1] = newVel;
}
