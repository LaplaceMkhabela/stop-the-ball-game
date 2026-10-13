(()=>{
'use strict';
const TAU=Math.PI*2;
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const $=s=>document.querySelector(s);
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const easeOutBack=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- storage ---------- */
const store={
  data:{best:0,stars:{},unlocked:1,sound:true,name:'',avatar:'',pid:''},
  load(){try{const r=localStorage.getItem('stopTheBall.v2');if(r)Object.assign(this.data,JSON.parse(r));}catch(e){}},
  save(){try{localStorage.setItem('stopTheBall.v2',JSON.stringify(this.data));}catch(e){}}
};
store.load();
if(!store.data.pid){
  store.data.pid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  store.save();
}

/* ---------- audio ---------- */
let AC=null;
function ac(){
  if(!store.data.sound)return null;
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(AC.state==='suspended')AC.resume();
  return AC;
}
function tone(f,d=.15,type='sine',vol=.12,delay=0,slide=0){
  const a=ac();if(!a)return;
  const t0=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),t0+d);
  g.gain.setValueAtTime(.0001,t0);g.gain.linearRampToValueAtTime(vol,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+d+.03);
}
const sfx={
  stop(){tone(240,.07,'square',.05)},
  perfect(){[659,880,1319].forEach((f,i)=>tone(f,.28,'triangle',.12,i*.06))},
  great(){[587,784].forEach((f,i)=>tone(f,.22,'triangle',.11,i*.06))},
  good(){tone(494,.18,'triangle',.1)},
  miss(){tone(190,.38,'sawtooth',.08,0,-110)},
  win(){[523,659,784,1046].forEach((f,i)=>tone(f,.32,'triangle',.12,i*.09))},
  lose(){[330,262,196].forEach((f,i)=>tone(f,.3,'sawtooth',.08,i*.14))},
  tick(){tone(880,.05,'sine',.05)}
};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p);}catch(e){}};

/* ---------- shapes ---------- */
const SHAPES=['circle','square','triangle','diamond','hexagon','star','cross','heart','sparkle','pentagon','octagon'];
const AVATARS=['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝'];
const SHAPE_NAME={circle:'Circle',square:'Square',triangle:'Triangle',diamond:'Diamond',hexagon:'Hexagon',star:'Star',cross:'Cross',heart:'Heart',sparkle:'Sparkle',pentagon:'Pentagon',octagon:'Octagon'};
const PERIOD={circle:0,square:TAU/4,triangle:TAU/3,diamond:TAU/2,hexagon:TAU/6,star:TAU/5,cross:TAU/4,heart:0,sparkle:TAU/4,pentagon:TAU/5,octagon:TAU/8};

function regular(n,R){const p=[];for(let i=0;i<n;i++){const a=-Math.PI/2+i*TAU/n;p.push([Math.cos(a)*R,Math.sin(a)*R]);}return p;}
function starPts(n,Ro,Ri){const p=[];for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n,r=i%2?Ri:Ro;p.push([Math.cos(a)*r,Math.sin(a)*r]);}return p;}
function roundedPoly(c,pts,rad){
  const n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],m0=mid(pts[0],pts[1]);
  c.moveTo(m0[0],m0[1]);
  for(let i=1;i<=n;i++){const p=pts[i%n],q=pts[(i+1)%n],m=mid(p,q);c.arcTo(p[0],p[1],m[0],m[1],rad);}
  c.closePath();
}
function shapePath(c,t,r){
  c.beginPath();
  switch(t){
    case 'circle':c.arc(0,0,r,0,TAU);break;
    case 'square':{const s=.86*r;roundedPoly(c,[[-s,-s],[s,-s],[s,s],[-s,s]],.3*r);break;}
    case 'triangle':roundedPoly(c,regular(3,1.22*r),.2*r);break;
    case 'diamond':roundedPoly(c,[[0,-1.28*r],[.88*r,0],[0,1.28*r],[-.88*r,0]],.14*r);break;
    case 'hexagon':roundedPoly(c,regular(6,1.06*r),.16*r);break;
    case 'pentagon':roundedPoly(c,regular(5,1.1*r),.16*r);break;
    case 'octagon':roundedPoly(c,regular(8,1.05*r),.12*r);break;
    case 'star':roundedPoly(c,starPts(5,1.28*r,.56*r),.12*r);break;
    case 'sparkle':roundedPoly(c,starPts(4,1.4*r,.42*r),.08*r);break;
    case 'cross':{const L=1.06*r,w=.38*r;roundedPoly(c,[[-w,-L],[w,-L],[w,-w],[L,-w],[L,w],[w,w],[w,L],[-w,L],[-w,w],[-L,w],[-L,-w],[-w,-w]],.16*r);break;}
    case 'heart':
      c.moveTo(0,r);
      c.bezierCurveTo(-.35*r,.7*r,-1.15*r,.15*r,-1.15*r,-.35*r);
      c.bezierCurveTo(-1.15*r,-.85*r,-.45*r,-1.15*r,0,-.5*r);
      c.bezierCurveTo(.45*r,-1.15*r,1.15*r,-.85*r,1.15*r,-.35*r);
      c.bezierCurveTo(1.15*r,.15*r,.35*r,.7*r,0,r);
      c.closePath();break;
  }
}

