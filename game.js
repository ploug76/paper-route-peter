const DAYS=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'],NL=16,LOT=200,PY=.7;
let day=1,subs=[],lots=[],obs=[],papers=[],items=[],fx=[],dist=0,px=0,spd=0,want=1,bikes=3,np=10,inv=0,phase='',phT=0,dayStats={d:0,m:0},routeLen=0,crashT=0,tossCD=0,ped=0;
const HCOL=['#e8d8a8','#a8c8e8','#e8b8a8','#c8e8b8','#f0e0f0','#f8e8a0'];
function onResize(){if(!px)px=W/2}
function RX(){return 80*S}function SW(){return 24*S}
function sy(wy){return H*PY-(wy-dist)*S}
function startGame(lv){score=0;day=lv;bikes=3;subs=[];for(let i=0;i<NL*2;i++)subs.push(R()<.7);state='play';startDay();ui()}
function startDay(){lots=[];obs=[];papers=[];items=[];fx=[];dist=0;px=W/2;want=1;np=10;inv=60;phase='ride';phT=0;dayStats={d:0,m:0,sub:subs.filter(s=>s).length};
 for(let i=0;i<NL*2;i++){const side=i%2?1:-1,k=i>>1;lots.push({side,wy:400+k*LOT+(side>0?LOT/2:0),sub:subs[i],idx:i,done:0,miss:0,col:HCOL[(i*7+day)%HCOL.length],mbox:0})}
 routeLen=400+NL*LOT+300;const dens=Math.min(.9,.32+day*.06);
 for(let wy=500;wy<routeLen-200;wy+=110){if(R()>dens)continue;const r=R();let o;
  if(r<.3)o={k:'car',x:(R()<.5?-1:1)*(RX()/S-22),w:34,h:62,col:PICK(['#d83c3c','#3c6cd8','#e8c83c','#888'])};
  else if(r<.48)o={k:'cone',x:(R()-.5)*2*(RX()/S-10),w:16,h:16};
  else if(r<.62)o={k:'drain',x:(R()-.5)*2*(RX()/S-20),w:30,h:20};
  else if(r<.8)o={k:'dog',x:(R()<.5?-1:1)*(RX()/S+12),w:24,h:20,vx:0,act:0};
  else o={k:'skate',x:R()<.5?-150:150,w:22,h:26,vx:0,act:0};
  o.wy=wy+R()*60;obs.push(o)}
 for(let i=0;i<3;i++)items.push({wy:700+i*(NL*LOT/3)+R()*200,x:(R()-.5)*120});say(DAYS[(day-1)%7]+(day>7?' WK'+Math.ceil(day/7):''),110);SND.start()}
function toss(dir){if(state!='play'||phase!='ride'||np<=0||tossCD>0||crashT>0)return;np--;tossCD=12;papers.push({x:px,wy:dist+10,vx:dir*(7.5+Math.abs(spd)*.6)*S,t:0,dir,spin:0});SND.toss()}
function crash(){if(inv>0||crashT>0)return;crashT=80;bikes--;SND.crash();for(let i=0;i<14;i++)fx.push({x:px,y:H*PY,vx:(R()-.5)*6*S,vy:(R()-.5)*6*S,l:40,c:PICK(['#fff','#f8d838','#d83c3c'])})}
function land(p){const ax=p.x-W/2,side=ax<0?-1:1;if(Math.abs(ax)<RX()+SW()){fx.push({s:'MISS',x:p.x,y:sy(p.wy),t:0});return}
 let best=null,bd=1e9;for(const l of lots){if(l.side!=side)continue;const d=Math.abs(l.wy-p.wy);if(d<bd){bd=d;best=l}}
 if(!best||bd>LOT/2-10){fx.push({s:'MISS',x:p.x,y:sy(p.wy),t:0});return}
 if(!best.sub){fx.push({s:'NOT A SUBSCRIBER',x:p.x,y:sy(p.wy),t:0});SND.thunk();return}
 if(best.done){fx.push({s:'GOT ONE',x:p.x,y:sy(p.wy),t:0});return}
 const mbx=W/2+side*(RX()+SW()+16*S),mbw=best.wy-LOT*.3;const m=Math.hypot(p.x-mbx,(p.wy-mbw)*S)<34*S;
 best.done=1;best.mbox=m;dayStats.d++;const pts=m?250:100;score+=pts;saveBest();fx.push({s:(m?'MAILBOX! +':'+')+pts,x:p.x,y:sy(p.wy),t:0,c:m?'#f8d838':'#fff'});m?SND.mail():SND.thunk()}
