
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}



function drawScene() {

	//only clear the buffer if this is the first time drawing
    allzeros = pposMin.every(checkzeros);
	if (allzeros){
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  	}


    gl.uniform2f(shaderProgram.resUniform, canvas.width/defWidth, canvas.height/defHeight);
    var i=0;
    var j=0;
    var idraw = [0, 0, 0, 0];
    var useAlpha = 1;
    var p;
    var inputRad = false;
    var inputWeight = false;
    for (j = 0; j < partsKeys.length; j++){
		p = partsKeys[j];

    	if (plotParts[p]){
    		useAlpha = Pcolors[p][3];
  			inputRad = false;
  			inputWeight = false;

    		//useAlpha = 1;
			if (mouseDown || tickN < tickwait){
				useAlpha = 1;
				redraw = true;
			}
			
			if (parts[p].partRadius != null){
      			inputRad = true;
      		}
			if (parts[p].partWeight != null){
      			inputWeight = true;
      		}  

			gl.uniform1f(shaderProgram.vScaleUniform, PsizeMult[p]);

			var indices = partsUse[p];
	    	imax = indices.length; 

	       	gl.uniform4f(shaderProgram.colorUniform, Pcolors[p][0], Pcolors[p][1], Pcolors[p][2], useAlpha);

	        for (i = pposMin[j]; i < imax; i++) {

	        	if (idraw[j] > plotNmax[p]){
	        		break;
	        	}

	        	idraw[j] += 1;

	        	mvMatrix = mat4.create(mvMatrix0);
		        //whatever is added here to positions defines the center of rotation
		        mat4.translate(mvMatrix, [parts[p].Coordinates[indices[i]][0] -center[0], parts[p].Coordinates[indices[i]][1] - center[1], parts[p].Coordinates[indices[i]][2] - center[2]]);
		        mat4.rotate(mvMatrix, degToRad(-xrot), [0, 1, 0]);
		        mat4.rotate(mvMatrix, degToRad(-yrot), [1, 0, 0]);
		        setMatrixUniforms();

		        if (inputRad){
					gl.uniform1f(shaderProgram.vScaleUniform, parts[p].partRadius[indices[i]]*PsizeMult[p]);
				}
				if (inputWeight){
			       	gl.uniform4f(shaderProgram.colorUniform, Pcolors[p][0], Pcolors[p][1], Pcolors[p][2], useAlpha * parts[p].partWeight[indices[i]]);
				}

		        gl.drawArrays(gl.TRIANGLE_STRIP, 0, VertexPositionBuffer.numItems);
		        
	        }
	    }
    }
}



function applyFilterDecimate(reset=false){
	//console.log("in applyFilterDecimate")
    rotateFrustum();
	drawit = true;

//filter the mass, and also account for decimation
	var i=0;
	var j=0;
	var k=0;
	var jmax;
	var mass;
	var include = false;
	//console.log(partsKeys)
	if (mouseDown || tickN < tickwait || reset){
		pposMin = [0,0,0,0];
		pposMax = [0,0,0,0];
		//console.log("resetting ppos", tickN, tickwait, mouseDown, reset)
	}

    for (i=0; i< partsKeys.length; i++){
    	p = partsKeys[i]
    	//console.log(partsKeys[i])
    	if (pposMax[i] == 0){
    		//console.log("resetting partsUse",i)
    		partsUse[p] = [];
    	}
		jmax = Math.round(parts[p].Coordinates.length / Decimate);
		pposMin[i] = partsUse[p].length;
    	var Nplotted = 0;
    	//console.log(i, jmax, pposMin[i], pposMax[i])
    	//if (pposMax[i] < jmax){console.log("drawing",i)}
   		for (j=pposMax[i]; j< jmax; j++){
//test if it's in the frustum
			if (testPointInFrustum(parts[p].Coordinates[j])) {
			//if (true){
// apply the filters
				include = true;
				for (k=0; k<fkeys[p].length; k++){

	   				if (parts[p][fkeys[p][k]] != null) {
	   					val = parts[p][fkeys[p][k]][j]; 
						if ( val < filterLims[p][fkeys[p][k]][0] || val > filterLims[p][fkeys[p][k]][1] ){
	   						include = false;
	   					}
	   				}
	   			}
	   			if (include){
   					partsUse[p].push(j);
	   			}
				Nplotted += 1;   

   			}
   			if (Nplotted >= rMaxPlot){
   				break;
   			}
   		}
   		//console.log("first", i,j, pposMin, pposMax)
   		pposMax[i] = j;
   		//console.log("second", i,j, pposMin, pposMax)

   	}
   	//console.log(partsKeys)
   	//console.log("N Gas particles",partsUse[partsKeys[0]].Coordinates.length, pposMin, drawit, Nplotted)
   	//console.log("N HRDM particles",partsUse[partsKeys[1]].Coordinates.length, pposMin, drawit, Nplotted)
   	//console.log("N LRDM particles",partsUse[partsKeys[2]].Coordinates.length, pposMin, drawit, Nplotted)
   	//console.log("N Stars particles",partsUse[partsKeys[3]].Coordinates.length, pposMin, drawit, Nplotted)
}



function tick() {


	//setInterval(function () {
	//console.log("in tick", tickN, tickwait, redraw, drawit)
	if (drawit || redraw){
	    tickN += 1;
	    if (!checkalldrawn() || redraw){
	    	//console.log("calling applyFilterDecimate")
	    	applyFilterDecimate(reset = redraw);
	    	//drawit = false;
	    	//console.log(checkalldrawn(), pposMin, pposMax, drawit, tickN, tickwait, parts[partsKeys[0]].Coordinates.length, partsUse[partsKeys[0]].Coordinates.length);
	    	//console.log("drawScene")
	    	redraw = false;
        drawScene();
	    	//drawit = false;
	    }
	    if (checkalldrawn()){
	    	console.log("all drawn", pposMax, parts[partsKeys[0]].Coordinates.length, partsUse[partsKeys[0]].length);
	    	drawit = false;
	    	//tickN = 1;
	    }

	}
	//}, 10);
	requestAnimationFrame(tick);

}



