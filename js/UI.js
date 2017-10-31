//check whether the center is locked or not
function checkCenterLock(box)
{
	rotatecamera = false;
	//console.log(center, camerapos);
	if (camerapos[2] != 0){
        c0 = [0., 0., -1.*camerapos[2]];
        rotate(c0, degToRad(xrot), degToRad(yrot), 0.);
        center[0] -= c0[0];
        center[1] -= c0[1];
        center[2] += c0[2];
	}
	camerapos = [0.,0.,0.];
	if (box.checked) {
		rotatecamera = true;
	}
	updateUICenterText();
	updateUICameraText();
	updateUIRotText();

}

function checkVelBox(box)
{
	var pID = box.id.slice(0, -11)
	showVel[pID] = false;
	if (box.checked){
		showVel[pID] = true;
	}
//	console.log(pID, showVel[pID])

}

//functions to check sizes of particles
function checkColor(event, color)
{
	rgb = color.toRgb();
	var pID = event.id.slice(0,-11); // remove  "ColorPicker" from id
	Pcolors[pID] = [rgb.r/255., rgb.g/255., rgb.b/255., rgb.a];

	redraw = true;	
}

function initNsliders(dovalues = false){
	var i = 0;
	for (i=0; i< partsKeys.length; i++){
		p = partsKeys[i];
		var Nr = document.getElementById(p+"NRange");
		var Nt = document.getElementById(p+"NText");
		Np = Math.round(parts[p].Coordinates.length/Decimate);
		if (Nr != null && Nt != null){
			Nr.max = Np;
			if (dovalues){
				Nr.value = Np;
				Nt.value = Np;
				plotNmax[p] = Np;
			}
		}
	}
	drawit = true;
}

// Filters
function setSliderHandle(i, value, parent) {
	var r = [null,null];
	r[i] = value;
	parent.noUiSlider.set(r);
	// I need a better way to do this!
	var fpos = parent.id.indexOf('_FK_');
	var epos = parent.id.indexOf('_END_');
	var sl = parent.id.length;
	var p = parent.id.slice(0, fpos - sl);
	var fk = parent.id.slice(fpos + 4, epos - sl);


	filterLims[p][fk][i] = value;
	redraw = true;
	mouseDown = false; //silly fix
}
// Listen to keydown events on the input field.
function handleSliderText(input, handle) 
{
	input.addEventListener('change', function(){
		setSliderHandle(handle, this.value, this.parent);
	});
	input.addEventListener('keydown', function( e ) {
		var values = input.parent.noUiSlider.get();
		var value = Number(values[handle]);
		// [[handle0_down, handle0_up], [handle1_down, handle1_up]]
		var steps = input.parent.noUiSlider.options.steps;
		// [down, up]
		var step = steps[handle];
		var position;
		// 13 is enter,
		// 38 is key up,
		// 40 is key down.
		switch ( e.which ) {
			case 13:
				setSliderHandle(handle, this.value, input.parent);
				break;
			case 38:
				// Get step to go increase slider value (up)
				// false = no step is set
				position = step[1];
				if ( position === false ) {
					position = 1;
				}
				// null = edge of slider
				if ( position !== null ) {
					setSliderHandle(handle, value + position, input.parent);
				}
				break;
			case 40:
				position = step[0];
				if ( position === false ) {
					position = 1;
				}
				if ( position !== null ) {
					setSliderHandle(handle, value - position, input.parent);
				}
				break;
		}
	});
};


