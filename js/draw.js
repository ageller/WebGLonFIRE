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

    var i=0;
    var j=0;
    var idraw = [0, 0, 0, 0];
    var useAlpha = 1;
    var p;
    var inputRad = false;
    var inputWeight = false;
    var mag;
    for (j = 0; j < partsKeys.length; j++){
		p = partsKeys[j];



    	if (plotParts[p]){
			gl.uniform1f(shaderProgram.vScaleUniform, PsizeMult[p]);

			if (showVel[p]){
	        	//initLine(PsizeMult[p]);
	    	    gl.uniform1f(shaderProgram.oIDUniform, 1);
	        	switch(velType[p]) {
				    case 'line':
				        initCylinder(0.1,1.);
				        break;
				    case 'arrow':
				        initArrow(1.);
        	    	    gl.uniform1f(shaderProgram.oIDUniform, 2);
				        break;
				    case 'cone':
				        initCone(0.1,1.);
				        break;
				    default:
				        initCylinder(0.1,1.);
				} 

			} else{
				initQuad();
			    gl.uniform1f(shaderProgram.oIDUniform, 0);
				gl.uniform1i(shaderProgram.SPHradUniform, parts[p].doSPHrad);
			}

	    	useAlpha = Pcolors[p][3];
  			inputRad = false;
  			inputWeight = false;

			if (mouseDown || tickN < tickwait){
				if (!keepAlpha){
					useAlpha *= parts[p].Coordinates.length / Math.min(parts[p].Coordinates.length, parts[p].nMaxPlot);
				}
				redraw = true;
			} else {

			}
			
			if (parts[p].partRadius != null){
      			inputRad = true;
      		}
			if (parts[p].partWeight != null){
      			inputWeight = true;
      		}  


			var indices = partsUse[p];
	    	imax = indices.length; 

	       	gl.uniform4f(shaderProgram.colorUniform, Pcolors[p][0], Pcolors[p][1], Pcolors[p][2], useAlpha);

	        for (i = pposMin[j]; i < imax; i++) {

	        	if (idraw[j] >= plotNmax[p]){
	        		break;
	        	}

	        	idraw[j] += 1;

	        	mvMatrix = mat4.create(mvMatrix0);
		        //whatever is added here to positions defines the center of rotation
        		mat4.translate(mvMatrix, [parts[p].Coordinates[indices[i]][0] - center[0], parts[p].Coordinates[indices[i]][1] - center[1], parts[p].Coordinates[indices[i]][2] - center[2]]);		          


		        if (showVel[p]){
		        	//NOTE: I draw the arrows pointing up in the y direction, so I need to subtract pi/2
			        mat4.rotate(mvMatrix, (parts[p].VelVals[indices[i]][1] - Math.PI/2.), [0, 0, 1]);
			        //do I need to subtract something here? 
		        	mat4.rotate(mvMatrix, (parts[p].VelVals[indices[i]][2] - Math.PI/2.), [1, 0, 0]);

			        setMatrixUniforms();

					gl.uniform1f(shaderProgram.vScaleUniform, parts[p].VelVals[indices[i]][3]*PsizeMult[p]);
					if (velType[p] == "line"){
		        		gl.drawArrays(gl.TRIANGLE_STRIP, 0, VertexPositionBuffer.numItems);
		        	} else {
		        		gl.drawArrays(gl.TRIANGLES, 0, VertexPositionBuffer.numItems);
		        	}
		        	mag = 1.;//parts[p].VelVals[indices[i]][3];
					if (inputWeight){
				       	mag = mag * parts[p].partWeight[indices[i]];
					}
			       	gl.uniform4f(shaderProgram.colorUniform, Pcolors[p][0], Pcolors[p][1], Pcolors[p][2], useAlpha *  mag);


		        } else {
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
}



function applyFilterDecimate(reset=false){
    rotateFrustum();
	drawit = true;

//filter the mass, and also account for decimation
	var i=0;
	var j=0;
	var k=0;
	var jmax;
	var mass;
	var include = false;
	if (mouseDown || tickN < tickwait || reset){
		pposMin = [0,0,0,0];
		pposMax = [0,0,0,0];
	}

    for (i=0; i< partsKeys.length; i++){
    	p = partsKeys[i]
    	if (pposMax[i] == 0){
    		partsUse[p] = [];
    	}
		jmax = Math.round(parts[p].Coordinates.length / Decimate);
		pposMin[i] = partsUse[p].length;
    	var Nplotted = 0;

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
   			if (Nplotted >= parts[p].nMaxPlot){
   				break;
   			}
   		}
   		pposMax[i] = j;

   	}

}


function tick() {
	if (drawit || redraw){
	    tickN += 1;
	    if (!checkalldrawn() || redraw){
	    	applyFilterDecimate(reset = redraw);
	    	redraw = false;
        	drawScene();
	    }
	    if (checkalldrawn()){
	    	//console.log("all drawn", pposMax, parts[partsKeys[0]].Coordinates.length, partsUse[partsKeys[0]].length);
	    	drawit = false;
	    }
	}
	requestAnimationFrame(tick);
}



