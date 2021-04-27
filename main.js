

pointer = new THREE.Vector2();
var clickNow = false;

document.addEventListener( 'pointermove', onPointerMove );
document.addEventListener( 'mousedown', clickStart );
document.addEventListener( 'mouseup', clickEnd );
document.addEventListener( 'touchstart', touching );
document.addEventListener( 'touchend', touchFinish );

function onPointerMove (event) {
     pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
     pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

 }
 function clickStart(event){
      console.log("click");
 }
function clickEnd(event){
      console.log("clickend");
 }

function touching(event){
      console.log("touching");
      clickNow = true;
 }

 function touchFinish(event){
      console.log("touchingfin");
      clickNow = false;
 }