function initFilters(){

	var i = 0;
	var j = 0;
	for (i=0; i<partsKeys.length; i++){
		p = partsKeys[i];
		SliderF[p] = {};
		SliderTmin[p] = {};
		SliderTmax[p] = {};
		SliderInputs[p] = {};

		for (j=0; j<fkeys[p].length; j++){
			var fk = fkeys[p][j]
			SliderF[p][fk] = document.getElementById(p+'_FK_'+fk+'_END_FilterSlider');
			SliderTmin[p][fk] = document.getElementById(p+'_FK_'+fk+'_END_FilterMinT');
			SliderTmax[p][fk] = document.getElementById(p+'_FK_'+fk+'_END_FilterMaxT');
			if (SliderF[p][fk] != null && SliderTmin[p][fk] != null && SliderTmax[p][fk] != null && filterLims[p][fk] != null){
				SliderInputs[p][fk] = [SliderTmin[p][fk], SliderTmax[p][fk]];
				SliderInputs[p][fk][0].parent = SliderF[p][fk];
				SliderInputs[p][fk][1].parent = SliderF[p][fk];
				min = filterLims[p][fk][0];
				max = filterLims[p][fk][1];

				noUiSlider.create(SliderF[p][fk], {
					start: [min, max],
					connect: true,
					tooltips: [false, false],
					steps: [[0.001,0.001],[0.001,0.001]],
					range: {
						'min': [min],
						'max': [max]
					},
					format: wNumb({
					decimals: 3
					})
				});
				SliderF[p][fk].noUiSlider.on('mouseup', mouseDown=false); 
				SliderF[p][fk].noUiSlider.on('update', function(values, handle) {
	// works for for mass (I need a better way to do this!)
					var fpos = this.target.id.indexOf('_FK_');
					var epos = this.target.id.indexOf('_END_');
					var sl = this.target.id.length;
					var pp = this.target.id.slice(0, fpos - sl);
					var ffk = this.target.id.slice(fpos + 4, epos - sl);
					SliderInputs[pp][ffk][handle].value = values[handle];
					filterLims[pp][ffk][handle] = values[handle];
					redraw = true;
					mouseDown = true;
				});

				SliderInputs[p][fk].forEach(handleSliderText);
			}
		}
	}
}

function updateUICenterText()
{
    document.getElementById("CenterXText").value = center[0];
    document.getElementById("CenterYText").value = center[1];
    document.getElementById("CenterZText").value = center[2];
}

function updateUICameraText()
{
    document.getElementById("CameraXText").value = camerapos[0];
    document.getElementById("CameraYText").value = camerapos[1];
    document.getElementById("CameraZText").value = camerapos[2];
}

function updateUIRotText()
{
    document.getElementById("RotXText").value = xrot;
    document.getElementById("RotYText").value = yrot;
}
function checkSlider(slider)
{
	tickN = 1;

//N sliders
	var type = slider.id.slice(-6); 
	if (type == 'NRange'){
		pID = slider.id.slice(0,-6); // remove  "Nrange" from id
		document.getElementById(pID+"NText").value = slider.value;
		plotNmax[pID] = Math.round(slider.value)
	}

	if (type == 'PRange'){
		pID = slider.id.slice(0,-6); // remove  "PRange" from id
		PsizeMult[pID] = slider.value/100.;
		document.getElementById(pID+"PText").value = slider.value/100.;
	}

    if (slider.id == "DecimateRange"){
        Decimate = Math.round(slider.value);
        document.getElementById("DecimateText").value = slider.value;
        initNsliders();
        applyFilterDecimate(reset=true);
	}

	redraw = true;
}

