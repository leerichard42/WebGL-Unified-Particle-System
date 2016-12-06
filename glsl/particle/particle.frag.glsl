#version 100
#extension GL_EXT_frag_depth : enable

precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform float u_diameter;
varying vec3 v_eyePos;

void main() {
    vec2 uv = 2.0 * gl_PointCoord - 1.0;
    if (length(uv) > 1.0) {
        discard;
    }
    vec3 normal = vec3(uv, -sqrt(1.0 - dot(uv, uv)));

    // The 15.0 is a hacky constant - it should be normal * radius
    // But was unsure about how to translate the radius value from world to eye space
    vec4 pixelPos = vec4(v_eyePos + normal * u_diameter / 15.0, 1.0);

    vec3 diffuse = 0.1 + max(0.0, dot(normal, vec3(1.0, -1.0, -1.0))) * vec3(0.0, 0.5, 0.7);
    gl_FragData[0] = vec4(diffuse, 1);

    gl_FragDepthEXT  =  pixelPos.z * gl_FragCoord.w;
}
