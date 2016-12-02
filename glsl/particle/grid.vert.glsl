#version 100
precision highp float;
precision highp int;

void main() {
    //gl_Position = u_cameraMat * vec4(a_position, 1.0);
}

/*
In the VS, the particle position is read from the particle position texture, 

vec4 pos = texture2D(u_posTex, v_uv);

and the voxel index is calculated with Equation 9. 

uniform1 d = .1
uniform3v s = -grid corner
g = (p - s) / d 

Then the coordinates in the grid texture are calculated from the voxel index (as described in Section 29.2.2), 

3d -> 2d

the vertex position is set to the grid coordinates, 

gl_Position = pos ?

and the color is set to the particle index

grid.frag.glsl
    gl_FragColor = vec4(a_idx, 0, 0, 1);
*/