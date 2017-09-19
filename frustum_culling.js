var rcvecs = [];
var rnvecs = [];
var fc,nc,pcl,pcr,pcu,pcd;
var fn,nn,pln,prn,pun,pdn;

function initFrustumPlanes(){
    // geometry stuff, setting up coordinate system 

    var ratio = gl.viewportWidth / gl.viewportHeight;

    var Hnear = 2. * Math.tan(degToRad(fov) / 2) * zmin;
    var Wnear = Hnear * ratio

    var Hfar = 2. * Math.tan(degToRad(fov) / 2) * zmax
    var Wfar = Hfar * ratio

    var d = [0.,0.,-1.];
    var up = [0.,1.,0.];
    var right = [1.,0.,0.];

    //far and near plane center points for frustum
    fc = [0.,0.,zmax*d[2]];
    fn = d;
    
    nc = [0.,0.,zmin*d[2]];
    nn = scaleVector(-1.,d);
    
    //far plane cardinal points
    fl = addVectors(fc,scaleVector(-Wfar/2.,right))
    fr = addVectors(fc,scaleVector(Wfar/2.,right))
    fu = addVectors(fc,scaleVector(Hfar/2.,up))
    fd = addVectors(fc,scaleVector(-Hfar/2.,up))

    // get vectors to cardinal points from camera (at [0,0,0] but in principle would 
    // subtract camera location)
    fln = normalizeVector(fl)
    frn = normalizeVector(fr)
    fun = normalizeVector(fu)
    fdn = normalizeVector(fd)

    // get plane normal vectors by crossing two vectors that live in the plane
    pln = crossProduct(up,fln);
    prn = crossProduct(frn,up);
    pun = crossProduct(right,fun);
    pdn = crossProduct(fdn,right);

    //length to walk backwards from cardinal points in order to find the center of the plane
    var ddist = (zmax - zmin)/2.

    // get plane center points
    pcl = addVectors(fl,scaleVector(-ddist,fln))
    pcr = addVectors(fr,scaleVector(-ddist,frn))
    pcu = addVectors(fu,scaleVector(-ddist,fun))
    pcd = addVectors(fd,scaleVector(-ddist,fdn))
}

/* ############# MATH FUNCTIONS ################ */
function crossProduct(x,y){
    return [x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]]
}

function addVectors(x,y){
    return [x[0]+y[0],x[1]+y[1],x[2]+y[2]]
}

function scaleVector(c,x){
    return [c*x[0],c*x[1],c*x[2]]
}

function normalizeVector(x){
    var norm = Math.sqrt(x[0]*x[0]+x[1]*x[1]+x[2]*x[2])
    return scaleVector(1./norm,x)
}

function dotVectors(x,y){
    return [x[0]*y[0],x[1]*y[1],x[2]*y[2]]
}

function createInverseMatrices(){
    mymatrix = mat4.create()
    mynormalmatrix = mat4.create()
    mat4.identity(mynormalmatrix)
    mat4.rotate(mynormalmatrix, degToRad(yrot), [1, 0, 0]);
    mat4.rotate(mynormalmatrix, degToRad(xrot), [0, 1, 0]);
    mat4.inverse(mynormalmatrix,mynormalmatrix)

    //create the inverse for moving the center points, normal vectors don't move, they just rotate
    mat4.set(mynormalmatrix,mymatrix)
    mat4.translate(mymatrix, scaleVector(-1,camerapos));//center));
    return mymatrix,mynormalmatrix;
}

function myInverse(x){
    // apply the inverse transformation from perspective space to 
    // data space for a plane center point, x
    var myvector = vec3.create();
    vec3.set(x,myvector);
    mat4.multiplyVec3(mymatrix,myvector,myvector);

    return myvector;
}

function myNormalInverse(x){
    // apply the inverse transformation from perspective space to 
    // data space for a plane normal vector, x
    var myvector = vec3.create();
    vec3.set(x,myvector);
    mat4.multiplyVec3(mynormalmatrix,myvector,myvector);
    return myvector;
}

/* ############ FRUSTUM FUNCTIONS ############### */
function rotateFrustum(){
    // update the arrays rcvecs and rnvecs (rotated center and normal vectors)
    // to define the frustum's location in data space

    //create inverse rotation matrices
    createInverseMatrices();

    // loop through each center vector/normal vector
    rcvecs = [fc,nc,pcl,pcr,pcu,pcd];
    rnvecs = [fn,nn,pln,prn,pun,pdn];
    //console.log("rotateFrustum in", rcvecs, rnvecs)
    for (var i=0; i<rnvecs.length; i++){
        // rotate the plane centers
        rcvecs[i] = myInverse(rcvecs[i])
        // rotate the plane normal vectors (doesn't need to be translated)
        rnvecs[i] = myNormalInverse(rnvecs[i])
    }
    //console.log("rotateFrustum out", rcvecs, rnvecs)
}

function testPointInFrustum(coord){
    // use the rotated vectors calculated earlier as input
    var boolTest = true;
    var intest = true;
    for (var i=0; i < rnvecs.length; i++){
        // short circuit if it's already failed
        intest = (((coord[0] + center[0]- rcvecs[i][0])*rnvecs[i][0] + (coord[1] + center[1] - rcvecs[i][1])*rnvecs[i][1] + (coord[2] + center[2] - rcvecs[i][2])*rnvecs[i][2]) <= 0)
        boolTest = boolTest&&intest;
        //console.log(coord,(coord[0]- rcvecs[i][0])*rnvecs[i][0], (coord[1]- rcvecs[i][1])*rnvecs[i][1], (coord[2]- rcvecs[i][2])*rnvecs[i][2], (coord[0]- rcvecs[i][0])*rnvecs[i][0] + (coord[1]- rcvecs[i][1])*rnvecs[i][1] + (coord[2]- rcvecs[i][2])*rnvecs[i][2], boolTest);
 		//console.log(coord,rcvecs[i], rnvecs[i], intest, boolTest)
    }
    //if (boolTest){
    //	console.log("plotting", coord)
    //}
    return boolTest
}


/* ############### invocation of functions ################# */
/*function drawScene() {
    rotateFrustum();
    for (var i; i<npoints;i++){
        // see if this point lives in the camera
            if (testPointInFrustrum(myparts.coords[i],rcvecs,rnvecs)){
                drawParticle()
    }
}

function webGLStart() {
    initFrustumPlanes();
}
*/   

