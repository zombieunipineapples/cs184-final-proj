
//AAAAAAAAAAAAAAAAAAAAAAAAHHHHHHHHHHHHHHHHHHHHHHHHHHh

let scene, camera, renderer;

// fluid
let fluidShape;
let fluidStableShape;

let fluidScene;
let fluidStableScene;

let fluidTexture;
let fluidStableTexture;

// VELOCITY
let velocityShape;
let velocityStableShape;

let velocityScene;
let velocityStableScene;

let velocityTexture;
let velocityStableTexture;

// draw
let drawShape;
let drawScene;

// SHADERS
let clickShader;

let mainShader;

pointer = new THREE.Vector2();
prev_pointer = new THREE.Vector2();
var clickNow = false;

document.addEventListener( 'pointermove', onPointerMove );
document.addEventListener( 'onmousemove', onPointerMove );
document.addEventListener( 'mousedown', clickStart );
document.addEventListener( 'mouseup', clickEnd );


function addFluid (posX, posY) {
  renderer.setRenderTarget (fluidStableTexture);
  clickShader.uniforms.SceneTexture.value = fluidTexture;
  clickShader.uniforms.clickPos.value = new THREE.Vector2 (posX, posY);
  clickShader.uniforms.clickVal.value = new THREE.Vector4 (
    1.0,
    .5,
    .7,
    0.8
  );
  clickShader.uniforms.isVelocity.value = false;
  fluidStableShape.material = clickShader;
  renderer.render (fluidStableScene, camera);
  renderer.setRenderTarget (null);

  var t = fluidTexture;
  fluidTexture = fluidStableTexture;
  fluidStableTexture = t;
  fluidShape.material.map = fluidTexture;
  fluidStableShape.material.map = fluidStableTexture;

  clickShader.uniforms.SceneTexture.value = null;
}

function pushFluid(pointer, prev_pointer){
    direction = pointer-prev_pointer
     renderer.setRenderTarget (velStableTexture);
    //make the sahder
  clickShader.uniforms.bufferTexture.value = velTexture;
  clickShader.uniforms.clickPos.value = new THREE.Vector2 (posX, posY);
  clickShader.uniforms.clickVal.value = new THREE.Vector4 (
    dirX,
    dirY,
    0.0,
    0.0
  );
  velocityStableShape.material = splatShader;
  renderer.render (velocityStableBuffer, camera);
  renderer.setRenderTarget (null);

  var t = velocityTexture;
  velocityTexture = velocityStableTexture;
  velocityStableTexture = t;
  velocityShape.material.map = velocityStableTexture;
  velocityStableShape.material.map = velocityTexture;

  clickShader.uniforms.SceneTexture.value = null;
}

}

function onPointerMove (event) {
     pointer.x = ( event.clientX / window.innerWidth );
     pointer.y = ( event.clientY / window.innerHeight );
     if (clickNow == true){
     console.log("POINTER", pointer.x, pointer.y);
           addFluid(pointer.x, pointer.y);
           prev_pointer = pointer;
     }
 }
 function clickStart(event){
      clickNow = true;
 }
function clickEnd(event){
      clickNow = false;
 }

function buildScenes () {
  const geometry = new THREE.PlaneBufferGeometry (window.innerWidth, window.innerHeight);

  fluidShape = new THREE.Mesh (geometry);
  fluidScene = new THREE.Scene ();
  fluidScene.add (fluidShape);

  fluidStableShape = new THREE.Mesh (geometry);
  fluidStableScene = new THREE.Scene ();
  fluidStableScene.add (fluidStableShape);


  drawShape = new THREE.Mesh (geometry);
  drawScene = new THREE.Scene ();
  drawScene.background = null;
  drawScene.add (drawShape);
}

function buildTex () {
  fluidTexture = new THREE.WebGLRenderTarget (window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    internalFormat: 'RGBA32F',
  });
  fluidStableTexture = new THREE.WebGLRenderTarget (
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      internalFormat: 'RGBA32F',
    }
  );
  velocityTexture = new THREE.WebGLRenderTarget (window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    internalFormat: 'RGBA32F',
  });
  velocityStableTexture = new THREE.WebGLRenderTarget (
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      internalFormat: 'RGBA32F',
    }
  );

}
//The shader jazzzzzz
  //Code for here is largely from https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial
function click_frag_shader(){
    return"precision highp float;\
      uniform sampler2D SceneTexture;\
      uniform vec2  clickPos;\
      uniform vec4  clickVal;\
      uniform float clickRadius;\
      uniform vec2 inverseCanvasSize;\
      \
      void main()\
      {\
          vec2 coord = gl_FragCoord.xy * inverseCanvasSize;\
          gl_FragColor = texture2D(SceneTexture, coord) * 0.999;\
          vec2 dist = coord - clickPos;\
          dist.x *= inverseCanvasSize.y / inverseCanvasSize.x;\
          gl_FragColor += clickVal * smoothstep(inverseCanvasSize.x * clickRadius, 0.0, length(dist));\
      } ";
}

function vertShadeCode(){
    return "varying vec2 TexCoord;\
      void main(void)\
      {\
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);\
        gl_Position = projectionMatrix * modelViewPosition;\
        TexCoord = uv;\
      }"
}
function buildShaders () {
  clickShader = new THREE.ShaderMaterial ({
    uniforms: {
      SceneTexture: {type: 't', value: fluidTexture},
      clickPos: {type: 'v2', value: null},
      clickVal: {type: 'v4', value: null},
      clickRadius: {value: 50},
      inverseCanvasSize: {
        type: 'v2',
        value: new THREE.Vector2 (1.0 / window.innerWidth, 1.0 / window.innerHeight),
      },
      isVelocity: {value: false},
    },
    fragmentShader: click_frag_shader(),
    opacity: 1.0,
    blending: THREE.NoBlending,
  });


  mainShader = new THREE.ShaderMaterial ({
    uniforms: {
      inputTexture: {type: 't', value: fluidTexture},
      inverseCanvasSize: {
        type: 'v2',
        value: new THREE.Vector2 (1.0 / window.innerWidth, 1.0 / window.innerHeight),
      },
    },
    vertexShader: vertShadeCode(),
    fragmentShader:"precision highp float;\
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

function start () {

   //basic initialization of 3js image--from their quickstart guide

  camera = new THREE.OrthographicCamera (
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerHeight / -2,
    1,
    1000
  );

  camera.position.z = 2;

  renderer = new THREE.WebGLRenderer ({alpha: true});
  renderer.setClearColor (0x202020, 1.0);
  renderer.setSize (
    window.innerWidth ,
    window.innerHeight 
  );

  document.body.appendChild (renderer.domElement);

  buildScenes ();
  buildShaders ();
  buildTex ();
}

function animate () {
  requestAnimationFrame (animate);

    //this code pattern is from here https://dev.to/maniflames/creating-a-custom-shader-in-threejs-3bhi
    //lets us mutate the fluidtex and have a stable copy
  var tempfluid = fluidTexture;
  fluidTexture = fluidStableTexture;
  fluidStableTexture = tempfluid;
  fluidShape.material.map = fluidStableTexture;
  fluidStableShape.material.map = fluidTexture;

  renderer.clear ();

  draw ();
}


function draw () {
  renderer.setRenderTarget (null);
  mainShader.uniforms.inputTexture.value = fluidTexture;
  drawShape.material = mainShader;
  drawShape.material.transparent = true;
  renderer.render (drawScene, camera);
}



start ();
animate ();
