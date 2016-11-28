#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform int u_side;

varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {


    // Spring coefficient
    float k = 50.0;
    // Damping coefficient
    float n = 0.5;
    // Particle diameter
    float d = 0.2;

    vec3 spring_total = vec3(0.0);
    vec3 damping_total = vec3(0.0);
    vec3 pos = texture2D(u_posTex, v_uv).xyz;
    vec3 vel = texture2D(u_velTex, v_uv).xyz;

    float dt = 0.01;
    vec3 nextPos = pos + vel * dt;

    // Naive loop through all particles
    // Hack because WebGL cannot compare loop index to non-constant expression
    // Maximum of 1024x1024 = 1048576 for now
    for (int i = 0; i < 1048576; i++) {
        if (i == u_side * u_side)
            break;

        vec2 uv = getUV(i, u_side);

        vec3 p_pos = texture2D(u_posTex, uv).xyz;
        if (length(p_pos - pos) < 0.001)
            continue;
        vec3 p_vel = texture2D(u_velTex, uv).xyz;

        vec3 rel_pos = p_pos - pos;
        vec3 rel_vel = p_vel - vel;
        if (length(rel_pos) < d) {
            spring_total += -k * (d - length(rel_pos)) * normalize(rel_pos);
            damping_total += n * rel_vel;
        }
    }

    gl_FragData[2] = vec4(spring_total + damping_total, 1.0); //force output


}
