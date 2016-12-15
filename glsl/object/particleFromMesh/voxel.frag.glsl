#version 100
#extension GL_EXT_draw_buffers: enable

precision highp float;
precision highp int;

uniform sampler2D u_tex0;
uniform sampler2D u_tex1;
uniform mat4 u_cameraMat;
uniform mat4 u_cameraMatInv;
uniform float u_gridSideLength;
uniform float u_gridTexSideLength;   
uniform float u_gridWorldBounds;
uniform vec2 u_gridWorldLowerLeft;   
// uniform float u_gridTexTileDimensions;    

varying vec2 v_uv;

vec3 voxelIndexFromUV(vec2 uv) {
    vec2 pixel = floor(uv * u_gridTexSideLength);
    float idx = pixel.x + pixel.y * u_gridTexSideLength;
    
    // NDC
    vec3 pos = vec3(mod(idx, u_gridSideLength),
                    mod(floor(idx / u_gridSideLength), u_gridSideLength),
                    floor(idx / pow(u_gridSideLength, 2.)));

    pos = pos / u_gridSideLength;
    pos = pos * 2. * u_gridWorldBounds;
    pos = pos + vec3(u_gridWorldLowerLeft, -u_gridWorldBounds);

    return pos;
}

void main() {
    vec3 voxelIdx = voxelIndexFromUV(v_uv);
    vec2 voxelUV = (u_cameraMat * vec4(voxelIdx, 1)).xy;
    //vec3 tex0Depth = 
    gl_FragData[2] = vec4(voxelUV, 1);
}
