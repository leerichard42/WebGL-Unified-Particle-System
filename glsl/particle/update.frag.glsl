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
    vec3 force = vec3(0.0, -9.8, 0.0);

    // Spring coefficient
    float k = 50.0;
    // Friction coefficient
    float u = 1.0;
    // Particle diameter
    float d = 0.15;

    //Timestep
    float dt = 0.01;

    //Predict next position
    vec3 newPos = pos + vel * dt;

    //Boundary conditions
    if (newPos.y < d / 2.0) {
        vel.y = 0.0;
        // Negate gravity and apply friction if contacting ground
        force.y += 9.8;
        vec3 dir = normalize(vel);
        force += -1.0 * dir * u;
        force.y += k * (d / 2.0 - newPos.y);
    }
     float bound = 0.3;
     if (abs(newPos.x) > bound) {
        vec3 dir = normalize(vel);
        force += -1.0 * dir * u;
        force.x += k * (bound - abs(newPos.x)) * sign(newPos.x);
     }
     if (abs(newPos.z) > bound) {
        vec3 dir = normalize(vel);
        force += -1.0 * dir * u;
        force.z += k * (bound - abs(newPos.z)) * sign(newPos.z);
     }

     force += p_force;

     vec3 newVel = vel + force * dt;

    //Update position and velocity
	gl_FragData[0] = vec4(newPos, 1.0);
    gl_FragData[1] = vec4(newVel, 1.0);
}