function update(){for(const f of fx){f.t=(f.t||0)+1;if(f.l){f.x+=f.vx;f.y+=f.vy;f.l--}}fx=fx.filter(f=>f.l?f.l>0:f.t<60);
 if(state!='play')return;phT++;if(tossCD>0)tossCD--;
 if(phase=='review'){if(phT>200){if(bikes<=0||subs.every(s=>!s)){state='over';overT=t;saveBest();ui();SND.over()}else{day++;startDay()}}return}
 if(crashT>0){crashT--;spd*=.9;if(crashT==0){if(bikes<=0){state='over';overT=t;saveBest();ui();SND.over();return}inv=120;obs=obs.filter(o=>Math.abs(o.wy-dist)>160)}}
 else{const base=2.4+Math.min(day,14)*.12,tgt=base*(kSlow?.55:kFast?1.6:want);spd+=(tgt-spd)*.06;
  const lim=W/2+RX()+SW()-12*S;let dx=(kR-kL)*5*S;px=CL(px+dx,W-lim,lim)}
 if(inv>0)inv--;dist+=spd;
 for(const p of papers){p.t++;p.x+=p.vx;p.vx*=.95;p.wy+=spd*.75;p.spin+=.4;if(p.t==34)land(p)}papers=papers.filter(p=>p.t<34);
 for(const o of obs){const oy=sy(o.wy);if(oy<-100||oy>H+100)continue;
  if(o.k=='dog'){if(!o.act&&oy>H*.25){o.act=1;SND.bark()}if(o.act){const tx=(px-W/2)/S;o.x+=CL(tx-o.x,-1.4,1.4);o.wy+=1.2}}
  if(o.k=='skate'){if(!o.act&&oy>H*.3){o.act=1;o.vx=o.x<0?2.2:-2.2}o.x+=o.vx}
  const ox=W/2+o.x*S;if(Math.abs(ox-px)<(o.w/2+9)*S&&Math.abs(oy-H*PY)<(o.h/2+14)*S)crash()}
 for(const it of items){if(it.got)continue;const iy=sy(it.wy),ix=W/2+it.x*S;if(Math.abs(ix-px)<26*S&&Math.abs(iy-H*PY)<26*S){it.got=1;np=Math.min(20,np+10);fx.push({s:'+10 PAPERS',x:ix,y:iy,t:0,c:'#8cf'});SND.pick()}}
 for(const l of lots){if(l.sub&&!l.done&&!l.miss&&sy(l.wy-LOT*.45)>H+10){l.miss=1;dayStats.m++;fx.push({s:'CANCELLED!',x:W/2+l.side*W*.3,y:H*.92,t:0,c:'#f86c6c'});SND.cancel()}}
 if(dist>routeLen){phase='review';phT=0;for(const l of lots)if(l.miss)subs[l.idx]=false;
  if(dayStats.m==0&&dayStats.d>0){const off=subs.map((s,i)=>s?-1:i).filter(i=>i>=0);if(off.length)subs[PICK(off)]=true;score+=1000*Math.ceil(day/7);dayStats.perfect=1;SND.perfect()}else SND.start();
  score+=dayStats.d*20;saveBest()}}
