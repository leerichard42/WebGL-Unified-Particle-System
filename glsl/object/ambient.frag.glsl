#version 100
#extension GL_EXT_frag_depth : enable

precision highp float;
precision highp int;

uniform vec3 u_lightCol;
uniform vec3 u_lightPos;
uniform float u_lightRad;
uniform sampler2D u_posTex;

varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_normal;

vec3 applyNormalMap(vec3 geomnor, vec3 normap) {
    normap = normap * 2.0 - 1.0;
    vec3 up = normalize(vec3(0.001, 1, 0.001));
    vec3 surftan = normalize(cross(geomnor, up));
    vec3 surfbinor = cross(geomnor, surftan);
    return normap.y * surftan + normap.x * surfbinor + normap.z * geomnor;
}

void main() {

    gl_FragColor = vec4(v_normal, 1);  // TODO: perform lighting calculations
    gl_FragDepthEXT  =  v_position.z * gl_FragCoord.w;
}