#version 100
precision highp float;
precision highp int;

uniform sampler2D u_posTex;
uniform sampler2D u_velTex;

varying vec2 v_uv;

void main() {
    vec4 pos = texture2D(u_posTex, v_uv);

	gl_FragColor = vec4(pos.xyz + vec3(0.005), 1.0);
}
