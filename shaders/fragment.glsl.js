var myFragmentShader = `
precision mediump float;

varying vec3 vPosition;

uniform vec4 color;
const float rad = 1.;

void main(void) {
    gl_FragColor = color;
    // Get the distance vector from the center
    vec2 fromCenter = abs(vPosition.xy);
    float dist = length(fromCenter);
    float dist2 = dist*dist;
    // best fit quartic to SPH kernel (unormalized)
    float alpha_SPH =  -4.87537494*dist2*dist2 + 11.75074987*dist2*dist - 8.14117164*dist2 + 0.2657967*dist + 0.99328463;
 
    //gl_FragColor.a *= 1. - dist/rad;

	gl_FragColor.a *= alpha_SPH;

    //if (dist > rad) {
    //   discard;
    //}
}

`;