function checkText(input, event)
{

	var key=event.keyCode || event.which;
  	if (key==13){
  		tickN = 1;
		redraw = true;

		//N sliders
		var type = input.id.slice(-5); 
		var pID = input.id.slice(0,-5); // remove  "NText" from id

		var max;

		//console.log(type);
		if (type == 'NText'){
			document.getElementById(pID+"NRange").value = input.value;
			plotNmax[pID] = Math.round(input.value)
		}

		if (type == "PText"){
			PsizeMult[pID] = input.value;
			max = document.getElementById(pID+"PRange").max;
			document.getElementById(pID+"PRange").max = Math.max(100.*input.value, max);
			document.getElementById(pID+"PRange").value = 100.*input.value;
		}

        if (input.id == "DecimateText"){
	        document.getElementById("DecimateRange").value = input.value;
	        Decimate = Math.round(input.value);
	        initNsliders();
	        applyFilterDecimate(reset=true);
		}

        if (input.id == "CenterXText"){
        	center[0] = parseFloat(input.value);
			applyFilterDecimate(reset=true);
		}
        if (input.id == "CenterYText"){
        	center[1] = parseFloat(input.value);
		    applyFilterDecimate(reset=true);
 		}
        if (input.id == "CenterZText"){
        	center[2] = parseFloat(input.value);
		    applyFilterDecimate(reset=true);
 		}

        if (input.id == "CameraXText"){
        	camerapos[0] = parseFloat(input.value);
        	setmvMatrix0()
		    applyFilterDecimate(reset=true);
 		}
        if (input.id == "CameraYText"){
        	camerapos[1] = parseFloat(input.value);
        	setmvMatrix0()
		    applyFilterDecimate(reset=true);
 		}
        if (input.id == "CameraZText"){
        	camerapos[2] = parseFloat(input.value);
        	setmvMatrix0()
		    applyFilterDecimate(reset=true);
 		}


        if (input.id == "RotXText"){
        	xrot = parseFloat(input.value);
        	setmvMatrix0()
		    applyFilterDecimate(reset=true);
 		}
        if (input.id == "RotYText"){
        	yrot = parseFloat(input.value);
        	setmvMatrix0()
		    applyFilterDecimate(reset=true);
 		}

		if (input.id == "RenderXText"){
			renderWidth = parseInt(input.value);
		}
		if (input.id == "RenderYText"){
			renderHeight = parseInt(input.value);
		}
	}

}

//function to check which types to plot
function checkPlotParts(checkbox)
{
	var type = checkbox.id.slice(-5); 
	if (type == 'Check'){	
		var pID = checkbox.id.slice(0,-5); // remove  "Check" from id
    	plotParts[pID] = false;
    	if (checkbox.checked){
       		plotParts[pID] = true;
    	}
    } 
    redraw = true;
}


var UIhidden = false;
function hideUI(x){
	x.classList.toggle("change");

	var UI = document.getElementById("UIhider");
	var UIc = document.getElementsByClassName("UIcontainer")[0];
	if (UIhidden){
		UI.setAttribute("style","visibility: visible;");
		UIc.setAttribute("style","border-style: solid;");
		UIhidden = false;
	} else {
		UI.setAttribute("style","visibility: hidden;");	
		UIc.setAttribute("style","border-style: none; margin-left:2px; margin-top:2px");
		UIhidden = true;	
	}
}



function getPi(pID){
	var i=0;
	for (i=0; i<partsKeys.length; i++){
		if (pID == partsKeys[i]){
			break;
		}
	}
	return i
}

function showFunction(handle) {
	var offset = 5;

//find the position in the partsKeys list
	var pID = handle.id.slice(0,-7); // remove  "Dropbtn" from id
	i = getPi(pID);
    document.getElementById(pID+"Dropdown").classList.toggle("show");

    var pdiv;
   	var ddiv = document.getElementById(pID+'Dropdown');
	var ht = parseFloat(ddiv.style.height.slice(0,-2)) + offset; //to take of "px"
	var pb = 0.;

    if (i < partsKeys.length-1){
	    pdiv = document.getElementsByClassName(partsKeys[i+1]+'Div')[0];
		if (gtoggle[pID]){
	    	pdiv.setAttribute("style","margin-top: "+ht + "px; ");
	    	gtoggle[pID] = false;	
	 	} else {
	 		pdiv.setAttribute("style","margin-top: 0 px; ");	
			gtoggle[pID] = true;
		}
	} else { // a bit clunky, but works with the current setup
		if (pID == "Camera"){
	    	c = document.getElementById("DecimationDiv");
	    	pb = 5;
			if (gtoggle[pID]){
				c.setAttribute('style','margin-top:'+(pb+ht-5)+'px');
				gtoggle[pID] = false;	

			} else {
				c.setAttribute('style','margin-top:'+pb+'px');	
				gtoggle[pID] = true;	
			}	
		} else { //for the last particle (to move the bottom of the container)
			c = document.getElementsByClassName("UIcontainer")[0];

			if (gtoggle[pID]){
				c.setAttribute('style','padding-bottom:'+(pb+ht-5)+'px');
				gtoggle[pID] = false;	

			} else {
				c.setAttribute('style','padding-bottom:'+pb+'px');	
				gtoggle[pID] = true;		
			}
		}
	}
}

