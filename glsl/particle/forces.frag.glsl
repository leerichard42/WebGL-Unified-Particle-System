#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_gridTex;
uniform int u_particleSide;
uniform float u_diameter;
uniform float u_dt;
uniform float u_bound;

// Grid uniforms
uniform int u_gridSideLength;
uniform int u_gridNumCellsPerSide;
uniform int u_gridTexSize;
uniform int u_gridTexTileDimensions;

varying vec2 v_uv;

vec2 uvFrom3D(vec3 pos) {
    float u = pos.x + float(u_gridNumCellsPerSide) * (pos.z - float(u_gridTexTileDimensions) * floor(pos.z / float(u_gridTexTileDimensions)));

    float v = pos.y + float(u_gridNumCellsPerSide) * floor(pos.x / float(u_gridTexTileDimensions));

    return vec2(u, v) / float(u_gridTexSize) - vec2(1.);
}

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    // Spring coefficient
    float k = 400.0;
    float bounds_k = 200.0;

    // Damping coefficient
    float n = 4.0;
    // Friction coefficient
    float u = 1.0;

    vec3 spring_total = vec3(0.0);
    vec3 damping_total = vec3(0.0);
    vec3 pos = texture2D(u_posTex, v_uv).xyz;
    vec3 vel = texture2D(u_velTex, v_uv).xyz;

    // // Naive loop through all particles
    // // Hack because WebGL cannot compare loop index to non-constant expression
    // // Maximum of 1024x1024 = 1048576 for now
    // for (int i = 0; i < 1048576; i++) {
    //     if (i == u_particleSide * u_particleSide)
    //         break;

    //     vec2 uv = getUV(i, u_particleSide);

    //     vec3 p_pos = texture2D(u_posTex, uv).xyz;
    //     if (length(p_pos - pos) < 0.001)
    //         continue;
    //     vec3 p_vel = texture2D(u_velTex, uv).xyz;

    //     vec3 rel_pos = p_pos - pos;
    //     vec3 rel_vel = p_vel - vel;
    //     if (length(rel_pos) < u_diameter) {
    //         spring_total += -k * (u_diameter - length(rel_pos)) * normalize(rel_pos);
    //         damping_total += n * rel_vel;
    //     }
    // }

    // Loop through 27 cells in grid
    vec3 voxelIndex = (vec3(pos) - vec3(-u_gridSideLength, -u_gridSideLength, -u_gridSideLength)) / u_diameter;
    for (int i = -1; i < 2; i++) {
        for (int i2 = -1; i2 < 2; i2++) {
            for (int i3 = -1; i3 < 2; i3++) {
                vec3 neighborVoxelIndex = voxelIndex + vec3(i, i2, i3);
                if (neighborVoxelIndex.x < 0. || neighborVoxelIndex.y < 0. || neighborVoxelIndex.z < 0.) {
                    continue;
                }
                if (neighborVoxelIndex.x >= float(u_gridNumCellsPerSide) || neighborVoxelIndex.y >= float(u_gridNumCellsPerSide) ||
                    neighborVoxelIndex.z >= float(u_gridNumCellsPerSide)) {
                        continue;
                }

                vec2 neighborGridUV = uvFrom3D(neighborVoxelIndex);
                
                vec4 p_idx = texture2D(u_gridTex, neighborGridUV);
                for (int c = 0; c < 4; c++) {
                    if (p_idx[c] == 0.) {
                        continue;
                    }
                    vec2 uv = getUV(int(p_idx[c]), u_particleSide);

                    vec3 p_pos = texture2D(u_posTex, uv).xyz;
                    if (length(p_pos - pos) < 0.001)
                        continue;
                    vec3 p_vel = texture2D(u_velTex, uv).xyz;

                    vec3 rel_pos = p_pos - pos;
                    vec3 rel_vel = p_vel - vel;
                    if (length(rel_pos) < u_diameter) {
                        spring_total += -k * (u_diameter - length(rel_pos)) * normalize(rel_pos);
                        damping_total += n * rel_vel;
                    }
                }
            }
        }
    }

    vec3 force = spring_total + damping_total;
    force.y -= 9.8;

    //Predict next position
    vec3 newPos = pos + vel * u_dt;

    bool applyFriction = false;
    //Boundary conditions
    if (newPos.y < u_diameter / 2.0) {
        // Negate gravity if contacting ground
        force.y += 9.8;
        applyFriction = true;
    }
    if (abs(newPos.x) > u_bound) {
        force.x += bounds_k * (u_bound - abs(newPos.x)) * sign(newPos.x);
        applyFriction = true;
    }
    if (abs(newPos.z) > u_bound) {
        force.z += bounds_k * (u_bound - abs(newPos.z)) * sign(newPos.z);
        applyFriction = true;
    }
    //Apply friction if contacting the boundary
    vec3 dir = normalize(vel);
    if(applyFriction && length(dir) > 0.0) {
        force += -1.0 * dir * u;
    }

    gl_FragData[2] = vec4(force, 1.0); //force output
}
