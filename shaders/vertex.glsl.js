var myVertexShader = `

varying vec3 vPosition;

attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform vec2 resolution;
uniform float uVertexScale;

void main(void) {
    vPosition = aVertexPosition;

    vec3 vPos = aVertexPosition;
    vPos.xy *= uVertexScale;
    gl_Position = uPMatrix * uMVMatrix * vec4(vPos, 1.0);


    //vec4 vertex = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    //gl_Position = vertex;
}

`;