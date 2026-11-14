// Bingo en vivo v3: sin dependencias. Ejecuta: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
//#ENGINE-START (lógica del juego; la demo la reutiliza tal cual)
function createEngine(newId){
 let called=[],round=1,open=true,places=3,prizes=['','',''],jk=0,jn=[],pt=null;
 const players=new Map(),subs=new Set();
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const newCard=()=>shuffle(Array.from({length:30},(_,i)=>i+1)).slice(0,16);
 const left=p=>p.card.filter(n=>!called.includes(n)).length;
 const doneAt=p=>left(p)?0:Math.max(...p.card.map(n=>called.indexOf(n)+1));
 function wins(){const f=[...players.values()].map(p=>({p,d:doneAt(p)})).filter(x=>x.d).sort((a,b)=>a.d-b.d),w=[];let k=0;
  for(const x of f){const l=w[w.length-1];if(l&&l.draw===x.d)l.names.push(x.p.name);else w.push({place:k+1,draw:x.d,names:[x.p.name]});k++}
  return{w,total:k}}
 const isOver=()=>{const{total}=wins();return called.length>=30||(total>0&&total>=Math.min(places,players.size))};
 function snap(){const{w}=wins(),pl=[...players.values()],dist=Array(17).fill(0);pl.forEach(p=>dist[left(p)]++);
  return{called,round,n:pl.length,open:open&&called.length===0,places,prizes,over:isOver()&&called.length>0,
   win:w.filter(g=>g.place<=places).map(g=>({...g,prize:prizes[g.place-1]||''})),dist,
   top:pl.map(p=>({name:p.name,left:left(p)})).sort((a,b)=>a.left-b.left).slice(0,10),jn}}
 const go=()=>{pt=null;const s=JSON.stringify(snap());subs.forEach(f=>f(s))};
 const push=now=>{if(now){clearTimeout(pt);go()}else if(!pt)pt=setTimeout(go,250)};
 const info=p=>({id:p.id,name:p.name,card:p.card});
 const clean=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);
 const uniq=(name,id)=>{let n=name,i=2;while([...players.values()].some(p=>p.id!==id&&p.name.toLowerCase()===n.toLowerCase()))n=name.slice(0,16)+' ('+i+++')';return n};
 function api(m,p,q,b,host){b=b||{};
  if(p==='/join'&&m==='POST'){let pl=players.get(b.id);
   if(!pl){if(called.length||!open)return[403,{error:'closed'}];const name=clean(b.name);if(!name)return[400,{error:'name'}];if(players.size>=500)return[403,{error:'full'}];
    pl={id:newId(),name:uniq(name),card:newCard()};players.set(pl.id,pl);jn=[...jn,{k:++jk,name:pl.name}].slice(-5);push()}
   return[200,info(pl)]}
  if(p==='/me'){const pl=players.get(q.id);return pl?[200,info(pl)]:[404,{}]}
  if(p==='/rename'&&m==='POST'){const pl=players.get(b.id),n=clean(b.name);if(!pl||!n)return[400,{}];pl.name=uniq(n,pl.id);push();return[200,info(pl)]}
  if(m==='POST'&&['/draw','/reset','/config'].includes(p)){if(!host)return[403,{error:'key'}];
   if(p==='/draw'){const rest=[];for(let n=1;n<=30;n++)if(!called.includes(n))rest.push(n);
    if(isOver()||!rest.length)return[409,{}];const n=rest[Math.floor(Math.random()*rest.length)];called.push(n);push(true);return[200,{n}]}
   if(p==='/reset'){called=[];round++;open=true;players.forEach(x=>x.card=newCard());push(true);return[200,{}]}
   if(Array.isArray(b.prizes))prizes=[0,1,2].map(i=>String(b.prizes[i]||'').slice(0,40));
   if([1,2,3].includes(+b.places))places=+b.places;if(typeof b.open==='boolean')open=b.open;push();return[200,{}]}
  return null}
 return{api,snap,subs}}
//#ENGINE-END
const PORT=process.env.PORT||3000,ENVKEY=process.env.HOST_KEY,KEY=ENVKEY||Math.random().toString(36).slice(2,8);
const BASE=(process.env.RENDER_EXTERNAL_URL||process.env.PUBLIC_URL||'http://localhost:'+PORT).replace(/\/+$/,'');
const F={'index.html':['text/html;charset=utf-8','no-cache'],'board.jpg':['image/jpeg','public,max-age=3600'],'card.jpg':['image/jpeg','public,max-age=3600'],'frog.jpg':['image/jpeg','public,max-age=86400']};
const E=createEngine(()=>crypto.randomBytes(5).toString('hex')),pings=new Set();
setInterval(()=>pings.forEach(f=>f()),20000);
const body=req=>new Promise(r=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e4)req.destroy()});req.on('end',()=>{try{r(JSON.parse(d||'{}'))}catch(e){r({})}});req.on('error',()=>r({}))});
const send=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const isHost=u=>{const a=Buffer.from(u.searchParams.get('key')||''),b=Buffer.from(KEY);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x'),p=u.pathname;
 if(p==='/health'){res.writeHead(200);return res.end('ok')}
 if(p==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
  const f=s=>res.write('data:'+s+'\n\n'),pg=()=>res.write(': ping\n\n');E.subs.add(f);pings.add(pg);
  res.write('retry:2000\n');f(JSON.stringify(E.snap()));req.on('close',()=>{E.subs.delete(f);pings.delete(pg)});return}
 const r=E.api(req.method,p,Object.fromEntries(u.searchParams),req.method==='POST'?await body(req):{},isHost(u));
 if(r)return send(res,r[0],r[1]);
 const f=(p==='/'||p==='/host')?'index.html':p.slice(1);
 if(!F[f]){res.writeHead(404);return res.end('No encontrado')}
 res.writeHead(200,{'Content-Type':F[f][0],'Cache-Control':F[f][1]});fs.createReadStream(path.join(__dirname,'public',f)).pipe(res);
}).listen(PORT,()=>{console.log('Participantes: '+BASE+'/\nAnfitrión:     '+BASE+'/host?key='+(ENVKEY?'(tu HOST_KEY)':KEY))});