function house(l){const y=sy(l.wy),side=l.side,xs=W/2+side*(RX()+SW()),far=side<0?0:W,lw=Math.abs(far-xs);
 if(y<-LOT*S||y>H+LOT*S)return;
 g.fillStyle=l.sub?'#4cb04c':'#5c8c4c';g.fillRect(Math.min(xs,far),y-LOT*S/2,lw,LOT*S-4*S);
 g.fillStyle='#d8c8a0';const pathX=xs+side*lw*.55;g.fillRect(Math.min(xs,pathX),y-6*S,Math.abs(pathX-xs),12*S);
 const hw=Math.min(lw*.62,140*S),hx=side<0?Math.max(6*S,xs-lw*.4-hw):Math.min(W-6*S-hw,xs+lw*.4),hh=LOT*S*.62,hy=y-hh/2;
 g.fillStyle=l.sub?l.col:'#6a6a6a';g.fillRect(hx,hy,hw,hh);g.fillStyle=l.sub?'#a83c2c':'#3a3a3a';g.beginPath();g.moveTo(hx-6*S,hy+hh*.5);g.lineTo(hx+hw/2,hy-10*S);g.lineTo(hx+hw+6*S,hy+hh*.5);g.lineTo(hx+hw/2,hy+hh+10*S);g.closePath();g.fill();
 g.fillStyle='rgba(0,0,0,.25)';g.fillRect(hx+hw/2-1.5*S,hy-8*S,3*S,hh+16*S);
 if(l.sub&&!l.done){g.fillStyle='#f8d838';rr(hx+hw/2-14*S,y-12*S,28*S,24*S,5*S);g.fill();txt('★',hx+hw/2,y,16*S,'#a83c2c')}
 if(l.done)txt('✓',hx+hw/2,y,26*S,'#fff','#2c8c4c');if(l.miss)txt('✗',hx+hw/2,y,26*S,'#f86c6c','#000');
 const mx=W/2+side*(RX()+SW()+16*S),my=sy(l.wy-LOT*.3);g.fillStyle='#555';g.fillRect(mx-2*S,my,4*S,12*S);g.fillStyle=l.sub?(l.mbox?'#f8d838':'#2c5cc8'):'#444';rr(mx-9*S,my-10*S,18*S,12*S,4*S);g.fill();if(l.sub&&!l.mbox){g.fillStyle='#d83c3c';g.fillRect(mx+(side<0?7:-9)*S,my-16*S,2*S,8*S)}}
