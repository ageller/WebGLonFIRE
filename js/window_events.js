function fullscreen(){
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
    var elem = document.getElementById('ContentContainer');

    if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement != null){
//    	document.getElementById("fullScreenButton").style.visibility = "hidden"
    } else {
    	document.getElementById("fullScreenButton").style.display = "inline";//visibility = "visible"
        elem.width = saveWidth;
        elem.height = saveHeight;
    }

}

//hide the splash screen
function hideSplash(){
    if (loaded){
        helpMessage = 0;
        var fdur = 700.;

        var splash = d3.select("#splash");

        splash.transition()
            .ease(d3.easeLinear)
            .duration(fdur)
            .style("opacity", 0)
            .on("end", function(d){
                splash.style("display","none");
            })
    }
}

//hide the splash screen
function showSplash(){
    if (loaded){
        helpMessage = 1;
        var fdur = 700.;

        var splash = d3.select("#splash");
        splash.style("display","block");

        splash.transition()
            .ease(d3.easeLinear)
            .duration(fdur)
            .style("opacity", 0.8);
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

function handleKeyPress(event){
    // h -> help 
    if (event.charCode==104){
        helpMessage=!helpMessage;
        if (helpMessage){
            showSplash();
        }
        else{
            hideSplash()
        }
    }
}

//handle Mouse events
var ignoreMouseClasses = ["pTextInput", "sp-preview-inner", "dropbtn", "FilterMaxTClass", "FilterMinTClass" , "select", "bar1", "bar2", "bar3", "button-div", "pLabelDiv", "selectFilter", "selectVelType",  "NMaxTClass",  "PMaxTClass", "NSliderClass", "PSliderClass", "slideroo", "sp-choose", "sp-input", "select-style"];
var ignoreMouseIds = ["UItopbar", "ControlsText", "Hamburger", "renderButton", "CenterCheckDiv", "CenterCheckBox", "CenterCheckLabel", "splash"];
function handleMouseDown(event) {
    if (ignoreMouseClasses.indexOf(event.target.className) >= 0 || ignoreMouseIds.indexOf(event.target.id) >= 0 ||  event.target.className.indexOf("noUi")  >= 0 || event.target.className.indexOf("Slider")  >= 0 || event.target.id.indexOf("splash")  >= 0){

        return;
    }
    mouseDown = true;
    redraw = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    if (lastMouseX == null){
        touch = true;
        event.preventDefault;
        lastMouseX = event.touches[0].clientX;
        lastMouseY = event.touches[0].clientY;
        // Cache the touch points for later processing of 2-touch pinch/zoom
        if (event.targetTouches.length == 2) {
            for (var i=0; i < event.targetTouches.length; i++) {
                tpCache.push(event.targetTouches[i]);
            }
        }
    }
}
function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {    
    if (!mouseDown || event.target.id != "WebGL-canvas" ) {
        return;
    }

    var newX = event.clientX;
    var newY = event.clientY;

    if (newX == null){
        touch = true;
        event.preventDefault();
        newX = event.touches[0].clientX;
        newY = event.touches[0].clientY;
    }

    if (touch){

        if (event.touches.length > 1 || event.targetTouches.length > 1){
            handle_pinch_zoom(event);
            return
        }
    }

    var deltaX = newX - lastMouseX
    var deltaY = newY - lastMouseY;

    lastMouseX = newX
    lastMouseY = newY;
 
    var dxrot = 0.;
    var dyrot = 0.;
    var fac = 200.;
    dz = 0.;
 
    if (event.which == 1 || event.which == 3 || (touch && event.which == 0)){
        dxrot = deltaX / canvas.width;
        dyrot = deltaY / canvas.height;
    } 


    xrot -= dxrot*fac;
    xrot = xrot % 360.;
    yrot -= dyrot*fac;
    yrot = yrot % 360.;
    updateUIRotText();
    setmvMatrix0();
    redraw = true;
    applyFilterDecimate(reset=true);
    
}


function zoom(dr){
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
    updateUICameraText();

    setmvMatrix0();
    tickN = 1;
    tickwait = addtickwait;
    redraw = true;
    applyFilterDecimate(reset=true);
}

//https://stackoverflow.com/questions/25204282/mousewheel-wheel-and-dommousescroll-in-javascript
function handleMouseWheel(event) 
{
    // Determine the direction of the scroll (< 0 = up, > 0 = down).
    //var delta = ((event.deltaY || -event.wheelDelta || event.detail) >> 10) || 1;

    var dr = event.deltaY;//delta*5.
    zoom(dr);

}


function handle_pinch_zoom(event) {

    if (event.targetTouches.length == 2 && event.changedTouches.length == 2) {
        // Check if the two target touches are the same ones that started
        // the 2-touch
        var point1=-1, point2=-1;
        for (var i=0; i < tpCache.length; i++) {
            if (tpCache[i].identifier == event.targetTouches[0].identifier) point1 = i;
            if (tpCache[i].identifier == event.targetTouches[1].identifier) point2 = i;
        }
        if (point1 >= 0 && point2 >= 0) {
            // Calculate the difference between the start and move coordinates
            var dx1 = Math.abs(tpCache[point1].clientX - tpCache[point2].clientX) / event.target.clientWidth;
            var dx2 = Math.abs(event.targetTouches[0].clientX - event.targetTouches[1].clientX) / event.target.clientWidth;
            var dy1 = Math.abs(tpCache[point1].clientY- tpCache[point2].clientY) / event.target.clientHeight;
            var dy2 = Math.abs(event.targetTouches[0].clientY - event.targetTouches[1].clientY) / event.target.clientHeight;

            dz = ((dx1 + dy1) - (dx2 + dy2)) * 20.;
            zoom(dz);

            tpCache = new Array();
            for (var i=0; i < event.targetTouches.length; i++) {
                tpCache.push(event.targetTouches[i]);
            }

        } else {
            // empty tpCache
            tpCache = new Array();
        }
    }
}

function render() {
    var buttonDiv = document.getElementById("button-div");

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