/* ---------- canvas drawing helpers ---------- */
function drawBall(c,t,x,y,r,rot,hue,a=1){
  c.save();c.translate(x,y);c.rotate(rot);c.globalAlpha=a;
  shapePath(c,t,r);
  const g=c.createLinearGradient(-r,-r,r,r);
  g.addColorStop(0,`hsl(${hue} 100% 78%)`);g.addColorStop(1,`hsl(${hue+30} 92% 50%)`);
  c.shadowColor=`hsla(${hue},100%,62%,.85)`;c.shadowBlur=r*.9;
  c.fillStyle=g;c.fill();
  c.shadowBlur=0;
  c.save();c.clip();c.rotate(-rot);
  const hl=c.createRadialGradient(-r*.35,-r*.45,0,-r*.35,-r*.45,r*1.1);
  hl.addColorStop(0,'rgba(255,255,255,.7)');hl.addColorStop(.6,'rgba(255,255,255,0)');
  c.fillStyle=hl;c.fillRect(-r*2,-r*2,r*4,r*4);
  const sh=c.createRadialGradient(r*.3,r*.5,r*.2,r*.3,r*.5,r*1.6);
  sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(20,0,60,.4)');
  c.fillStyle=sh;c.fillRect(-r*2,-r*2,r*4,r*4);
  c.restore();
  shapePath(c,t,r);c.lineWidth=2;c.strokeStyle='rgba(255,255,255,.55)';c.stroke();
  c.restore();
}
function drawTarget(c,t,x,y,r,hue,time,glow,flash,seed){
  c.save();c.translate(x,y);
  shapePath(c,t,r);
  c.fillStyle=`hsla(${hue},100%,72%,${.07+.04*Math.sin(time*3+seed)+flash*.45+glow*.2})`;c.fill();
  c.lineWidth=3;c.setLineDash([11,8]);c.lineDashOffset=-time*16;
  c.strokeStyle=`hsla(${hue},100%,${Math.min(96,80+flash*14)}%,${Math.min(1,.78+glow*.22)})`;
  c.shadowColor=`hsla(${hue},100%,65%,.9)`;c.shadowBlur=10+glow*22+flash*18;
  c.stroke();
  c.setLineDash([]);c.shadowBlur=0;
  const k=(((time*.65+seed)%1)+1)%1,s=1+k*.4;
  c.scale(s,s);shapePath(c,t,r);c.lineWidth=2/s;c.strokeStyle=`hsla(${hue},100%,80%,${(1-k)*.35})`;c.stroke();
  c.restore();
}

/* ---------- paths ---------- */
function tri(u){u=((u%1)+1)%1;return u<.5?-1+4*u:3-4*u;}
const PATHS={
  sweep:u=>[tri(u),0],
  wave:u=>{const x=tri(u);return [x,.6*Math.sin(x*Math.PI*2)];},
  orbit:u=>[Math.cos(u*TAU),Math.sin(u*TAU)],
  eight:u=>[Math.sin(u*TAU),.78*Math.sin(u*TAU*2)],
  weave:u=>[Math.sin(u*TAU*2),.92*Math.sin(u*TAU*3+.4)]
};
let W=800,H=500,dpr=1,R=30,geo={cx:400,cy:250,ax:300,ay:180};
const path={pts:[],cum:[0],total:1,key:'sweep'};
function buildPath(){
  const N=480,fn=PATHS[path.key];
  path.pts=[];path.cum=[0];
  for(let i=0;i<=N;i++){
    const q=fn(i/N),p=[geo.cx+q[0]*geo.ax,geo.cy+q[1]*geo.ay];
    path.pts.push(p);
    if(i){const a=path.pts[i-1];path.cum.push(path.cum[i-1]+Math.hypot(p[0]-a[0],p[1]-a[1]));}
  }
  path.total=path.cum[N]||1;
}
function sample(f){
  f=((f%1)+1)%1;
  const d=f*path.total;let lo=0,hi=path.cum.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(path.cum[m]<=d)lo=m;else hi=m;}
  const seg=(path.cum[hi]-path.cum[lo])||1,t=(d-path.cum[lo])/seg,a=path.pts[lo],b=path.pts[hi];
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}

/* ---------- levels ---------- */
const HUES=[190,265,330,38,150,12,215,345,52,285];
const LEVELS=[
  {shape:'circle',  path:'sweep',speed:8,   tol:1.2, rounds:3,decoys:0,surge:0,  tip:'Stop the ball when it fills the outline.'},
  {shape:'square',  path:'sweep',speed:9.5, tol:1.1, rounds:3,decoys:0,surge:0,  tip:'Same idea, a little faster.'},
  {shape:'triangle',path:'wave', speed:10,  tol:1.05,rounds:4,decoys:0,surge:0,  tip:'The track ripples now.'},
  {shape:'diamond', path:'orbit',speed:10.5,tol:1.0, rounds:4,decoys:0,surge:0,  tip:'Around and around. Find the rhythm.'},
  {shape:'hexagon', path:'wave', speed:11.5,tol:.95, rounds:4,decoys:1,surge:.2, tip:'A decoy appears. Only the matching outline counts.'},
  {shape:'star',    path:'eight',speed:12,  tol:.9,  rounds:5,decoys:1,surge:.2, tip:'A figure-eight track, and a decoy.'},
  {shape:'cross',   path:'weave',speed:12,  tol:.85, rounds:5,decoys:1,surge:.25,tip:'The weave. Tighter outlines.'},
  {shape:'heart',   path:'orbit',speed:13.5,tol:.8,  rounds:5,decoys:2,surge:.3, tip:'Two decoys, and the pace pulses.'},
  {shape:'sparkle', path:'eight',speed:14.5,tol:.78, rounds:5,decoys:2,surge:.3, tip:'Sharp points and fast surges.'},
  {shape:'mixed',   path:'weave',speed:15,  tol:.75, rounds:6,decoys:2,surge:.35,tip:'The ball changes shape every round.'}
];
const MENU_L={speed:9,surge:.2,rounds:0,name:'',shape:'circle'};
function getLevel(n){
  if(n<=10){const L=LEVELS[n-1];return Object.assign({n,name:L.shape==='mixed'?'Shape shift':SHAPE_NAME[L.shape]},L);}
  const k=n-10;
  return {n,name:'Endless',shape:'mixed',path:['weave','eight','orbit','wave'][k%4],speed:Math.min(22,15+k*.6),tol:Math.max(.55,.75-k*.02),rounds:6,decoys:2,surge:.35,tip:'No finish line. How far can you go?'};
}
const hueFor=n=>n<=10?HUES[n-1]:(285+(n-10)*47)%360;

