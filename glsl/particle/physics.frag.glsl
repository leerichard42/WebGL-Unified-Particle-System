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
    float k = 0.00001;    
    // Damping coefficient
    float n = 0.1;
    // Particle diameter
    float d = 1.0;

    vec4 spring_total = vec4(0.0);
    vec4 damping_total = vec4(0.0);
    vec4 pos = texture2D(u_posTex, v_uv);
    vec4 vel = texture2D(u_velTex, v_uv);
    
    // Naive loop through all particles
    // Hack because WebGL cannot compare loop index to non-constant expression
    for (int i = 0; i < 1000000; i++) {
        if (i == u_side * u_side)
            break;

        vec2 uv = getUV(i, u_side);
        if (uv == v_uv) 
            continue;
        
        vec4 p_pos = texture2D(u_posTex, uv);
        vec4 p_vel = texture2D(u_velTex, uv);

        vec4 r = pos - p_pos;
        if (length(r) < 1.0) {
            spring_total = -k * (d - length(r)) * normalize(r); 
            //damping_total = n * (vel - p_vel);
        }
    }

	gl_FragData[2] = vec4(vec3(spring_total), 1); //force output
}