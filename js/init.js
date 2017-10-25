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

//plotting fields
var plotParts = {};

//particle size multiplicative factor
var PsizeMult = {};

//particle default colors;
var Pcolors = {};

//Decimation
var rMaxPlot = 10000;
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
var SliderTmin = {};
var SliderTmax = {};
var SliderInputs = {};

var partsKeys;
var partsUse = {};

//for frustum
var zmax = 10000;
var zmin = 1;
var fov = 45.

var loaded = false;

// for dropdowns
var gtoggle = [];
var plotNmax = {};
var filterLims = {};

//for rendering to image
var renderWidth = 1920;
var renderHeight = 1200;

//for deciding whether to show velocity vectors
var showVel = {};

function webGLStart() {

  while (!loaded){
    checkloaded();
  }

//same allocation size error here for full data set
//  loadJSON(function(response) {
//    // Parse JSON string into object
//    var tparts = JSON.parse(response);
//    parts = tparts[0];

//  d3.json("data/snap440.json",  function(err, partsjson) {
 //   //d3 won't load the full data set due to memory allocaiton error... I may need to break it down if I want this
//    if(err) console.log("error fetching data", err);
//    parts = partsjson[0];

//    // stop spin.js loader
//    spinner.stop();

//    //show the rest of the page
//    d3.select("#ContentContainer").style("visibility","visible")


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
    canvas.onmousedown = handleMouseDown;
    document.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    canvas.addEventListener('wheel', handleMouseWheel);
    canvas.addEventListener('mousewheel', handleMouseWheel)
    canvas.addEventListener('DOMMouseScroll', handleMouseWheel);
    window.addEventListener("resize", handleResize);
    canvas.onwheel = function(event){ event.preventDefault(); };
    canvas.onmousewheel = function(event){ event.preventDefault(); };

    createUI();
    initFilters();
    mouseDown = false;  //silly fix

    mat4.perspective(fov, gl.viewportWidth / gl.viewportHeight, zmin, zmax, pMatrix);

    drawit = true;
    tick();
 // });

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



//initialize various values for the parts dict from the input data file, 
function initPVals(){
    partsKeys = Object.keys(parts);
	for (var i=0; i<partsKeys.length; i++){
		var p = partsKeys[i];
		PsizeMult[p] = parts[p].sizeMult;
		Pcolors[p] = parts[p].color;
		filterLims[p] = {};
		gtoggle.push(true);
		plotNmax[p] = parts[p].Coordinates.length;
		plotParts[p] = true;
		fkeys[p] = parts[p].filterKeys;
		for (var k=0; k<fkeys[p].length; k++){
			calcFilterLimits(p, fkeys[p][k]);
		}
        showVel[p] = false;
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
    shaderProgram.resUniform = gl.getUniformLocation(shaderProgram, "resolution");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "color");
    shaderProgram.vScaleUniform = gl.getUniformLocation(shaderProgram, "uVertexScale");

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



function setCenter(coords){
    var sum = [0., 0., 0.];
    for( var i = 0; i < coords.length; i++ ){
        sum[0] += coords[i][0];
        sum[1] += coords[i][1];
        sum[2] += coords[i][2];
    }
    center = [sum[0]/coords.length, sum[1]/coords.length, sum[2]/coords.length];
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
	   	//console.log(p,fkey, "min,max",min,max, filterLims)
	   	//need to add a small factor here because of the precision of noUIslider
	   	min -= 0.001;
	   	max += 0.001;
	   	filterLims[p][fkey] = [min, max];
	}
}

function initShowParts(){
	//I wonder if I should create a separate parts so that I don't have to loop over the entire array
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