function selectFilter() {
	var option = d3.select(this)
	    .selectAll("option")
	    .filter(function (d, i) { 
	        return this.selected; 
    });
	selectValue = option.property('value');

	var p = this.id.slice(0,-13)

	//console.log("in selectFilter", selectValue, this.id, p)
	for (var i=0; i<fkeys[p].length; i+=1){
		//console.log('hiding','#'+p+'_FK_'+fkeys[p][i]+'_END_Filter')
		d3.selectAll('#'+p+'_FK_'+fkeys[p][i]+'_END_Filter')
			.style('display','none');
	}
	//console.log('showing', '#'+p+'_FK_'+selectValue+'_END_Filter')
	d3.selectAll('#'+p+'_FK_'+selectValue+'_END_Filter')
		.style('display','inline');


};

function selectVelType() {
	var option = d3.select(this)
	    .selectAll("option")
	    .filter(function (d, i) { 
	        return this.selected; 
    });
	selectValue = option.property('value');

	var p = this.id.slice(0,-14)
	velType[p] = selectValue;
	redraw = true;
};

function createUI(){
	console.log("Creating UI");

//change the hamburger to the X to start
 	var hamburger = document.getElementById('UItopbar');
 	//hide the UI
	hideUI(hamburger);
 	hamburger.classList.toggle("change");



	console.log(partsKeys)
	var UI = d3.select('#particleUI')
	    .selectAll('div')
		.data(partsKeys).enter()
		.append('div')
		.attr('class', function (d) { return "particleDiv "+d+"Div" }) //+ dropdown


	var i=0;
	var j=0;
	for (i=0; i<partsKeys.length; i++){
		d = partsKeys[i];

		var controls = d3.selectAll('div.'+d+'Div');

		controls.append('div')
			.attr('class','pLabelDiv')
			.text(function (d) { return d})
			
		var onoff = controls.append('label')
			.attr('class','switch');

		onoff.append('input')
			.attr('id',d+'Check')
			.attr('type','checkbox')
			.attr('autocomplete','off')
			.attr('checked','true')
			.attr('onchange','checkPlotParts(this)');

		onoff.append('span')
			.attr('class','slideroo');

		controls.append('input')
			.attr('id', d+'PRange')
			.attr('class', 'sliderps')
			.attr('type', 'range')
			.attr('min', '0')
			.attr('max', '500')
			.attr('value',PsizeMult[d]*100)
			.attr('autocomplete','off')
			.attr('oninput','checkSlider(this)');

		controls.append('input')
			.attr('id', d+'PText')
			.attr('class', 'pTextInput')
			.attr('type', 'text')
			.attr('value', PsizeMult[d])
			.attr('autocomplete','off')
			.attr('onkeypress','checkText(this, event)');

		controls.append('input')
			.attr('id',d+'ColorPicker');

		controls.append('button')
			.attr('id', d+'Dropbtn')
			.attr('class', 'dropbtn')
			.attr('onclick','showFunction(this)')
			.html('&#x25BC');

		dropdown = controls.append('div')
			.attr('id',d+'Dropdown')
			.attr('class','dropdown-content');

		dNcontent = dropdown.append('div')
			.attr('class','NdDiv');

		dNcontent.append('span')
			.attr('class','pLabelDiv')
			.attr('style','width:20px')
			.text('N');


		dNcontent.append('input')
			.attr('id',d+'NRange')
			.attr('class','sliderps')
			.attr('style','width:165px; background:#a3a3a3')
			.attr('type','range')
			.attr('min','0')
			.attr('max','100')
			.attr('value','0')
			.attr('autocomplete','off')
			.attr('oninput','checkSlider(this)');

		dNcontent.append('input')
			.attr('id',d+'NText')
			.attr('class','pTextInput')
			.attr('style','width:50px')
			.attr('type','text')
			.attr('value','1')
			.attr('autocomplete','off')
			.attr('onkeypress','checkText(this, event)');
	
		var dheight = 30;

//for velocity vectors
		if (parts[d].Velocities != null){

			dVcontent = dropdown.append('div')
				.attr('class','NdDiv');

			dVcontent.append('label')
				.attr('for',d+'velCheckBox')
				.text('Plot Velocity Vectors');

			dVcontent.append('input')
				.attr('id',d+'velCheckBox')
				.attr('value','false')
				.attr('type','checkbox')
				.attr('autocomplete','off')
				.attr('onchange','checkVelBox(this)');

			var selectVType = dVcontent.append('select')
				.attr('class','selectVelType')
				.attr('id',d+'_SelectVelType')
				.on('change',selectVelType)

			var options = selectVType.selectAll('option')
				.data(velopts).enter()
				.append('option')
				.text(function (d) { return d; });

			dheight += 30;
		}

//this is dynamic, depending on what is in the data
//create the filters
//first count the available filters
		showfilts = [];
		for (j=0; j<fkeys[d].length; j++){
			var fk = fkeys[d][j]
			if (parts[d][fk] != null){
				showfilts.push(fk);
			}
		}
		nfilt = showfilts.length;

		if (nfilt > 0){
			dheight += 70;

			var selectF = dropdown.append('div')
				.attr('style','margin:0px;  padding:5px; height:20px;')
				.html('<b>Filters</b>')	

				.append('select')
				.attr('class','selectFilter')
				.attr('id',d+'_SelectFilter')
				.on('change',selectFilter)

			var options = selectF.selectAll('option')
				.data(showfilts).enter()
				.append('option')
				.text(function (d) { return d; });


			var filtn = 0;
			for (j=0; j<fkeys[d].length; j++){
				var fk = fkeys[d][j]
				if (parts[d][fk] != null){


					dfilters = dropdown.append('div')
						.attr('id',d+'_FK_'+fk+'_END_Filter')
						.attr('class','FilterClass')

					dfilters.append('div')
						.attr('class','FilterClassLabel')

					dfilters.append('div')
						.attr('id',d+'_FK_'+fk+'_END_FilterSlider');

					dfilters.append('input')
						.attr('id',d+'_FK_'+fk+'_END_FilterMinT')
						.attr('class','FilterMinTClass')
						.attr('type','text');

					dfilters.append('input')
						.attr('id',d+'_FK_'+fk+'_END_FilterMaxT')
						.attr('class','FilterMaxTClass')
						.attr('type','text');

					filtn += 1;
				}
				if (filtn > 1){
					d3.selectAll('#'+d+'_FK_'+fk+'_END_Filter')
						.style('display','none');
				}
			}

		} 
		dropdown.style('height',dheight+'px');

/* for color pickers*/
//can I write this in d3? I don't think so.  It needs a jquery object
	$("#"+d+"ColorPicker").spectrum({
	    color: "rgba("+(Pcolors[d][0]*255)+","+(Pcolors[d][1]*255)+","+(Pcolors[d][2]*255)+","+Pcolors[d][3]+")",
	    flat: false,
	    showInput: true,
	    showInitial: false,
	    showAlpha: true,
	    showPalette: false,
	    showSelectionPalette: true,
	    clickoutFiresChange: false,
	    maxSelectionSize: 10,
	    preferredFormat: "rgb",
	    change: function(color) {
	        checkColor(this, color);
	    },
    });

	}

    initNsliders(dovalues=true);


};