/* ---------- state ---------- */
const G={
  state:'menu',level:1,L:MENU_L,score:0,levelStartScore:0,displayScore:0,lives:3,round:0,combo:0,misses:0,perfects:0,
  f:Math.random(),t:0,speedMult:1,ballShape:'circle',rot:0,target:null,decoys:[],snap:null,res:null,timer:0,lastShape:null,
  hueCur:190,hueTarget:190,shake:0,flash:0,bonus:0,pausedFrom:null
};
const trail=[],particles=[],rings=[],popups=[];
const dust=Array.from({length:RM?28:70},()=>({x:Math.random(),y:Math.random(),s:Math.random()*1.8+.4,v:Math.random()*.6+.25,p:Math.random()*TAU}));

/* ---------- DOM ---------- */
const canvas=$('#cv'),ctx=canvas.getContext('2d'),stage=$('#stage');
const ov=$('#ov'),card=$('#card'),stopBtn=$('#stopBtn'),comboEl=$('#combo'),live=$('#live');
const whoAvatarEl=$('#whoAvatar'),whoNameEl=$('#whoName'),pauseBtn=$('#btnPause'),hudActions=$('#hudActions'),fab=$('#fab'),speedBar=$('#speedBar');
const HEART='<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2 0 3.4 1.1 5.3 3 1.9-1.9 3.3-3 5.3-3 3.7 0 5.800 3.900 4.300 7.300C19.500 16.400 12 21 12 21z"/></svg>';
const say=t=>{live.textContent=t;};
function buildPips(){$('#pips').innerHTML=Array.from({length:G.L.rounds||0},(_,i)=>`<i class="${i<G.round?'done':''}"></i>`).join('');}
function buildLives(){$('#lives').innerHTML=Array.from({length:3},(_,i)=>HEART.replace('<svg','<svg class="'+(i<G.lives?'':'lost')+'"')).join('');}
function updateHUD(){
  whoAvatarEl.textContent=store.data.avatar||'🍏';
  whoNameEl.textContent=store.data.name||'Player';
  if(G.state==='menu'){$('#lvlName').textContent='';$('#lvlNum').textContent='–';}
  else{$('#lvlName').textContent=G.L.name;$('#lvlNum').textContent=G.level;}
  buildPips();buildLives();syncPause();
}
let viewToken=0,fabOpen=false;
function setFab(open){
  if(fabOpen===open)return;
  fabOpen=open;
  fab.setAttribute('aria-expanded',open?'true':'false');
  fab.setAttribute('aria-label',open?'Hide controls':'Show controls');
  hudActions.classList.toggle('open',open);
}
function showCard(html){viewToken++;setFab(false);card.innerHTML=html;ov.classList.add('show');document.body.classList.add('overlay-open');const b=card.querySelector('.btn.primary');if(b)setTimeout(()=>b.focus({preventScroll:true}),30);}
function hideCard(){ov.classList.remove('show');document.body.classList.remove('overlay-open');}
function syncPause(){
  const p=G.state==='paused',can=p||G.state==='play'||G.state==='intro';
  pauseBtn.disabled=!can;
  pauseBtn.classList.toggle('paused',p);
  pauseBtn.setAttribute('aria-label',p?'Resume':'Pause');
}
function togglePause(){
  if(G.state==='paused'){
    G.state=G.pausedFrom||'play';G.pausedFrom=null;
    hideCard();syncPause();say('Resumed');
  }else if(G.state==='play'||G.state==='intro'){
    G.pausedFrom=G.state;G.state='paused';
    showCard(`<h2>Paused</h2>
      <p class="lede">Level ${G.level} &middot; Score ${G.score.toLocaleString()}</p>
      <div class="actions"><button class="btn primary" data-act="resume">Resume</button><button class="btn" data-act="replay">Restart level</button><button class="btn" data-act="menu">Quit to menu</button></div>`);
    syncPause();say('Paused');
  }
}

