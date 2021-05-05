
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
let velShape;
let velStableShape;

let velScene;
let velStableScene;

let velTexture;
let velStableTexture;

// draw
let drawShape;
let drawScene;

//time for some thyme
let t = 0;

// SHADERS
let clickShader;
let advShader;
let mainShader;

pointer = new THREE.Vector2();
pointer_start = new THREE.Vector2();
prev_pointer = new THREE.Vector2();
direction = new THREE.Vector2();
var clickNow = false;

document.addEventListener( 'pointermove', onPointerMove );
document.addEventListener( 'onmousemove', onPointerMove );
document.addEventListener( 'mousedown', clickStart );
document.addEventListener( 'mouseup', clickEnd );


function advFluid (time) {
  renderer.setRenderTarget (fluidStableTexture);
  advShader.uniforms.SceneTexture.value = fluidTexture;
  advShader.uniforms.advTexture.value = velTexture;
  advShader.uniforms.dt.value = time;
  fluidStableShape.material = advShader;
  renderer.render (fluidStableScene, camera);
  renderer.setRenderTarget (null);
  //reset shader
  advShader.uniforms.SceneTexture.value = null;
  advShader.uniforms.advTexture.value = null;
  advShader.uniforms.dt.value = 0.0;
}


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
    direction.x = pointer.x-prev_pointer.x;
    direction.y = pointer.y-prev_pointer.y;
    //make the sahder
  clickShader.uniforms.SceneTexture.value = velTexture;
  clickShader.uniforms.clickPos.value = new THREE.Vector2 (pointer[0], pointer[1]);
  console.log("dir", direction.x, direction.y)
  clickShader.uniforms.clickVal.value = new THREE.Vector4 (
    //direction.x * 999999999999999999,
   // direction.y * 99999999999999999,
    0.7,
    0.6
  );
  velStableShape.material = clickShader;
  renderer.render (velStableScene, camera);
  renderer.setRenderTarget (null);

  var t = velTexture;
  velTexture = velStableTexture;
  velStableTexture = t;
  velShape.material.map = velStableTexture;
  velStableShape.material.map = velTexture;

  clickShader.uniforms.SceneTexture.value = null;
}



function onPointerMove (event) {
     pointer.x = ( event.clientX / window.innerWidth );
     pointer.y = 1-( event.clientY / window.innerHeight );
     if (clickNow == true){
           addFluid(pointer.x, pointer.y);
           pushFluid(pointer, prev_pointer);
           prev_pointer = pointer;
     }
 }
 function clickStart(event){
    pointer_start.x = (event.clientX/window.innerWidth);
    pointer_start.y = (event.clientY/window.innerHeight);
      clickNow = true;
 }
function clickEnd(event){
    pushFluid(pointer_start, pointer);
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


  velShape = new THREE.Mesh (geometry);
  velScene = new THREE.Scene ();
  velScene.add (velShape);

  velStableShape = new THREE.Mesh (geometry);
  velStableScene = new THREE.Scene ();
  velStableScene.add (velStableShape);

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
  velTexture = new THREE.WebGLRenderTarget (window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    internalFormat: 'RGBA32F',
  });
  velStableTexture = new THREE.WebGLRenderTarget (
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
  //Code for here is similar to/draws from:
  // https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial
  // https://forum.unity.com/threads/2d-fluid-shader.187671/
  // https://github.com/dushyantbehl/2D-fluid-simulation/blob/master/pShader.cg
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

function advectShadeCode(){
    return "precision highp float;\
      uniform sampler2D SceneTexture;\
      uniform sampler2D advTexture;\
      uniform float dt;\
      uniform vec2 inverseCanvasSize;\
      uniform bool isVelocity;\
      \
      vec4 f4texRECTbilerp(sampler2D tex, vec2 s)//todo: wtf is this doing??; why does the intenet love it?\
      {\
        vec4 st;\
        st.xy = floor(s - 0.5) + 0.5;\
        st.zw = st.xy + 1.0;\
        \
        vec2 t = s - st.xy;\
        //interpolation over neighbors \
        vec4 tex11 = texture2D(tex, st.xy * inverseCanvasSize);\
        vec4 tex21 = texture2D(tex, st.zy * inverseCanvasSize);\
        vec4 tex12 = texture2D(tex, st.xw * inverseCanvasSize);\
        vec4 tex22 = texture2D(tex, st.zw * inverseCanvasSize);\
        \
        return mix(mix(tex11, tex21, t.x), mix(tex12, tex22, t.x), t.y);\
      }\
      \
      void main()\
      {\
          vec2 pos = gl_FragCoord.xy - dt  * texture2D(advTexture, gl_FragCoord.xy * inverseCanvasSize).xy;\
          gl_FragColor = f4texRECTbilerp(SceneTexture, pos);\
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

    advShader = new THREE.ShaderMaterial ({
    uniforms: {
      dt: {value:0.0},
      SceneTexture: {type: 't', value: null},
      advTexture: {type: 't', value: null},
      clickPos: {type: 'v2', value: null},
      clickVal: {type: 'v4', value: null},
      clickRadius: {value: 50},
      inverseCanvasSize: {
        type: 'v2',
        value: new THREE.Vector2 (1.0 / window.innerWidth, 1.0 / window.innerHeight),
      },
    },
    fragmentShader: click_frag_shader(),
    opacity: 1.0,
    blending: THREE.NoBlending,
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

    advFluid(t);

    var tempVel = velTexture;
  velTexture = velStableTexture;
  velStableTexture = tempVel;
  velShape.material.map = velStableTexture;
  velStableShape.material.map = velTexture;

  renderer.clear ();
   t+= 0.01;
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