// Peter bust portrait: hand-drawn vector cartoon (outlined), drawn from scratch with canvas paths.
// (cx,by) = bottom centre of the bust, h = bust height. ctx passed explicitly.
function drawPeterPortrait(x2,cx,by,h,t){t=t||0;const u=h/100,K='#3a2418';x2.save();x2.translate(cx,by);x2.scale(u,u);x2.lineJoin='round';x2.lineCap='round';
 const P=(pts,fill,lw,close)=>{lw=lw===undefined?2.2:lw;x2.beginPath();x2.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++){const q=pts[i];if(q.length==6)x2.bezierCurveTo(q[0],q[1],q[2],q[3],q[4],q[5]);else if(q.length==4)x2.quadraticCurveTo(q[0],q[1],q[2],q[3]);else x2.lineTo(q[0],q[1])}if(close!==false)x2.closePath();if(fill){x2.fillStyle=fill;x2.fill()}if(lw){x2.strokeStyle=K;x2.lineWidth=lw;x2.stroke()}};
 const E=(x,y,rx,ry,fill,lw,rot)=>{lw=lw===undefined?2.2:lw;x2.beginPath();x2.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);if(fill){x2.fillStyle=fill;x2.fill()}if(lw){x2.strokeStyle=K;x2.lineWidth=lw;x2.stroke()}};
 const L=(pts,col,lw)=>{P(pts,null,0,false);x2.strokeStyle=col;x2.lineWidth=lw;x2.stroke()};
 const SKIN='#f0b493',SK2='#d8916f',ROSE='rgba(222,104,92,.38)',HAIR='#7c6c5e',HAIR2='#a99d92',HAIR3='#5e5044',BR='#7a6450',BEARD='#d6d1c8',BEARD2='#b4ac9f',MUS='#93816e',SHIRT='#e8542c',SH2='#b8401e',STRAP='#8a5a2c';
 const blink=((t*0.5)%4)>3.85;
 // shoulders: orange paperboy shirt, white tee collar, newspaper-bag strap
 P([[-48,0],[-48,-12,-40,-20],[-30,-27,-17,-28],[17,-28],[30,-27,40,-20],[48,-12,48,0]],SHIRT);
 L([[-34,-20],[-30,-10,-31,0]],SH2,1.6);L([[34,-20],[30,-10,31,0]],SH2,1.6);
 P([[-17,-28],[-9,-21,0,-20],[9,-21,17,-28],[11,-30],[0,-27],[-11,-30]],'#f4f0e6',1.8);
 P([[-40,-20],[-33,-25],[30,0],[18,0]],STRAP,1.8);L([[-35,-21],[23,0]],'#b07a40',1);
 // neck
 P([[-15,-30],[-16,-40],[16,-40],[15,-30],[0,-25]],SK2,1.8);
 // ears
 for(const sx of[-1,1]){E(sx*31,-60,4.6,7.4,SKIN,2.2);L([[sx*31.5,-65],[sx*29,-60,sx*31,-55]],SK2,1.4)}
 x2.save();x2.rotate(-0.04);
 // head: broad forehead, wide cheeks and jowls
 P([[0,-99],[-19,-99,-26,-88],[-31,-76,-32,-60],[-34,-46,-29,-36],[-20,-25,0,-25],[20,-25,29,-36],[34,-46,32,-60],[31,-76,26,-88],[19,-99,0,-99]],SKIN);
 // jowl shading
 L([[-29,-47],[-26,-36,-17,-32]],SK2,1.4);L([[29,-47],[26,-36,17,-32]],SK2,1.4);
 // short grey-brown hair: crew cut, slightly receding at the temples, greyer at the sides
 P([[-30,-72],[-31,-87,-24,-96],[-14,-102.5,0,-102.5],[14,-102.5,24,-96],[31,-87,30,-72],[28,-77],[26.5,-86],[20,-91,12,-90],[4,-93,-3,-92],[-12,-91,-20,-91],[-26.5,-86],[-28,-77]],HAIR,2);
 for(const [x,y] of[[-20,-95],[-12,-99],[-4,-97],[6,-99.5],[14,-97],[22,-93],[-25,-89],[26,-87],[0,-95],[-16,-93],[10,-94],[-8,-100],[18,-96]])L([[x,y],[x+1.5,y-2.2]],(x*7+y)%3?HAIR2:HAIR3,1.2);
 for(const sx of[-1,1])P([[sx*29,-73],[sx*30.5,-80,sx*28,-86],[sx*26.5,-80,sx*27,-74]],HAIR2,1.2);
 
 // eyebrows: raised high and arched (his trademark surprised look)
 P([[-22,-75],[-18,-85,-6,-81],[-5,-78.5],[-16,-81.5,-21,-73]],BR,1.4);
 P([[22,-76],[16,-83,6,-80],[5,-77.8],[15,-80,21,-74]],BR,1.4);
 // forehead lines
 L([[-10,-85],[0,-87,10,-85]],SK2,1);L([[-7,-88.5],[0,-89.6,7,-88.5]],SK2,0.9);
 // eyes: wide open, blue
 for(const sx of[-1,1]){const ex=sx*12,ey=-68;
  if(blink){L([[ex-6,ey],[ex,ey+1.6,ex+6,ey]],K,2)}
  else{E(ex,ey,6.4,5,'#ffffff',2);E(ex+sx*0.6,ey+.3,3.4,3.6,'#4c86c8',0);E(ex+sx*0.6,ey+.3,1.6,1.8,'#1a1a2a',0);E(ex+sx*0.6-1.2,ey-1.2,1,1,'#ffffff',0);L([[ex-6.4,ey-1],[ex,ey-6.2,ex+6.4,ey-1]],K,2.2)}
  L([[ex-5,ey+6],[ex,ey+8.4,ex+5,ey+6]],SK2,1.3)}
 // nose: broad, rounded tip
 L([[-3.5,-71],[-4.5,-62,-6.5,-56]],SK2,1.4);L([[3.5,-71],[4,-64,5,-58]],SK2,1);
 P([[-8.5,-52],[-9.5,-47.5,-4.5,-47.5],[-2,-46,0,-46],[2,-46,4.5,-47.5],[9.5,-47.5,8.5,-52],[6,-55,3.5,-55],[2,-58,0,-58],[-2,-58,-3.5,-55],[-6,-55,-8.5,-52]],SKIN,1.8);
 E(-4,-49.5,1.6,1,'#8a4a3a',0);E(4,-49.5,1.6,1,'#8a4a3a',0);
 // rosy cheeks
 x2.fillStyle=ROSE;x2.beginPath();x2.ellipse(-19,-52,6,4,0,0,Math.PI*2);x2.fill();x2.beginPath();x2.ellipse(19,-52,6,4,0,0,Math.PI*2);x2.fill();
 // goatee: grey-white chin beard, long and full
 P([[-12,-40],[-13.5,-31,-10,-23],[-5,-16.5,0,-15.5],[5,-16.5,10,-23],[13.5,-31,12,-40],[6,-37,0,-37],[-6,-37,-12,-40]],BEARD,2);E(0,-35.5,5.5,2.2,'#b8afa2',0);
 for(const x of[-8,-4.5,-1,2.5,6,9])L([[x,-32],[x*.85+.4,-26,x*.6,-20]],BEARD2,.9);
 // moustache: brown-grey, around the mouth into the goatee
 P([[-1,-46],[-7,-47,-12,-44],[-14,-40,-12,-35],[-10,-39],[-6,-42,0,-42.5],[6,-42,10,-39],[12,-35],[14,-40,12,-44],[7,-47,1,-46]],MUS,1.6);
 // mouth: slightly open, mid-sentence
 P([[-5,-39.5],[0,-41,5,-39.5],[3,-35.5,0,-35.2],[-3,-35.5,-5,-39.5]],'#6a2a22',1.4);
 L([[-3.5,-36.2],[0,-35,3.5,-36.2]],'#c86a5e',1.4);
 x2.restore();x2.restore()}
