var myVertexShader = `

varying vec3 vPosition;
varying float vID;

attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float oID;

uniform float uVertexScale;

void main(void) {
    vPosition = aVertexPosition;
    vID = oID;

    vec3 vPos = aVertexPosition;
    if (oID == 0.){
		vPos.xy *= uVertexScale;
	} else {
		vPos.y *= uVertexScale;
	}
	
    gl_Position = uPMatrix * uMVMatrix * vec4(vPos, 1.0);


    //vec4 vertex = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    //gl_Position = vertex;
}

`;