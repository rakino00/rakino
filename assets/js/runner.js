import * as Auth from './auth.js';

/* Saltador — mini game do Rakino.
 * Spritesheets locais e fáceis de trocar:
 * assets/sprites/saltador/player.png
 * assets/sprites/saltador/obstacles.png
 */
export function mountRunner(root) {
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  root.innerHTML = `<div class="runner-card"><div class="runner-head"><div><span class="runner-kicker">MINI GAME</span><h3>Saltador</h3></div><button class="btn btn-primary" data-runner-play>▶ Jogar</button></div><div class="runner-record" aria-live="polite"><span>Recorde: <b data-runner-best>0 m</b></span><span>Por: <b data-runner-holder>—</b></span></div><canvas class="runner-canvas" width="960" height="300" aria-label="Mini jogo Saltador"></canvas><div class="runner-help">Espaço ou clique/toque para saltar · <b>Jogar</b> inicia uma nova partida</div></div>`;
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), play = root.querySelector('[data-runner-play]');
  const bestEl=root.querySelector('[data-runner-best]'), holderEl=root.querySelector('[data-runner-holder]');
  const RECORD_KEY='rakino_saltador_record_v1';
  let currentUser=null, best={score:0,name:'—'};
  try { best=JSON.parse(localStorage.getItem(RECORD_KEY))||best; } catch {}
  const paintBest=()=>{bestEl.textContent=`${Math.floor(best.score||0)} m`;holderEl.textContent=best.name||'indivíduo desconhecido';};
  paintBest();
  const cloud=()=>Auth.ctx();
  const loadCloud=async()=>{const {db,fs}=cloud();if(!db||!fs)return;try{const ref=fs.doc(db,'saltador','record');const snap=await fs.getDoc(ref);if(snap.exists()){const r=snap.data();if(Number(r.score)>Number(best.score)){best={score:Number(r.score)||0,name:r.name||'indivíduo desconhecido'};localStorage.setItem(RECORD_KEY,JSON.stringify(best));paintBest();}}}catch(e){console.warn('[Saltador] recorde online indisponível',e);}};
  let offUser=null;offUser=Auth.onUser(user=>{if(!canvas.isConnected){if(offUser)offUser();return;}currentUser=user;loadCloud();});
  const saveRecord=async score=>{const name=currentUser?(currentUser.displayName||currentUser.email||'indivíduo desconhecido'):'indivíduo desconhecido';if(score<=Number(best.score||0))return;best={score:Math.floor(score),name};window.dispatchEvent(new CustomEvent('rakino:game-score',{detail:{gameId:'saltador',score:Math.floor(score)}}));localStorage.setItem(RECORD_KEY,JSON.stringify(best));paintBest();const {db,fs}=cloud();if(!db||!fs||!currentUser)return;try{const ref=fs.doc(db,'saltador','record');await fs.runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists()||Number(snap.data().score)<Math.floor(score))tx.set(ref,{score:Math.floor(score),name,uid:currentUser.uid,updatedAt:fs.serverTimestamp()});});}catch(e){console.warn('[Saltador] não foi possível sincronizar recorde',e);}};
  const playerSheet = new Image(), obstacleSheet = new Image();
  playerSheet.src = 'assets/sprites/saltador/player.png';
  obstacleSheet.src = 'assets/sprites/saltador/obstacles.png';
  let raf=0, running=false, last=0, score=0, speed=360, next=0, player, obstacles=[], ground=250, frame=0, frameClock=0;
  const reset=()=>{player={x:105,y:ground-44,w:34,h:44,vy:0,onGround:true};obstacles=[];score=0;speed=360;next=.9;frame=0;frameClock=0;};
  const jump=()=>{if(!running){start();return;} if(player.onGround){player.vy=-720;player.onGround=false;}};
  const start=()=>{cancelAnimationFrame(raf);reset();running=true;play.textContent='Reiniciar';last=performance.now();raf=requestAnimationFrame(loop);};
  const drawSprite=(img,frameIndex,x,y,w,h,frames=4)=>{if(!img.complete||!img.naturalWidth){return false;}const sw=img.naturalWidth/frames;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,Math.floor(frameIndex)*sw,0,sw,img.naturalHeight,x,y,w,h);return true;};
  const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);const g=ctx.createLinearGradient(0,0,0,canvas.height);g.addColorStop(0,'#07111a');g.addColorStop(1,'#101827');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(34,211,238,.16)';ctx.lineWidth=1;for(let x=0;x<canvas.width;x+=48){ctx.beginPath();ctx.moveTo(x,ground);ctx.lineTo(x+80,canvas.height);ctx.stroke();}ctx.fillStyle='#22d3ee';ctx.fillRect(0,ground,canvas.width,2);
    if(!drawSprite(playerSheet,frame,player.x,player.y,player.w,player.h)) {ctx.fillStyle='#8b5cf6';ctx.fillRect(player.x,player.y,player.w,player.h);}
    for(const o of obstacles){if(!drawSprite(obstacleSheet,o.frame,o.x,o.y,o.w,o.h)){ctx.fillStyle=o.kind?'#f59e0b':'#f97316';ctx.fillRect(o.x,o.y,o.w,o.h);}}
    ctx.fillStyle='#eafaff';ctx.font='700 18px Segoe UI';ctx.fillText(`DISTÂNCIA ${Math.floor(score)}m`,22,32);
    if(!running){ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#eafaff';ctx.font='800 30px Segoe UI';ctx.fillText('Pressione Jogar ou Espaço',270,150);}
  };
  const spawn=()=>{const h=28+Math.random()*44,w=22+Math.random()*28;obstacles.push({x:canvas.width+20,y:ground-h,w,h,kind:Math.random()>.7,frame:Math.floor(Math.random()*4)});};
  const loop=(now)=>{const dt=Math.min(.032,(now-last)/1000);last=now;player.vy+=1800*dt;player.y+=player.vy*dt;if(player.y>=ground-player.h){player.y=ground-player.h;player.vy=0;player.onGround=true;}speed+=dt*5;score+=dt*speed*.08;frameClock+=dt;if(frameClock>.11){frame=(frame+1)%4;frameClock=0;}next-=dt;if(next<=0){spawn();next=.72+Math.random()*.75;}for(const o of obstacles)o.x-=speed*dt;obstacles=obstacles.filter(o=>o.x+o.w>-20);for(const o of obstacles){if(player.x<o.x+o.w&&player.x+player.w>o.x&&player.y<o.y+o.h&&player.y+player.h>o.y){running=false;saveRecord(score);play.textContent='Tentar novamente';}}draw();if(running&&canvas.isConnected)raf=requestAnimationFrame(loop);};
  play.addEventListener('click',start);canvas.addEventListener('pointerdown',e=>{e.preventDefault();jump();});const onKey=e=>{
    if(!canvas.isConnected){window.removeEventListener('keydown',onKey);return;}   // jogo saiu da tela: solta o listener
    if(e.code!=='Space'||e.repeat)return;
    const t=e.target;
    if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)))return;  // não rouba o espaço de campos de texto
    if(!canvas.offsetParent||document.body.classList.contains('no-scroll'))return;               // aba oculta ou modal aberto
    e.preventDefault();jump();
  };
  window.addEventListener('keydown',onKey);reset();draw();
}