/* ---------- leaderboard ---------- */
const LOCAL_LB_KEY='stopTheBall.leaderboard';
const rank=(a,b)=>b.score-a.score||a.ts-b.ts;
function localEntries(){
  try{const raw=localStorage.getItem(LOCAL_LB_KEY);const list=raw?JSON.parse(raw):[];return Array.isArray(list)?list:[];}
  catch(e){return [];}
}
function cacheLocal(entry){
  const list=localEntries(),i=list.findIndex(e=>e.pid===entry.pid);
  if(i>=0){if(entry.score>list[i].score)list[i]=entry;}else list.push(entry);
  list.sort(rank);
  try{localStorage.setItem(LOCAL_LB_KEY,JSON.stringify(list.slice(0,50)));}catch(e){}
}
async function submitScore(){
  if(!store.data.name||!store.data.avatar||G.score<=0)return;
  const entry={pid:store.data.pid,name:store.data.name,avatar:store.data.avatar,score:Math.round(G.score),level:G.level,ts:Date.now()};
  cacheLocal(entry);
  try{await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)});}catch(e){}
}
async function loadLeaderboard(){
  try{
    const res=await fetch('/api/scores',{headers:{'Accept':'application/json'}});
    if(!res.ok)throw new Error('status '+res.status);
    const data=await res.json();
    if(!data||!Array.isArray(data.entries))throw new Error('bad payload');
    return {entries:data.entries,online:true};
  }catch(e){
    return {entries:localEntries().sort(rank).slice(0,20),online:false};
  }
}
async function showLeaderboard(){
  G.state='menu';
  showCard(`<h2>Leaderboard</h2><p class="lede">Loading scores&hellip;</p>`);
  const token=viewToken;
  const {entries,online}=await loadLeaderboard();
  if(token!==viewToken)return;
  const list=entries.slice(0,20);
  const rows=list.map((e,i)=>{
    const me=e.pid===store.data.pid?' me':'';
    return `<li class="lb-row${me}"><span class="lb-rank">${i+1}</span><span class="lb-av">${escapeHtml(e.avatar||'🍏')}</span><span class="lb-name">${escapeHtml(e.name||'Player')}</span><span class="lb-lvl">Lv ${e.level||1}</span><span class="lb-score">${(Number(e.score)||0).toLocaleString()}</span></li>`;
  }).join('');
  const lede=online?'Global top players':(list.length?'Offline &mdash; scores saved on this device':'No scores yet. Be the first!');
  showCard(`<h2>Leaderboard</h2>
    <p class="lede">${lede}</p>
    ${list.length?`<ol class="lb">${rows}</ol>`:''}
    <div class="actions"><button class="btn primary" data-act="menu">Back to menu</button></div>`);
}

/* ---------- geometry ---------- */
function resize(){
  const r=stage.getBoundingClientRect();
  W=Math.max(200,r.width);H=Math.max(200,r.height);
  dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  R=clamp(Math.min(W,H)*.075,18,36);
  const M=R*2.1;
  geo={cx:W/2,cy:H/2,ax:Math.max(40,W/2-M),ay:Math.max(30,H/2-M)};
  buildPath();
}

