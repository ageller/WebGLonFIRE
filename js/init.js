//for full screen
var saveWidth = 0.;
var saveHeight = 0.;


var gl;
var canvas; 
var shaderProgram;
var mvMatrix = mat4.create();
var mvMatrix0 = mat4.create();
var pMatrix = mat4.create();
var defHeight = 786;
var defWidth = 1024;
var VertexPositionBuffer;

//for mouse events
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var xrot = 0.;
var yrot = 0.;
var dz = 0.;
var camerapos = [0., 0., 0.];//-600];
var rotatecamera = false; 
var friction = 1.;
var df = 0.0003;

//positions, will be rest below
var center = [0., 0., -50.];
var centerMag = 1.;

//plotting fields
var plotParts = {};

//particle size multiplicative factor
var PsizeMult = {};

//particle default colors;
var Pcolors = {};

//Decimation
var pposMin = [0, 0, 0, 0];
var pposMax = [0, 0, 0, 0];
var partsLength = [0, 0, 0, 0];
var Decimate = 1;
var tickwait = 1;
var addtickwait = 10;
var drawit = true;
var redraw = false;
var tickN = 0

//Filtering
//I need to add a small factor because the precision of the noUiSlider effects the filtering
var fkeys = {};
var SliderF = {};
var SliderFmin = {};
var SliderFmax = {};
var SliderFinputs = {};

var partsKeys;
var partsUse = {};

//for frustum
var zmax = 10000;
var zmin = 1;
var fov = 45.

var loaded = false;

// for dropdowns
var gtoggle = {"Camera":true};
var plotNmax = {};
var filterLims = {};

//for rendering to image
var renderWidth = 1920;
var renderHeight = 1200;

//for deciding whether to show velocity vectors
var showVel = {};
var velopts = ['line', 'arrow', 'cone']
var velType = {};

//for single sliders
var SliderN = {};
var SliderNmin = {};
var SliderNmax = {};
var SliderNInputs = {};
var SliderP = {};
var SliderPmin = {};
var SliderPmax = {};
var SliderPInputs = {};
var SliderD;
var SliderDmin;
var SliderDmax;
var SliderDInputs;
var keepAlpha = true;

//help screen
var helpMessage = 1;

function webGLStart() {


    while (!loaded){
        checkloaded();
    }

    canvas = document.getElementById("WebGL-canvas");
   	initGL();

    setCenter(parts.Gas.Coordinates);
    updateUICenterText();

    //console.log("initfrustum")
    initFrustumPlanes();
    rotateFrustum();
    setmvMatrix0();

	initPVals()

    initShowParts();
    initShaders();
    initQuad();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.preserveDrawingBuffer = false;

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('wheel', handleMouseWheel);
    document.addEventListener('mousewheel', handleMouseWheel)
    document.addEventListener('DOMMouseScroll', handleMouseWheel);
    document.addEventListener('touchstart', handleMouseDown);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);
    
    window.addEventListener('resize', handleResize);

    createUI();
    mouseDown = false;  //silly fix

    mat4.perspective(fov, gl.viewportWidth / gl.viewportHeight, zmin, zmax, pMatrix);

    drawit = true;
    tick();

}


function initGL() {
    try {
        //gl = getWebGLContext(canvas);
        //gl = canvas.getContext("webgl");
        gl = canvas.getContext('webgl',{preserveDrawingBuffer: true})
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry !");
    }
}

function calcVelVals(p){
    parts[p].VelVals = [];
    parts[p].magVelocities = [];
    var mag, angx, angy, v;
    var max = -1.;
    var min = 1.e20;
    for (var i=0; i<parts[p].Velocities.length; i++){
        v = parts[p].Velocities[i];
        mag = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        angx = Math.atan2(v[1],v[0]);
        angy = Math.acos(v[2]/mag);
        if (mag > max){
            max = mag;
        }
        if (mag < min){
            min = mag;
        }
        parts[p].VelVals.push([mag, angx, angy]);
        parts[p].magVelocities.push(mag);
    }
    for (var i=0; i<parts[p].Velocities.length; i++){
        parts[p].VelVals[i].push(parts[p].VelVals[i][0]/(max - min));
    }

}
//initialize various values for the parts dict from the input data file, 
function initPVals(){
    partsKeys = Object.keys(parts);
	for (var i=0; i<partsKeys.length; i++){
		var p = partsKeys[i];
		PsizeMult[p] = parts[p].sizeMult;
		Pcolors[p] = parts[p].color;
		filterLims[p] = {};
		gtoggle[p] = true;
		plotNmax[p] = parts[p].Coordinates.length;
		plotParts[p] = true;

        if (parts[p].Velocities != null){
            calcVelVals(p);
            parts[p].filterKeys.push("magVelocities");
            velType[p] = 'line';
            //console.log(p, parts[p].VelVals, parts[p].Velocities)
        }
        showVel[p] = false;
        fkeys[p] = parts[p].filterKeys;
        for (var k=0; k<fkeys[p].length; k++){
            calcFilterLimits(p, fkeys[p][k]);
        }
	}


}
//set up the mvMatrix
function setmvMatrix0()
{
	mat4.identity(mvMatrix0);
    mat4.translate(mvMatrix0, camerapos);
	mat4.rotate(mvMatrix0, degToRad(yrot), [1, 0, 0]);
	mat4.rotate(mvMatrix0, degToRad(xrot), [0, 1, 0]);
}

