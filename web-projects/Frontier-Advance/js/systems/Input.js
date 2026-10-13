export class Input{
 constructor(canvas){this.keys=new Set();this.touch={x:0,z:0};this.lookTouch=null;this.canvas=canvas;
 this._kd=e=>this.keys.add(e.code);this._ku=e=>this.keys.delete(e.code);window.addEventListener('keydown',this._kd);window.addEventListener('keyup',this._ku);
 canvas.addEventListener('click',()=>{if(matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.()});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)this.onLook?.(e.movementX,e.movementY)});
 this.joystick();this.mobileLook();this._context=e=>e.preventDefault();canvas.addEventListener('contextmenu',this._context);canvas.style.touchAction='none';}
 joystick(){const j=document.querySelector('#joystick'),s=j?.firstElementChild;if(!j)return;let id=null,r;
 j.onpointerdown=e=>{id=e.pointerId;j.setPointerCapture(id);r=j.getBoundingClientRect();move(e)};
 j.onpointermove=e=>{if(e.pointerId===id)move(e)};const end=()=>{id=null;this.touch={x:0,z:0};s.style.transform='translate(0,0)'};
 j.onpointerup=end;j.onpointercancel=end;
 const move=e=>{let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.32,l=Math.hypot(dx,dy)||1,k=Math.min(1,max/l);s.style.transform=`translate(${dx*k}px,${dy*k}px)`;this.touch={x:dx*k/max,z:dy*k/max}}}
 mobileLook(){const el=this.canvas;let active=null,lastX=0,lastY=0;
 el.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.clientX<innerWidth*.38||e.target.closest?.('button'))return;active=e.pointerId;lastX=e.clientX;lastY=e.clientY;try{el.setPointerCapture(active)}catch{}});
 el.addEventListener('pointermove',e=>{if(active!==e.pointerId)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;this.onLook?.(dx,dy)});
 const end=e=>{if(active===e.pointerId)active=null};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);}
 movement(){let x=this.touch.x,z=this.touch.z;if(this.keys.has('KeyA'))x--;if(this.keys.has('KeyD'))x++;if(this.keys.has('KeyW'))z--;if(this.keys.has('KeyS'))z++;let l=Math.hypot(x,z);return l>1?{x:x/l,z:z/l}:{x,z}}
 dispose(){window.removeEventListener('keydown',this._kd);window.removeEventListener('keyup',this._ku);this.canvas?.removeEventListener('contextmenu',this._context)}
}
