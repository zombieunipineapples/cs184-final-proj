

pointer = new THREE.Vector2();
prev_pointer = new THREE.Vector2();
var clickNow = false;

document.addEventListener( 'pointermove', onPointerMove );
document.addEventListener( 'mousedown', clickStart );
document.addEventListener( 'mouseup', clickEnd );
/*
document.addEventListener( 'touchstart', touching );
document.addEventListener( 'touchend', touchFinish );
*/
function onPointerMove (event) {
     pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
     pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
     if (clickNow == true){
           addFluid(pointer.x, pointer.y);
           addMotion(pointer, prev_pointer)
           prev_pointer = pointer;
     }
 }
 function clickStart(event){
      console.log("click");
      clickNow = true;
 }
function clickEnd(event){
      console.log("clickend");
      clickNow = false;
 }
 //general vars
 let renderer;
 let camera; 
 let scene;
 //Declare fluid variables
 //I'm not sure what all of these are, but it doesn't load if we don't have all of em, and the back ones are helpful for doing some of the computations.

let fluidShape;
let fluidBackShape;

let fluidScene;
let fluidBackScene;

let fluidTexture;
let fluidBackTexture;

let velShape;
let velBackShape;

let velBuffer;
let velBackBuffer;

let velTexture;
let velBackTexture;

let mainVizShape;
let mainVizBuffer;

let mainShader;
let clickShader;

function vertShadeCode(){
    return "varying vec2 TexCoord;\
      void main(void)\
      {\
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);\
        gl_Position = projectionMatrix * modelViewPosition;\
        TexCoord = uv;\
      }"
}
function launchAttributes(){
   
    //initialize parts of a fluid that we'll need for rendering
    fluidTexture = new THREE.WebGLRenderTarget (window.innerWidth, window.innerHeight, 
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType,
        internalFormat: 'RGBA32F',
  });
  fluidBackTexture = new THREE.WebGLRenderTarget (window.innerWidth, window.innerHeight,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.FloatType,
        internalFormat: 'RGBA32F',
    });
    // set up fluid Scene
  fluidShape = new THREE.Mesh (geometry);
  fluidScene = new THREE.Scene ();
  fluidScene.add (fluidShape);

  // set up fluid backup Scene
  fluidBackShape = new THREE.Mesh (geometry);
  fluidBackScene = new THREE.Scene ();
  fluidBackScene.add (fluidBackShape);
  // set up vel scene
  velShape = new THREE.Mesh (geometry);
  velScene = new THREE.Scene ();
  velScene.add (velShape);

  // set up spare vel other scene
  velBackShape = new THREE.Mesh (geometry);
  velBackScene = new THREE.Scene ();
  velBackScene.add (velBackShape);


   velTexture = new THREE.WebGLRenderTarget (window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    internalFormat: 'RGBA32F',
  });
  velBackTexture = new THREE.WebGLRenderTarget (
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      internalFormat: 'RGBA32F',
    }
  );
  //The shader for the fluid
  //Code for here is largely from https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial

    clickShader = new THREE.ShaderMaterial ({
    uniforms: {
      bufferTexture: {type: 't', value: fluidTexture},
      clickPos: {type: 'v2', value: null},
      clickColorMod: {type: 'v4', value: null},
      //should this be adjustible?
      clickRadius: {value: 50},
      inverseCanvasSize: {
        type: 'v2',
        value: new THREE.Vector2 (1.0 / window.innerWidth, 1.0 / window.innerHeight),
      },
    },
    fragmentShader: "uniform vec4 clickColorMod; void main() {gl_FragColor = clickColorMod; }",
    opacity: 1.0,
    blending: THREE.NoBlending,
  });

    mainVizShape = new THREE.Mesh (geometry);
  mainVizBuffer = new THREE.Scene ();
  mainVizBuffer.background = null;
  mainVizBuffer.add (mainVizShape);
    mainShader = new THREE.ShaderMaterial ({
    uniforms: {
      inputTexture: {type: 't', value: fluidTexture},
      inverseCanvasSize: {
        type: 'v2',
        value: new THREE.Vector2 (1.0 / window.innerWidth, 1.0 / window.innerHeight),
      },
    },
    vertexShader: vertShadeCode(),
    fragmentShader: "precision highp float;\
      varying vec2 TexCoord;\
      uniform sampler2D inputTexture;\
      void main()\
      {\
        gl_FragColor = vec4(texture2D(inputTexture, TexCoord).g, texture2D(inputTexture, TexCoord).b, sin(texture2D(inputTexture, TexCoord).g / texture2D(inputTexture, TexCoord).b * cos(texture2D(inputTexture, TexCoord).r)) , texture2D(inputTexture, TexCoord).r);\
      }",
    opacity: 1.0,
    blending: THREE.NormalBlending,
  });

 }