//initialize the shaders
function initShaders() {

    //Shader compilation
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, myVertexShader);
    gl.compileShader(vertexShader);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, myFragmentShader);
    gl.compileShader(fragmentShader);


    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    //Uniform location
    gl.bindAttribLocation(shaderProgram, 0, 'aVertexPosition');

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "color");
    shaderProgram.vScaleUniform = gl.getUniformLocation(shaderProgram, "uVertexScale");
    shaderProgram.oIDUniform = gl.getUniformLocation(shaderProgram, "oID");
    shaderProgram.SPHradUniform = gl.getUniformLocation(shaderProgram, "SPHrad");

}    

// initialize the buffer(s) that contain the vertices
// this is just a simple quad (billboard)
function initQuad() {
    VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = 4;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(0);
}

//this is an arrow (for the velocities)
function initLine(s){
    VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    vertices = [
         0.0,  0.0,  0.0,
         0.0,  s,    0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = 2;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

}

//https://gist.github.com/davidwparker/1195852
function initCone(s, h, dAng = 10.){
    var Nvert = 3. * Math.round(360./dAng);
    vertices = []
    /* sides */
    for (var k=0; k<=360; k+=dAng){
        vertices.push(0);
        vertices.push(h);
        vertices.push(0);

        vertices.push(s*Math.cos(degToRad(k)));
        vertices.push(0);
        vertices.push(s*Math.sin(degToRad(k)));

        vertices.push(s*Math.cos(degToRad(k + dAng)));
        vertices.push(0);
        vertices.push(s*Math.sin(degToRad(k + dAng)));

    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = Nvert;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

}
function initCylinder(s, h, dAng = 10.){
    var Nvert = 6. * (Math.round(360./dAng) + 1.);
    vertices = []

    /* top circle */ 
    for (var k=0; k<=360; k+=dAng){
        vertices.push(0);
        vertices.push(h);
        vertices.push(0);

        vertices.push(s*Math.cos(degToRad(k)));
        vertices.push(h);
        vertices.push(s*Math.sin(degToRad(k)));
    }

    /* sides */
    for (var k=0; k<=360; k+=dAng){
        vertices.push(s*Math.cos(degToRad(k)));
        vertices.push(h);
        vertices.push(s*Math.sin(degToRad(k)));

        vertices.push(s*Math.cos(degToRad(k)));
        vertices.push(0);
        vertices.push(s*Math.sin(degToRad(k)));
    }
    /* close it */
    vertices.push(s);
    vertices.push(h);
    vertices.push(0);
    vertices.push(s);
    vertices.push(0);
    vertices.push(0);


    /* bottom circle */ 
    for (var k=0; k<=360; k+=dAng){
        vertices.push(s*Math.cos(degToRad(k)));
        vertices.push(0);
        vertices.push(s*Math.sin(degToRad(k)));

        vertices.push(0);
        vertices.push(0);
        vertices.push(0);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = Nvert;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

}
//this is an arrow (for the velocities)
function initArrow(s, tsize = 0.05, hsize = 0.5){
    VertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VertexPositionBuffer);
    vertices = [
         0.5*hsize, s,        0.0,
         0.0,       s+hsize,  0.0,
        -0.5*hsize, s,        0.0,

        -1.*tsize,  s,    0.0,
         tsize,     s,    0.0,
        -1.*tsize,  0.0,  0.0,

         tsize,     0.0,  0.0,
         tsize,     s,    0.0,
        -1.*tsize,  0.0,  0.0,

    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    VertexPositionBuffer.itemSize = 3;
    VertexPositionBuffer.numItems = 9;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

}

function setCenter(coords){
    var sum = [0., 0., 0.];
    for( var i = 0; i < coords.length; i++ ){
        sum[0] += coords[i][0];
        sum[1] += coords[i][1];
        sum[2] += coords[i][2];
    }
    center = [sum[0]/coords.length, sum[1]/coords.length, sum[2]/coords.length];
    centerMag = Math.sqrt(center[0]*center[0] + center[1]*center[1] + center[2]*center[2]);

}


function calcFilterLimits(p, fkey){
//calculate limits for the filters
   	
	var j=0;
	if (parts[p][fkey] != null){
	   	var i=0;
	   	min = parts[p][fkey][i];
	   	max = parts[p][fkey][i];
	   	for (i=0; i< parts[p][fkey].length; i++){
	   		min = Math.min(min, parts[p][fkey][i]);
	   		max = Math.max(max, parts[p][fkey][i]);
	   	}
	   	//need to add a small factor here because of the precision of noUIslider
	   	min -= 0.001;
	   	max += 0.001;
	   	filterLims[p][fkey] = [min, max];
	}
}

function initShowParts(){
	partsUse = {};
	for (var i=0; i< partsKeys.length; i++){
		partsUse[partsKeys[i]] = [];	
	}
	var i=0;
	var j=0;
   	for (i=0; i< partsKeys.length; i++){
   		parts[partsKeys[i]].showpart = []
   		for (j=0; j< parts[partsKeys[i]].Coordinates.length; j++){
   			parts[partsKeys[i]].showpart.push(true);
   		}
   	}
}