const PPC=document.createElement('canvas');PPC.width=84;PPC.height=84;
function portraitCard(cx,top,sz){const x=PPC.getContext('2d');x.clearRect(0,0,84,84);x.fillStyle='#7cc8fc';x.fillRect(0,0,84,84);x.fillStyle='#a8dcfc';x.fillRect(0,50,84,8);x.fillStyle='#3c9c4c';x.fillRect(0,58,84,26);x.fillStyle='#a83c2c';x.beginPath();x.moveTo(58,44);x.lineTo(74,30);x.lineTo(90,44);x.fill();x.fillStyle='#e8d8a8';x.fillRect(61,44,26,16);
 drawPeterPortrait(x,42,84,78,t/60);
 const l=cx-sz/2;g.fillStyle='#fff';g.fillRect(l-5*S,top-5*S,sz+10*S,sz+10*S);g.fillStyle='#2c8c4c';g.fillRect(l-2*S,top-2*S,sz+4*S,sz+4*S);g.save();g.imageSmoothingEnabled=false;g.drawImage(PPC,l,top,sz,sz);g.restore();
 g.fillStyle='#f8d838';rr(cx-34*S,top+sz-6*S,68*S,20*S,6*S);g.fill();g.strokeStyle='#000';g.lineWidth=2*S;g.stroke();txt('PETER',cx,top+sz+4*S,14*S,'#000')}
function peter(){const y=H*PY;g.save();g.translate(px,y);if(crashT>0)g.rotate(Math.sin(crashT*.5)*1.2);if(inv>0&&t%8<4){g.globalAlpha=.4}
 g.fillStyle='#222';rr(-3*S,-26*S,6*S,18*S,3*S);g.fill();rr(-3*S,10*S,6*S,18*S,3*S);g.fill();g.fillStyle='#bbb';g.fillRect(-1*S,-12*S,2*S,26*S);g.fillRect(-12*S,-14*S,24*S,3*S);
 // Peter: broad shoulders in his orange paper-route shirt, bag strap
 g.fillStyle='#e8542c';rr(-12*S,-6*S,24*S,19*S,7*S);g.fill();g.fillStyle='#b8401e';g.fillRect(-12*S,6*S,24*S,2*S);g.fillStyle='#8a5a2c';g.beginPath();g.moveTo(-11*S,-3*S);g.lineTo(-7*S,-5*S);g.lineTo(11*S,9*S);g.lineTo(8*S,11*S);g.closePath();g.fill();
 // head: round face, short grey-brown crew cut (no cap), raised brows, blue eyes, grey goatee
 g.fillStyle='#d8916f';g.fillRect(-4*S,-1*S,8*S,3*S);
 g.fillStyle='#f0b493';g.beginPath();g.ellipse(0,-5*S,8*S,7.6*S,0,0,TAU);g.fill();
 g.fillStyle='#f0b493';g.beginPath();g.arc(-8*S,-5*S,1.8*S,0,TAU);g.arc(8*S,-5*S,1.8*S,0,TAU);g.fill();
 g.fillStyle='#7c6c5e';g.beginPath();g.ellipse(0,-8.6*S,8*S,4.6*S,0,Math.PI,TAU);g.lineTo(8*S,-7.6*S);g.lineTo(-8*S,-7.6*S);g.closePath();g.fill();g.fillStyle='#a99d92';g.fillRect(-7.6*S,-9.6*S,2*S,2.6*S);g.fillRect(5.6*S,-9.6*S,2*S,2.6*S);g.fillRect(-2*S,-12*S,1.2*S,1.2*S);g.fillRect(2*S,-11*S,1.2*S,1.2*S);
 g.fillStyle='#6a5646';g.fillRect(-5*S,-7.4*S,3.2*S,1*S);g.fillRect(1.8*S,-7.2*S,3.2*S,1*S);
 g.fillStyle='#fff';g.fillRect(-4.6*S,-6*S,2.6*S,2*S);g.fillRect(2*S,-6*S,2.6*S,2*S);g.fillStyle='#3c76c0';g.fillRect(-3.8*S,-6*S,1.4*S,2*S);g.fillRect(2.6*S,-6*S,1.4*S,2*S);
 g.fillStyle='rgba(222,104,92,.45)';g.fillRect(-6.4*S,-3.4*S,2.2*S,1.4*S);g.fillRect(4.2*S,-3.4*S,2.2*S,1.4*S);
 g.fillStyle='#93816e';g.fillRect(-3*S,-2.4*S,6*S,1.2*S);g.fillStyle='#d6d1c8';g.beginPath();g.moveTo(-3*S,-1.4*S);g.lineTo(3*S,-1.4*S);g.lineTo(2*S,2.4*S);g.lineTo(0,3.4*S);g.lineTo(-2*S,2.4*S);g.closePath();g.fill();g.fillStyle='#6a2a22';g.fillRect(-1*S,-1.4*S,2*S,1*S);
 g.fillStyle='#e8e0c8';g.fillRect(9*S,1*S,9*S,12*S);g.strokeStyle='#888';g.lineWidth=1*S;g.strokeRect(9*S,1*S,9*S,12*S);g.restore()}