function addFluid(x, y) {
  renderer.setRenderTarget (fluidBackTexture);
  renderer.render (fluidBackScene, camera);
  renderer.setRenderTarget (null);

  var t = fluidTexture;
  fluidTexture = fluidBackTexture;
  fluidBackTexture = t;
 

  clickShader.uniforms.bufferTexture.value = fluidTexture;
  clickShader.uniforms.clickPos.value = new THREE.Vector2 (pointer.x, pointer.y);
  clickShader.uniforms.clickColorMod.value = new THREE.Vector4 (
    1.0,
    1.0,
    .3,
    0.0
  );
    fluidBackShape.material = clickShader;

  fluidShape.material.map = fluidTexture;
  fluidBackShape.material.map = fluidBackTexture;

    clickShader.uniforms.bufferTexture.value = null;
}


function addMotion(curr_pos, last_pos) {
  motion_x = last_pos.x-curr_pos.x;
  motion_y = last_pos.y-curr_pos.y;
  renderer.setRenderTarget (velBackTexture);
  clickShader.uniforms.bufferTexture.value = velTexture;
  clickShader.uniforms.clickPos.value = new THREE.Vector2 (curr_pos.x, curr_pos.y);
  clickShader.uniforms.clickColorMod.value = new THREE.Vector4 (
    motion_x * 250000,
    motion_y * 250000,
    1.0,
    0.0
  );
  velBackShape.material = clickShader;
  renderer.render (velBackScene, camera);
  renderer.setRenderTarget (null);

  var t = velTexture;
  velTexture = velBackTexture;
  velBackTexture = t;
  velShape.material.map = velBackTexture;
  velBackShape.material.map = velTexture;

  clickShader.uniforms.bufferTexture.value = null;
}

function mainViz () {
  renderer.setRenderTarget (null);
  mainShader.uniforms.inputTexture.value = fluidTexture;
  mainVizShape.material = mainShader;
  mainVizShape.material.transparent = true;
  renderer.render (mainVizBuffer, camera);
}
//needs this to render anything
function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

  //this code pattern is from here https://dev.to/maniflames/creating-a-custom-shader-in-threejs-3bhi
  //I don't fully understand it but it doesn't work without the two textures?
  var tempfluid = fluidTexture;
  fluidTexture = fluidBackTexture;
  fluidBackTexture = tempfluid;
  fluidShape.material.map = fluidBackTexture;
  fluidBackShape.material.map = fluidTexture;

   var tempVel = velTexture;
  velTexture = velBackTexture;
  velBackTexture = tempVel;
  velShape.material.map = velBackTexture;
  velBackShape.material.map = velTexture;

  mainViz();
  //E TODO: mainViz function
}


//initiate a bunch of stuff

const geometry = new THREE.PlaneBufferGeometry (window.innerWidth, window.innerHeight);
   //basic initialization of 3js image--from their quickstart guide
     scene = new THREE.Scene();
     camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth/ 2,  window.innerHeight / 2,  window.innerHeight / - 2, 1, 1000 );
    camera.position.z = 5;

     renderer = new THREE.WebGLRenderer({alpha: true});
        //<!--A nice gray background-->
        renderer.setClearColor (0x3F3F3F, 1.0);
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );
 launchAttributes();

animate();
