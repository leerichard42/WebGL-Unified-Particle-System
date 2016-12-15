#version 100
#extension GL_EXT_frag_depth : enable

precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform vec3 u_cameraPos;
uniform float u_fovy;
uniform float u_diameter;
uniform sampler2D u_relPosTex;

varying vec4 v_eyePos;
varying vec2 v_uv;

float rand(float f){
    vec2 co = vec2(f);
    return clamp(fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453), 0.1, 0.7);
}

void main() {
    vec2 uv = 2.0 * gl_PointCoord - 1.0;
    if (length(uv) > 1.0) {
        discard;
    }
    vec3 normal = vec3(uv, -sqrt(1.0 - dot(uv, uv)));

    // The 15.0 is a hacky constant - it should be normal * radius
    // But was unsure about how to translate the radius value from world to eye space
    vec4 pixelPos = vec4(v_eyePos.xyz + normal * u_diameter / 15.0, 1.0);

    vec4 relPos = texture2D(u_relPosTex, v_uv);
    vec3 color = vec3(0.0, 0.5, 0.7);
    if (relPos.w > -1.0) {
        if (relPos.w == 0.0) {
            color = vec3(0.3, 0.6, 0.0);
        }
        else {
            color = vec3(rand(relPos.w), rand(relPos.w+1.0), rand(relPos.w+2.0));
        }
}
    vec3 diffuse = 0.1 + max(0.0, dot(normal, vec3(1.0, -1.0, -1.0))) * color;
    gl_FragData[0] = vec4(diffuse, 1);

    gl_FragDepthEXT  =  pixelPos.z * gl_FragCoord.w;
}