/* ---------- game flow ---------- */
function setupRound(){
  const L=G.L;
  G.speedMult=1+.035*G.round;
  let shape=L.shape;
  if(shape==='mixed')shape=pick(SHAPES.filter(s=>s!==G.lastShape));
  G.lastShape=shape;G.ballShape=shape;G.snap=null;G.res=null;
  const need=1+L.decoys,minD=R*2.9,placed=[];
  for(let i=0;i<need;i++){
    let best=null;
    for(let k=0;k<80&&!best;k++){
      const f=Math.random(),p=sample(f);let ok=true;
      if(i===0){const d=(((f-G.f)%1)+1)%1;if(Math.min(d,1-d)<.14)ok=false;}
      for(const q of placed)if(Math.hypot(p[0]-q.x,p[1]-q.y)<minD)ok=false;
      if(ok)best={f,x:p[0],y:p[1]};
    }
    if(!best){const f=Math.random(),p=sample(f);best={f,x:p[0],y:p[1]};}
    placed.push(best);
  }
  G.target={f:placed[0].f,shape,seed:Math.random()*6,flash:0,glow:0};
  const pool=shuffle(SHAPES.filter(s=>s!==shape));
  G.decoys=placed.slice(1).map((p,i)=>({f:p.f,shape:pool[i],seed:Math.random()*6,flash:0}));
  buildPips();
}
function startLevel(n,base){
  const L=getLevel(n);
  G.L=L;G.level=n;G.score=G.levelStartScore=base||0;G.displayScore=G.score;
  G.lives=3;G.round=0;G.combo=0;G.misses=0;G.perfects=0;G.snap=null;G.res=null;G.timer=0;G.lastShape=null;G.target=null;G.rot=0;G.shake=0;G.flash=0;
  G.hueTarget=hueFor(n);
  path.key=L.path;buildPath();G.f=Math.random();
  trail.length=0;particles.length=0;rings.length=0;popups.length=0;
  setupRound();G.state='intro';
  hideCard();updateHUD();sfx.tick();
  say(`Level ${n}. ${L.tip}`);
}
let onboardAvatar='';
function showOnboarding(){
  G.state='menu';G.L=MENU_L;G.target=null;G.decoys=[];G.hueTarget=190;G.speedMult=1;G.lives=3;G.round=0;G.score=0;G.displayScore=0;G.combo=0;
  path.key='weave';buildPath();
  trail.length=0;particles.length=0;rings.length=0;popups.length=0;
  const d=store.data;
  onboardAvatar=d.avatar||'';
  const grid=AVATARS.map(a=>`<button class="avatar ${a===onboardAvatar?'on':''}" data-act="avatar" data-avatar="${a}" aria-label="Avatar ${a}" aria-pressed="${a===onboardAvatar}">${a}</button>`).join('');
  showCard(`<h1>Welcome</h1>
    <p class="lede">Pick a name and a fruit avatar to get started.</p>
    <label class="field"><span>Player name</span><input id="playerName" class="name-input" type="text" maxlength="16" autocomplete="nickname" placeholder="Your name" value="${escapeHtml(d.name)}"></label>
    <div class="avatars">${grid}</div>
    <div class="actions"><button class="btn primary" data-act="save-player" disabled>Start playing</button></div>`);
  updateOnboard();
  updateHUD();
}
function updateOnboard(){
  const input=card.querySelector('#playerName'),btn=card.querySelector('[data-act="save-player"]');
  if(!input||!btn)return;
  btn.disabled=!(input.value.trim()&&onboardAvatar);
}
function showMenu(){
  G.state='menu';G.L=MENU_L;G.target=null;G.decoys=[];G.hueTarget=190;G.speedMult=1;G.lives=3;G.round=0;G.score=0;G.displayScore=0;G.combo=0;
  path.key='weave';buildPath();
  trail.length=0;particles.length=0;rings.length=0;popups.length=0;
  const d=store.data,next=Math.min(10,d.unlocked);
  let grid='';
  for(let i=1;i<=10;i++){
    const locked=i>d.unlocked,st=d.stars[i]||0;
    grid+=`<button class="lv" data-act="level" data-n="${i}" ${locked?'disabled':''} aria-label="Level ${i}${locked?' locked':''}"><span class="num">${i}</span><canvas width="88" height="88" data-lv="${i}"></canvas><span class="st">${st?'★'.repeat(st):''}</span></button>`;
  }
  const who=d.name?`<p class="player"><span class="player-av">${d.avatar||'🍏'}</span><span>${escapeHtml(d.name)}</span><button class="link" data-act="change-player">Change</button></p>`:'';
  showCard(`<h1>Stop the Ball</h1>
    ${who}
    <p class="lede">Freeze the ball on the outline that matches its shape. Ten levels, three lives each.</p>
    <button class="btn primary" data-act="play">${d.unlocked>1?'Continue at level '+next:'Start playing'}</button>
    <div class="levels">${grid}</div>
    <p class="best">Best score: ${d.best.toLocaleString()}</p>
    <div class="actions"><button class="btn" data-act="leaderboard">Leaderboard</button></div>`);
  card.querySelectorAll('canvas[data-lv]').forEach(cv=>{
    const n=+cv.dataset.lv,L=LEVELS[n-1],c=cv.getContext('2d');
    c.translate(44,44);
    if(L.shape==='mixed'){
      c.fillStyle=`hsl(${HUES[n-1]} 100% 75%)`;c.font='800 44px Unbounded, system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('?',0,3);
    }else drawBall(c,L.shape,0,0,19,0,HUES[n-1],1);
  });
  updateHUD();
}
function burst(x,y,shape,hue,n,spd=1){
  if(RM)n=Math.ceil(n/3);
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,s=rand(90,380)*spd;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0,max:rand(.55,1.1),size:rand(.1,.3)*R,rot:Math.random()*TAU,vr:rand(-8,8),hue:hue_(hue+rand(-25,25)),shape});
  }
}
const hue_=h=>Math.round((h+360)%360);
function popup(x,y,text,color,size){popups.push({x,y,text,color,size:size||Math.max(15,R*.62),life:0,max:1.1});}

