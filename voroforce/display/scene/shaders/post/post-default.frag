#version 300 es

precision highp float;
precision highp int;

uniform sampler2D uMainOutputTexture;
uniform sampler2D uVoroEdgeBufferTexture;

in vec2 vUv;
out vec4 fragColor;

void main() {
    fragColor = texture(uMainOutputTexture, vUv);
}