function obstacle(o){const x=W/2+o.x*S,y=sy(o.wy);if(y<-80*S||y>H+80*S)return;g.save();g.translate(x,y);
 if(o.k=='car'){g.fillStyle=o.col;rr(-17*S,-31*S,34*S,62*S,8*S);g.fill();g.fillStyle='#9cd8f8';rr(-13*S,-18*S,26*S,12*S,3*S);g.fill();rr(-13*S,12*S,26*S,8*S,3*S);g.fill();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-13*S,-5*S,26*S,16*S)}
 else if(o.k=='cone'){g.fillStyle='#f8842c';g.beginPath();g.moveTo(0,-10*S);g.lineTo(9*S,8*S);g.lineTo(-9*S,8*S);g.fill();g.fillStyle='#fff';g.fillRect(-5*S,-1*S,10*S,3*S)}
 else if(o.k=='drain'){g.fillStyle='#333';rr(-15*S,-10*S,30*S,20*S,3*S);g.fill();g.strokeStyle='#777';g.lineWidth=2*S;for(let i=-10;i<=10;i+=5){g.beginPath();g.moveTo(i*S,-8*S);g.lineTo(i*S,8*S);g.stroke()}}
 else if(o.k=='dog'){const b=Math.sin(t*.5)*2*S;g.fillStyle='#a8743c';rr(-12*S,-6*S+b,24*S,12*S,5*S);g.fill();g.beginPath();g.arc(0,-10*S+b,7*S,0,TAU);g.fill();g.fillStyle='#6a4420';g.fillRect(-8*S,-14*S+b,4*S,6*S);g.fillRect(4*S,-14*S+b,4*S,6*S);circ(-2.5*S,-11*S+b,1.3*S,'#000');circ(2.5*S,-11*S+b,1.3*S,'#000');if(o.act&&t%30<15)txt('WOOF',16*S,-20*S,9*S,'#fff','#000')}
 else{g.fillStyle='#d8c83c';rr(-11*S,4*S,22*S,6*S,3*S);g.fill();g.fillStyle='#8c3cd8';g.beginPath();g.arc(0,-2*S,8*S,0,TAU);g.fill();g.fillStyle='#4a2a14';g.beginPath();g.arc(0,-4*S,5*S,0,TAU);g.fill()}
 g.restore()}