function stop(){
  if(G.state!=='play')return;
  ac();
  const L=G.L,b=sample(G.f),tp=sample(G.target.f),d=Math.hypot(b[0]-tp[0],b[1]-tp[1]),tolPx=L.tol*R;
  G.state='result';G.timer=0;
  const hue=Math.round(G.hueCur);
  if(d<=tolPx){
    const tier=d<=Math.max(.28*tolPx,.2*R)?'perfect':d<=.6*tolPx?'great':'good';
    if(tier==='good')G.combo=0;else G.combo++;
    if(tier==='perfect')G.perfects++;
    const base={perfect:300,great:200,good:100}[tier];
    const pts=Math.round(base*(1+.25*Math.min(Math.max(G.combo-1,0),8))*(1+.1*(Math.min(L.n,10)-1)));
    G.score+=pts;
    const per=PERIOD[G.ballShape];
    const rot1=per?Math.round(G.rot/per)*per:(G.ballShape==='heart'?0:G.rot);
    G.snap={x0:b[0],y0:b[1],x1:tp[0],y1:tp[1],r0:G.rot,r1:rot1,t:0};
    G.res={ok:true,tier};
    G.target.flash=1;
    burst(tp[0],tp[1],G.ballShape,hue,{perfect:40,great:28,good:16}[tier]);
    rings.push({x:tp[0],y:tp[1],shape:G.ballShape,t:0,max:.7});
    const label={perfect:'Perfect',great:'Great',good:'Good'}[tier];
    popup(tp[0],clamp(tp[1]-R*1.9,26,H-26),`${label} +${pts}`,tier==='perfect'?'hsl(48 100% 75%)':tier==='great'?`hsl(${hue} 100% 82%)`:'#fff');
    sfx[tier]();buzz(tier==='perfect'?[18,30,18]:14);say(`${label}, plus ${pts}`);
  }else{
    let wrong=false;
    for(const dc of G.decoys){const dp=sample(dc.f);if(Math.hypot(b[0]-dp[0],b[1]-dp[1])<=tolPx){wrong=true;dc.flash=1;}}
    G.lives--;G.misses++;G.combo=0;
    G.res={ok:false,wrong};
    G.target.flash=1;
    if(!RM)G.shake=14;G.flash=1;
    const msg=wrong?'Wrong shape':'Missed';
    popup(b[0],clamp(b[1]-R*1.9,26,H-26),msg,'hsl(350 100% 74%)');
    sfx.miss();buzz(90);say(msg);buildLives();
  }
  sfx.stop();
}
function nextStep(){
  const L=G.L;
  if(G.res.ok){G.round++;buildPips();if(G.round>=L.rounds){completeLevel();return;}}
  else if(G.lives<=0){gameOver();return;}
  setupRound();G.state='play';
}
function completeLevel(){
  const L=G.L,n=L.n,d=store.data;
  G.state='complete';
  G.bonus=G.lives*100+Math.min(n,10)*50;G.score+=G.bonus;
  const stars=Math.max(1,3-G.misses);
  d.stars[n]=Math.max(d.stars[n]||0,stars);
  if(n<=10)d.unlocked=Math.max(d.unlocked,Math.min(10,n+1));
  d.best=Math.max(d.best,G.score);store.save();
  submitScore();
  for(let i=0;i<5;i++)burst(rand(W*.15,W*.85),rand(H*.2,H*.7),pick(SHAPES),Math.round(G.hueCur),22,.8);
  sfx.win();buzz([30,40,30,40,60]);say(`Level ${n} clear`);
  const starsHtml=`<div class="stars" aria-label="${stars} of 3 stars">${[1,2,3].map(i=>`<span class="star ${i<=stars?'on':''}" style="--i:${i}">★</span>`).join('')}</div>`;
  const stats=`<dl class="stats"><div><dt>Score</dt><dd>${G.score.toLocaleString()}</dd></div><div><dt>Perfect stops</dt><dd>${G.perfects}</dd></div><div><dt>Bonus</dt><dd>+${G.bonus}</dd></div></dl>`;
  if(n===10){
    showCard(`<h2>All 10 levels cleared</h2>${starsHtml}${stats}
      <div class="actions"><button class="btn primary" data-act="endless">Keep going</button><button class="btn" data-act="replay">Replay level</button><button class="btn" data-act="menu">Menu</button></div>`);
  }else{
    showCard(`<h2>Level ${n} clear</h2>${starsHtml}${stats}
      <div class="actions"><button class="btn primary" data-act="next">Next level</button><button class="btn" data-act="replay">Replay</button><button class="btn" data-act="menu">Menu</button></div>`);
  }
}
function gameOver(){
  G.state='over';
  const d=store.data;d.best=Math.max(d.best,G.score);store.save();
  submitScore();
  sfx.lose();say('Out of lives');
  showCard(`<h2>Out of lives</h2>
    <p class="lede">You reached round ${G.round+1} of ${G.L.rounds} on level ${G.level}. Score ${G.score.toLocaleString()}.</p>
    <div class="actions"><button class="btn primary" data-act="replay">Retry level</button><button class="btn" data-act="leaderboard">Leaderboard</button><button class="btn" data-act="menu">Menu</button></div>`);
}

/* ---------- input ---------- */
card.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  ac();
  const a=b.dataset.act;
  if(a==='play')startLevel(Math.min(10,store.data.unlocked),0);
  else if(a==='level')startLevel(+b.dataset.n,0);
  else if(a==='next')startLevel(G.level+1,G.score);
  else if(a==='replay')startLevel(G.level,G.levelStartScore);
  else if(a==='endless')startLevel(11,G.score);
  else if(a==='menu')showMenu();
  else if(a==='avatar'){
    onboardAvatar=b.dataset.avatar;
    card.querySelectorAll('.avatar').forEach(el=>{const on=el.dataset.avatar===onboardAvatar;el.classList.toggle('on',on);el.setAttribute('aria-pressed',on);});
    updateOnboard();
  }
  else if(a==='save-player'){
    const input=card.querySelector('#playerName'),val=(input?input.value:'').trim();
    if(!val||!onboardAvatar)return;
    store.data.name=val.slice(0,16);store.data.avatar=onboardAvatar;store.save();
    showMenu();
  }
  else if(a==='resume')togglePause();
  else if(a==='leaderboard')showLeaderboard();
  else if(a==='change-player')showOnboarding();
});
card.addEventListener('input',e=>{if(e.target&&e.target.id==='playerName')updateOnboard();});
card.addEventListener('keydown',e=>{if(e.target&&e.target.id==='playerName'&&e.key==='Enter'){const btn=card.querySelector('[data-act="save-player"]');if(btn&&!btn.disabled)btn.click();}});
stage.addEventListener('pointerdown',e=>{if(fabOpen)return;if(e.target.closest('.overlay.show'))return;e.preventDefault();stop();});
stopBtn.addEventListener('pointerdown',e=>{e.preventDefault();stop();});
fab.addEventListener('click',e=>{e.stopPropagation();ac();setFab(!fabOpen);});
hudActions.addEventListener('click',()=>setFab(false));
document.addEventListener('pointerdown',e=>{
  if(!fabOpen)return;
  if(e.target.closest('#fab')||e.target.closest('#hudActions'))return;
  setFab(false);
});
document.addEventListener('keydown',e=>{
  if((e.code==='Space'||e.code==='Enter')&&G.state==='play'){e.preventDefault();stop();}
  else if((e.code==='KeyP'||e.key==='Escape')&&(G.state==='play'||G.state==='intro'||G.state==='paused')){e.preventDefault();togglePause();}
});
$('#btnPause').addEventListener('click',()=>{ac();togglePause();});
$('#btnMenu').addEventListener('click',()=>{ac();showMenu();});
$('#btnRestart').addEventListener('click',()=>{ac();if(G.state!=='menu')startLevel(G.level,G.levelStartScore);});
$('#who').addEventListener('click',()=>{ac();showOnboarding();});
const sndBtn=$('#btnSound');
const syncSound=()=>{sndBtn.classList.toggle('off',!store.data.sound);};
sndBtn.addEventListener('click',()=>{store.data.sound=!store.data.sound;store.save();syncSound();if(store.data.sound){ac();sfx.tick();}});
syncSound();

