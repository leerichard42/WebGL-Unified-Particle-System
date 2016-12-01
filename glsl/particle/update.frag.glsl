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
    vec3 pos = texture2D(u_posTex, v_uv).xyz;
    vec3 vel = texture2D(u_velTex, v_uv).xyz;
    vec3 p_force = texture2D(u_forceTex, v_uv).xyz;

    // Particle diameter
    float d = 0.15;
    //Timestep
    float dt = 0.01;

    //Check boundary conditions
    vec3 newPos = pos + vel * dt;
    if (newPos.y < d / 2.0) {
        newPos.y = d / 2.0;
        vel.y = 0.0;
    }
    float bound = 0.5;
    if (abs(newPos.x) > bound) {
//        newPos.x = bound * sign(newPos.x);
//        vel.x *= -0.1;
    }
    if (abs(newPos.z) > bound) {
//        newPos.z = bound * sign(newPos.z);
//        vel.z *= -0.1;
    }
    //Update velocity
    vec3 newVel = vel + p_force * dt;

    //Update position and velocity
    gl_FragData[0] = vec4(newPos, 1.0);
    gl_FragData[1] = vec4(newVel, 1.0);
    }
