#version 100
precision highp float;
precision highp int;

uniform mat4 u_cameraMat;
uniform sampler2D u_posTex;
uniform sampler2D u_velTex;
uniform sampler2D u_relPosTex;
uniform sampler2D u_bodyPosTex;
uniform int u_side;
uniform int u_bodySide;
uniform float u_diameter;
uniform float u_nearPlaneHeight;

attribute float a_idx;

varying vec3 v_eyePos;
varying vec2 v_uv;

vec2 getUV(int idx, int side) {
    float v = float(idx / side) / float(side);
    float u = float(idx - (idx / side) * side) / float(side);
    return vec2(u, v);
}

void main() {
    int idx = int(a_idx);

    vec2 uv = getUV(idx, u_side);
    vec4 pos = texture2D(u_posTex, uv);
    vec4 vel = texture2D(u_velTex, uv);
    vec4 relPos = texture2D(u_relPosTex, uv);

//    if (relPos.w > -1.0) {
//        vec2 bodyUV = getUV(int(relPos.w), u_bodySide);
//        vec3 bodyPos = texture2D(u_bodyPosTex, bodyUV).xyz;
//        pos.xyz = bodyPos + relPos.xyz;
//    }


    v_eyePos = (u_cameraMat * pos).xyz;
    v_uv = uv;
    gl_Position = u_cameraMat * pos;
	gl_PointSize = (u_nearPlaneHeight * u_diameter) / gl_Position.w;
}