/* ---------- update ---------- */
let lastHue=-1,lastScore=-1,lastSpeed='',lastIdle=null,lastCombo=-1,lastState=null;
function update(dt){
  if(G.state!==lastState){lastState=G.state;syncPause();}
  if(G.state==='paused')return;
  G.t+=dt;
  const dh=((G.hueTarget-G.hueCur+540)%360)-180;
  G.hueCur=(G.hueCur+dh*Math.min(1,dt*3)+360)%360;
  const hr=Math.round(G.hueCur);
  if(hr!==lastHue){lastHue=hr;document.documentElement.style.setProperty('--h',hr);}
  G.displayScore+=(G.score-G.displayScore)*Math.min(1,dt*8);
  if(Math.abs(G.score-G.displayScore)<1)G.displayScore=G.score;
  const sc=Math.round(G.displayScore);
  if(sc!==lastScore){lastScore=sc;$('#score').textContent=sc.toLocaleString();}
  const L=G.L;
  const sp='×'+((L.speed||8)*G.speedMult/8).toFixed(1);
  if(sp!==lastSpeed){lastSpeed=sp;$('#speed').textContent=sp;speedBar.style.width=(Math.min(1,(L.speed||8)*G.speedMult/22)*100).toFixed(0)+'%';}
  const idle=G.state!=='play';
  if(idle!==lastIdle){lastIdle=idle;stopBtn.classList.toggle('idle',idle);}
  if(G.combo!==lastCombo){lastCombo=G.combo;comboEl.textContent=`Streak ${G.combo}`;comboEl.classList.toggle('show',G.combo>=2);}

  const moving=G.state==='menu'||G.state==='intro'||G.state==='play';
  if(moving){
    const v=(L.speed||8)*R*G.speedMult*(1+(L.surge||0)*Math.sin(G.t*1.7));
    G.f=(G.f+v*dt/path.total)%1;
    const shape=G.state==='menu'?SHAPES[Math.floor(G.t/2.2)%SHAPES.length]:G.ballShape;
    if(G.state==='menu')G.ballShape=shape;
    if(shape==='heart')G.rot=Math.sin(G.t*4)*.18;
    else if(PERIOD[shape])G.rot+=dt*2.2;
    else G.rot=0;
    const p=sample(G.f);
    trail.push({x:p[0],y:p[1],rot:G.rot,shape,age:0});
  }
  for(let i=trail.length-1;i>=0;i--){trail[i].age+=dt;if(trail[i].age>.32)trail.splice(i,1);}

  if(G.state==='intro'){G.timer+=dt;if(G.timer>1.5){G.state='play';G.timer=0;syncPause();}}
  else if(G.state==='play'&&G.target){
    if(G.L.decoys===0){
      const b=sample(G.f),tp=sample(G.target.f),d=Math.hypot(b[0]-tp[0],b[1]-tp[1]),tol=G.L.tol*R*1.25;
      G.target.glow+=((d<tol?1-d/tol:0)-G.target.glow)*Math.min(1,dt*14);
    }
  }else if(G.state==='result'){
    G.timer+=dt;
    if(G.snap)G.snap.t+=dt;
    if(G.timer>(G.res.ok?1.0:1.2))nextStep();
  }
  if(G.target){G.target.flash=Math.max(0,G.target.flash-dt*(G.state==='result'?1.2:2.5));if(G.state!=='play')G.target.glow*=.9;}
  for(const d of G.decoys)d.flash=Math.max(0,d.flash-dt*1.5);
  G.shake*=Math.pow(.001,dt);if(G.shake<.2)G.shake=0;
  G.flash=Math.max(0,G.flash-dt*2.2);
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life+=dt;if(p.life>p.max){particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt);p.rot+=p.vr*dt;}
  for(let i=rings.length-1;i>=0;i--){rings[i].t+=dt;if(rings[i].t>rings[i].max)rings.splice(i,1);}
  for(let i=popups.length-1;i>=0;i--){popups[i].life+=dt;if(popups[i].life>popups[i].max)popups.splice(i,1);}
}