function draw(){g.fillStyle='#3c9c4c';g.fillRect(0,0,W,H);
 if(state=='title'){dist+=1.5;}
 for(const l of lots)house(l);
 g.fillStyle='#c8c0b0';g.fillRect(W/2-RX()-SW(),0,(RX()+SW())*2,H);g.fillStyle='#a8a090';for(let k=Math.floor(dist/40)-2;k<dist/40+H/(40*S)+2;k++){const y=sy(k*40);g.fillRect(W/2-RX()-SW(),y,SW(),2*S);g.fillRect(W/2+RX(),y,SW(),2*S)}
 g.fillStyle='#4a4a52';g.fillRect(W/2-RX(),0,RX()*2,H);g.fillStyle='#f8d838';for(let k=Math.floor(dist/60)-2;k<dist/60+H/(60*S)+2;k++){g.fillRect(W/2-2*S,sy(k*60),4*S,26*S)}
 if(state=='title'&&lots.length==0){for(let i=0;i<NL*2;i++)lots.push({side:i%2?1:-1,wy:200+(i>>1)*LOT+(i%2?LOT/2:0),sub:R()<.7,col:HCOL[i%6]})}
 if(state=='title'){if(dist>NL*LOT-600)dist=0;panel(H*.1,280*S,'#2c8c4c');txt('PAPER ROUTE',W/2,H*.1+48*S,38*S,'#f8d838','#000');txt('PETER',W/2,H*.1+96*S,46*S,'#fff','#000');
  ['Drag to steer · tap a side to toss','Hit ★ houses — mailbox = bonus','Miss a subscriber and they cancel!','Dodge cars, dogs & skaters'].forEach((s,i)=>txt(s,W/2,H*.1+(140+i*24)*S,14*S,'#fff'));txt(`BEST ${best}`,W/2,H*.1+252*S,15*S,'#f8d838');portraitCard(W/2,H*.1+292*S,104*S);px=W/2+Math.sin(t*.02)*40*S;peter();if(t%60<40)txt('TAP TO START',W/2,H*.86,24*S,'#fff','#000');return}
 for(const it of items){if(it.got)continue;const x=W/2+it.x*S,y=sy(it.wy);g.fillStyle='#e8e0c8';rr(x-14*S,y-10*S,28*S,20*S,3*S);g.fill();g.strokeStyle='#d83c3c';g.lineWidth=3*S;g.beginPath();g.moveTo(x,y-10*S);g.lineTo(x,y+10*S);g.stroke();txt('10',x,y,10*S,'#222')}
 for(const o of obs)obstacle(o);
 const end=sy(routeLen);if(end>-40*S){g.fillStyle='#fff';for(let i=0;i<10;i++){g.fillStyle=i%2?'#000':'#fff';g.fillRect(W/2-RX()+i*RX()/5,end,RX()/5,14*S)}}
 peter();for(const p of papers){const y=sy(p.wy);g.save();g.translate(p.x,y-Math.sin(p.t/34*Math.PI)*24*S);g.rotate(p.spin);g.fillStyle='#f0e8d0';g.fillRect(-8*S,-4*S,16*S,8*S);g.fillStyle='#999';g.fillRect(-2*S,-4*S,4*S,8*S);g.restore()}
 for(const f of fx){if(f.l){g.fillStyle=f.c;g.fillRect(f.x,f.y,4*S,4*S)}else txt(f.s,CL(f.x,70*S,W-70*S),f.y-f.t*.8*S,15*S,f.c||'#fff','#000')}
 g.fillStyle='rgba(0,0,0,.55)';g.fillRect(0,0,W,46*S);txt(`${score}`,12*S,23*S,18*S,'#fff',null,'left');txt(`📰${np}`,W*.36,23*S,16*S,'#fff');txt(`🚲${Math.max(0,bikes)}`,W*.52,23*S,16*S,'#fff');txt(`★${subs.filter(s=>s).length}`,W*.67,23*S,16*S,'#f8d838');
 const pr=CL(dist/routeLen,0,1);g.fillStyle='#555';g.fillRect(8*S,52*S,6*S,H*.4);g.fillStyle='#f8d838';g.fillRect(8*S,52*S+H*.4*(1-pr),6*S,H*.4*pr);
 if(msgT>0)txt(msg,W/2,H*.3,30*S,'#fff','#000');
 if(phase=='review'&&state=='play'){panel(H*.25,200*S,'#2c8c4c');txt(DAYS[(day-1)%7]+' DONE',W/2,H*.25+36*S,26*S,'#f8d838');txt(`Delivered ${dayStats.d} of ${dayStats.sub}`,W/2,H*.25+76*S,17*S,'#fff');txt(`Cancelled: ${dayStats.m}`,W/2,H*.25+104*S,17*S,dayStats.m?'#f86c6c':'#8f8');
  txt(dayStats.perfect?`PERFECT DAY! +${1000*Math.ceil(day/7)} · +1 SUB`:`+${dayStats.d*20} route bonus`,W/2,H*.25+136*S,15*S,'#f8d838');txt(bikes<=0||subs.every(s=>!s)?'':`Next: ${DAYS[day%7]}`,W/2,H*.25+170*S,14*S,'#ccc')}
 if(state=='over'){panel(H*.26,200*S,'#2c8c4c');txt('ROUTE OVER',W/2,H*.26+40*S,32*S,'#f86c6c');txt(subs.every(s=>!s)?'No subscribers left!':'Out of bikes!',W/2,H*.26+76*S,15*S,'#fff');txt(`SCORE ${score}`,W/2,H*.26+108*S,20*S,'#fff');txt(`DAY ${day} · BEST ${best}`,W/2,H*.26+136*S,15*S,'#f8d838');if(t-overT>45&&t%50<35)txt('TAP TO PLAY AGAIN',W/2,H*.26+174*S,16*S,'#fff')}}
