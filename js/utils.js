//https://stackoverflow.com/questions/34050929/3d-point-rotation-algorithm
function rotate(coord, pitch, roll, yaw) {
    var cosa = Math.cos(yaw);
    var sina = Math.sin(yaw);

    var cosb = Math.cos(pitch);
    var sinb = Math.sin(pitch);

    var cosc = Math.cos(roll);
    var sinc = Math.sin(roll);

    var Axx = cosa*cosb;
    var Axy = cosa*sinb*sinc - sina*cosc;
    var Axz = cosa*sinb*cosc + sina*sinc;

    var Ayx = sina*cosb;
    var Ayy = sina*sinb*sinc + cosa*cosc;
    var Ayz = sina*sinb*cosc - cosa*sinc;

    var Azx = -sinb;
    var Azy = cosb*sinc;
    var Azz = cosb*cosc;

    var px = coord[0];
    var py = coord[1];
    var pz = coord[2];

    coord[0] = Axx*px + Axy*py + Axz*pz;
    coord[1] = Ayx*px + Ayy*py + Ayz*pz;
    coord[2] = Azx*px + Azy*py + Azz*pz;
    
}


// for moving and rotating objects
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// from https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript
function loadJSON(callback) {   

  var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
  xobj.open('GET', 'data/snap440.json', true); 
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);  
 }

//check if all the particles are drawn
function checkalldrawn(){
    for (var i=0; i< partsKeys.length; i++){
        if (pposMax[i] < parts[partsKeys[i]].Coordinates.length){
            return false;
        }
    }
    return true;
}


//check if the data is loaded
function checkloaded(){
  if (parts != null){
    // stop spin.js loader
    spinner.stop();

    //show the rest of the page
    d3.select("#ContentContainer").style("visibility","visible")

    loaded = true;
    console.log("loaded")
  }
}

function checkzeros(element, index, array){
    return element == 0;
}