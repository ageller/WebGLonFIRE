function fullscreen(){
 //   var elem = document.getElementById('WebGL-canvas');
    var elem = document.getElementById('ContentContainer');
    saveWidth = elem.width;
    saveHeight = elem.height;
    elem.width = screen.width;
    elem.height = screen.height;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
    document.getElementById("fullScreenButton").style.display = "none";//visibility = "hidden"

}

if (document.addEventListener)
{
    document.addEventListener('webkitfullscreenchange', exitHandler, false);
    document.addEventListener('mozfullscreenchange', exitHandler, false);
    document.addEventListener('fullscreenchange', exitHandler, false);
    document.addEventListener('MSFullscreenChange', exitHandler, false);
}

function exitHandler()
{
    //var elem = document.getElementById('WebGL-canvas');
    var elem = document.getElementById('ContentContainer');

    if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement != null){
//    	document.getElementById("fullScreenButton").style.visibility = "hidden"
    } else {
    	document.getElementById("fullScreenButton").style.display = "inline";//visibility = "visible"
        elem.width = saveWidth;
        elem.height = saveHeight;
    }

}

//handle window resize event
function handleResize(event){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewportWidth = window.innerWidth;
    gl.viewportHeight = window.innerHeight;
    redraw = true;
    mat4.perspective(fov, gl.viewportWidth / gl.viewportHeight, zmin, zmax, pMatrix);
    initFrustumPlanes();
    rotateFrustum();
}

//handle Mouse events
function handleMouseDown(event) {
    //console.log(event.target.className)
    if (event.target.className == "pTextInput" || event.target.className == "sp-preview-inner" || event.target.className == "dropbtn" || event.target.className == "FilterMaxTClass" || event.target.className == "FilterMinTClass" || event.target.id == "UItopbar" || event.target.className == "select" || event.target.className == "bar1" || event.target.className == "bar2" || event.target.className == "bar3" || event.target.id == "ControlsText" || event.target.id == "Hamburger" || event.target.id =="renderButton" || event.target.className == "button-div" || event.target.id == "CenterCheckDiv" || event.target.id == "CenterCheckBox" || event.target.id == "CenterCheckLabel" || event.target.className == "pLabelDiv"){
        //tickN = 1;
        //tickwait = addtickwait;
        return;
    }
    mouseDown = true;
    redraw = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}
function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {    
    if (!mouseDown || event.target.id != "WebGL-canvas") {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX
    var deltaY = newY - lastMouseY;

    lastMouseX = newX
    lastMouseY = newY;
 
    var dxrot = 0.;
    var dyrot = 0.;
    var fac = 200.;
    dz = 0.;
    if (event.which == 1 || event.which == 3){
        dxrot = deltaX / canvas.width;
        dyrot = deltaY / canvas.height;
    } 
    //if (event.which == 2) {
    //    dz = deltaY * 10.;
    //}

    xrot -= dxrot*fac;
    xrot = xrot % 360.;
    yrot -= dyrot*fac;
    yrot = yrot % 360.;
    setmvMatrix0();
    redraw = true;
    applyFilterDecimate(reset=true);
}



//https://stackoverflow.com/questions/25204282/mousewheel-wheel-and-dommousescroll-in-javascript
function handleMouseWheel(event) 
{
    // Determine the direction of the scroll (< 0 = up, > 0 = down).
    //var delta = ((event.deltaY || -event.wheelDelta || event.detail) >> 10) || 1;

    var dr = event.deltaY;//delta*5.

    if (rotatecamera){
      camerapos[2] -= dr; //Note: this is the opposite direction, but behaves the same way to user as below
    } else {
        c0 = [0., 0., dr];
        rotate(c0, degToRad(xrot), degToRad(yrot), 0.);
        center[0] -= c0[0];
        center[1] -= c0[1];
        center[2] += c0[2];
    }
    updateUICenterText();

    setmvMatrix0();
    tickN = 1;
    tickwait = addtickwait;
    redraw = true;
    applyFilterDecimate(reset=true);

}


function render() {
    var buttonDiv = document.getElementById("button-div");
    //buttonDiv.style.backgroundColor = "#4E2A84";

    saveWidth = canvas.width;
    saveHeight = canvas.height;

//resize

    canvas.width = renderWidth;
    canvas.height = renderHeight;
    gl.viewportWidth = renderWidth;;
    gl.viewportHeight = renderHeight;
    applyFilterDecimate(reset=true);
    mat4.perspective(fov, gl.viewportWidth / gl.viewportHeight, zmin, zmax, pMatrix);
    drawScene();


    //https://stackoverflow.com/questions/11112321/how-to-save-canvas-as-png-image
    var w = window.open('about:blank','image from canvas');
    w.onload = function() {
        w.document.body.innerHTML = 'Loading image ... <br/> After the image loads, right click to download.'

    };
    
    var i = setInterval(function(){
        if (checkalldrawn()) {
            //get the image and open in new browser tab
            var d = canvas.toDataURL("image/png");
            //var url = d.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
            //window.open(url);
            w.document.write("<img src='" + d + "' alt='from canvas'/>");

            //buttonDiv.style.backgroundColor = "#339999";

            //now reset the view
            canvas.width = saveWidth;
            canvas.height = saveHeight;
            gl.viewportWidth = saveWidth;
            gl.viewportHeight = saveHeight;
            applyFilterDecimate(reset=true);
            mat4.perspective(fov, gl.viewportWidth / gl.viewportHeight, zmin, zmax, pMatrix);
            drawScene()

            clearInterval(i);
        }
    }, 200);





}