let kL=0,kR=0,kSlow=0,kFast=0,drag=null;
c.addEventListener('pointerdown',e=>{A();if(paused)return;if(state=='title'||(state=='over'&&t-overT>45)){lots=[];startGame(state=='title'?startLv:1);return}const r=c.getBoundingClientRect();drag={id:e.pointerId,x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,t:performance.now(),mv:0};drag.lx=drag.x;drag.ly=drag.y;c.setPointerCapture(e.pointerId)});
c.addEventListener('pointermove',e=>{if(!drag||e.pointerId!=drag.id||state!='play'||paused||crashT>0)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;const lim=W/2+RX()+SW()-12*S;px=CL(px+(x-drag.lx)*1.3,W-lim,lim);
 want=CL(want-(y-drag.ly)/(160*S),.55,1.6);drag.mv+=Math.abs(x-drag.lx)+Math.abs(y-drag.ly);drag.lx=x;drag.ly=y});
c.addEventListener('pointerup',e=>{if(!drag||e.pointerId!=drag.id)return;if(drag.mv<12*DPR&&performance.now()-drag.t<350&&state=='play')toss(drag.x<W/2?-1:1);drag=null});
c.addEventListener('pointercancel',()=>drag=null);
document.querySelectorAll('#bar button').forEach(b=>{const a=b.dataset.a;const on=e=>{e.preventDefault();e.stopPropagation();A();if(paused)return;if(a=='tl')toss(-1);if(a=='tr')toss(1);if(a=='slow')kSlow=1;if(a=='fast')kFast=1};const off=()=>{if(a=='slow')kSlow=0;if(a=='fast')kFast=0};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)});
addEventListener('keydown',e=>{const k=e.key;if((k==' '||k=='Enter')&&(state=='title'||(state=='over'&&t-overT>45))){A();lots=[];startGame(state=='title'?startLv:1);return}
 if(k=='ArrowLeft')kL=1;if(k=='ArrowRight')kR=1;if(k=='ArrowUp')kFast=1;if(k=='ArrowDown')kSlow=1;if(k=='z'||k=='a'||k=='Z'||k=='A')toss(-1);if(k=='x'||k=='d'||k=='X'||k=='D')toss(1)});
addEventListener('keyup',e=>{const k=e.key;if(k=='ArrowLeft')kL=0;if(k=='ArrowRight')kR=0;if(k=='ArrowUp')kFast=0;if(k=='ArrowDown')kSlow=0});
function uiGame(play){$('bar').style.display=play?'flex':'none'}
const SND={toss:()=>noise(.08,.15,3000),thunk:()=>tone(160,0,.1,'square',.08,90),mail:()=>{tone(1200,0,.08,'square',.05);tone(1600,.08,.12,'square',.05)},crash:()=>{noise(.4,.4,600);tone(200,0,.4,'sawtooth',.08,50)},
bark:()=>{tone(420,0,.06,'square',.06,300);tone(420,.12,.06,'square',.06,300)},pick:()=>seq([660,880],.06,'square',.05),cancel:()=>seq([300,220],.1,'sawtooth',.05),
start:()=>seq([523,659,784,659,784,1046],.09,'square',.06),perfect:()=>seq([523,659,784,1046,0,1046,1318],.09,'square',.07),over:()=>seq([392,330,262,196],.22,'triangle',.12)};
const ML=[262,330,392,330,349,440,523,440,392,330,294,330,262,0,196,0];MUSIC=i=>{if(phase!='ride')return;const n=ML[i%16];if(n)tone(n,0,.13,'square',.025);if(i%4==0)tone(98,0,.1,'triangle',.05)};