/* ---------- draw ---------- */
function drawDust(c,hue){
  c.save();c.globalCompositeOperation='lighter';c.fillStyle=`hsl(${hue+20} 90% 85%)`;
  for(const d of dust){
    const y=(((d.y-G.t*.012*d.v)%1)+1)%1,x=d.x+Math.sin(G.t*.3+d.p)*.01;
    c.globalAlpha=.12+.3*Math.pow(Math.sin(G.t*d.v*1.5+d.p),2);
    c.beginPath();c.arc(x*W,y*H,d.s,0,TAU);c.fill();
  }
  c.restore();
}
function draw(){
  const c=ctx,hue=Math.round(G.hueCur);
  c.save();c.clearRect(0,0,W,H);
  if(G.shake>.2)c.translate(rand(-1,1)*G.shake,rand(-1,1)*G.shake);
  const g=c.createRadialGradient(W/2,H*.45,0,W/2,H/2,Math.max(W,H)*.75);
  g.addColorStop(0,`hsl(${hue} 50% 21%)`);g.addColorStop(.55,`hsl(${hue+15} 55% 11%)`);g.addColorStop(1,`hsl(${hue+30} 60% 5%)`);
  c.fillStyle=g;c.fillRect(-30,-30,W+60,H+60);
  drawDust(c,hue);

  // track
  c.save();c.lineCap='round';c.lineJoin='round';c.setLineDash([.1,15]);c.lineWidth=3.4;c.strokeStyle=`hsla(${hue},90%,85%,.3)`;
  c.beginPath();for(let i=0;i<path.pts.length;i++){const p=path.pts[i];i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.stroke();c.restore();

  // targets
  if(G.target&&G.state!=='menu'){
    for(const d of G.decoys){const p=sample(d.f);drawTarget(c,d.shape,p[0],p[1],R,hue,G.t,0,d.flash,d.seed);}
    const tp=sample(G.target.f);
    drawTarget(c,G.target.shape,tp[0],tp[1],R,hue,G.t,G.target.glow,G.target.flash,G.target.seed);
  }

  // rings
  for(const r of rings){
    const k=r.t/r.max,s=1+k*1.4;
    c.save();c.translate(r.x,r.y);c.scale(s,s);shapePath(c,r.shape,R);c.lineWidth=3/s;c.strokeStyle=`hsla(${hue},100%,85%,${(1-k)*.8})`;c.stroke();c.restore();
  }

  // trail
  c.save();c.globalCompositeOperation='lighter';
  for(const t of trail){
    const k=1-t.age/.32;
    c.save();c.translate(t.x,t.y);c.rotate(t.rot);shapePath(c,t.shape,R*(.5+.45*k));c.fillStyle=`hsla(${hue},100%,62%,${k*.2})`;c.fill();c.restore();
  }
  c.restore();

  // ball
  if(G.state!=='menu'||true){
    let bx,by,rot=G.rot,r=R,a=1;
    if(G.state==='result'&&G.snap){
      const p=easeOutBack(clamp(G.snap.t/.22,0,1));
      bx=G.snap.x0+(G.snap.x1-G.snap.x0)*p;by=G.snap.y0+(G.snap.y1-G.snap.y0)*p;
      rot=G.snap.r0+(G.snap.r1-G.snap.r0)*clamp(G.snap.t/.22,0,1);
      r=R*(1+.16*Math.sin(clamp(G.snap.t/.35,0,1)*Math.PI));
    }else{
      const p=sample(G.f);bx=p[0];by=p[1];
      if(G.state==='result'&&G.res&&!G.res.ok){bx+=Math.sin(G.timer*70)*6*Math.max(0,1-G.timer*1.6);a=.85;}
      if(G.state==='complete'||G.state==='over')a=.9;
    }
    drawBall(c,G.ballShape,bx,by,r,rot,hue,a);
  }

  // particles
  c.save();c.globalCompositeOperation='lighter';
  for(const p of particles){
    const k=1-p.life/p.max;
    c.save();c.translate(p.x,p.y);c.rotate(p.rot);shapePath(c,p.shape,p.size*(.4+.6*k));c.fillStyle=`hsla(${p.hue},100%,68%,${k})`;c.fill();c.restore();
  }
  c.restore();

  // popups
  c.save();c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  for(const p of popups){
    const k=p.life/p.max,a=k<.7?1:1-(k-.7)/.3,sc=.6+.4*easeOutBack(clamp(k*5,0,1));
    c.save();c.globalAlpha=a;c.translate(p.x,p.y-k*28);c.scale(sc,sc);
    c.font=`800 ${p.size}px Unbounded, system-ui, sans-serif`;
    c.lineWidth=5;c.strokeStyle='rgba(10,5,30,.6)';c.strokeText(p.text,0,0);
    c.fillStyle=p.color;c.fillText(p.text,0,0);c.restore();
  }
  c.restore();

  // intro banner
  if(G.state==='intro'){
    const p=G.timer/1.5,al=p<.18?p/.18:p>.8?Math.max(0,(1-p)/.2):1;
    c.save();c.globalAlpha=al;c.textAlign='center';c.textBaseline='middle';
    c.shadowColor='rgba(5,0,25,.85)';c.shadowBlur=24;
    const ty=Math.max(R*2.2,H*.27)+(1-al)*10;
    c.fillStyle='#fff';c.font=`800 ${clamp(W*.07,30,60)}px Unbounded, system-ui, sans-serif`;
    c.fillText(`Level ${G.level}`,W/2,ty);
    c.fillStyle=`hsl(${hue} 100% 82%)`;c.font=`600 ${clamp(W*.022,14,18)}px Manrope, system-ui, sans-serif`;
    const words=G.L.tip;c.fillText(words,W/2,ty+clamp(W*.05,28,44));
    c.restore();
  }

  // miss flash
  if(G.flash>0){c.fillStyle=`rgba(255,50,90,${G.flash*.16})`;c.fillRect(-30,-30,W+60,H+60);}
  c.restore();
}

/* ---------- loop ---------- */
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  update(dt);draw();
  requestAnimationFrame(frame);
}
resize();
if(window.ResizeObserver)new ResizeObserver(()=>resize()).observe(stage);
window.addEventListener('resize',resize);
if(store.data.name&&store.data.avatar)showMenu();else showOnboarding();
requestAnimationFrame(frame);
})();
