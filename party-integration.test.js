'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
test('two real room participants can vote, ready up, complete 16 Party rounds, and return to lobby',()=>{
 const original=Module._load;
 const service={io:null};
 const fakeExpress=()=>{const app=(req,res)=>{};for(const key of ['disable','set','use','get'])app[key]=()=>app;return app;};fakeExpress.static=()=>()=>{};
 class IO{constructor(){this.handlers={};this.sockets={sockets:new Map()};service.io=this;}on(event,fn){this.handlers[event]=fn;}to(){return{emit(){}};}}
 Module._load=function(name,...args){if(name==='express')return fakeExpress;if(name==='socket.io')return{Server:IO};if(name==='qrcode')return{toString:async()=>'<svg/>'};return original.call(this,name,...args);};
 let srv;try{srv=require('./server.js');}finally{Module._load=original;}
 class Socket{constructor(id){this.id=id;this.data={};this.handlers={};}on(key,fn){this.handlers[key]=fn;}join(){}leave(){}emit(){}async send(key,data){let result;this.handlers[key](data||{},r=>{result=r});return result;}}
 const a=new Socket('socket-a'),b=new Socket('socket-b');service.io.handlers.connection(a);service.io.handlers.connection(b);
 return(async()=>{
  const joined=await a.send('create',{name:'Keko'});assert.equal(joined.ok,true);assert.equal((await b.send('join',{code:joined.code,name:'Jill'})).ok,true);
  const room=srv.rooms.get(joined.code);assert.equal(room.players.length,2);
  assert.equal((await a.send('profile',{mood:'Playful',avatar:'m3',color:3,drinks:2})).ok,true);
  assert.equal(room.players[0].mood,'Playful');assert.equal(room.players[0].avatar,'m3');
  assert.equal((await a.send('vote',{mode:'party'})).ok,true);
  assert.equal((await b.send('vote',{mode:'party'})).ok,true);
  assert.equal((await a.send('lobby:ready')).ok,true);assert.equal((await b.send('lobby:ready')).ok,true);
  assert.equal((await a.send('start')).ok,true);assert.equal(room.mode,'party');assert.equal(room.party.rounds.length,16);
  const partyTick=(p,room)=>{const party=require('./party');party.tick(p,room.players,p.draw.deadline+1);party.tick(p,room.players,p.draw.deadline+1);party.tick(p,room.players,p.draw.deadline+1);};
  for(let i=0;i<16;i++){
   const p=room.party,r=p.rounds[i];
   if(r.type==='tap'){p.goAt=0;assert.equal((await a.send('party:answer',{answer:'tap'})).ok,true);}
   else if(r.type==='draw'){for(let heat=0;heat<4;heat++){const artist=p.draw.drawerId===room.players[0].id?a:b;assert.equal((await artist.send('party:stroke',{points:[[.1,.2,1],[.4,.5,0]]})).ok,true);partyTick(p,room);}}
   else if(r.type==='kart'){assert.equal((await a.send('party:lane',{step:-1})).ok,true);assert.equal(p.kart.cars[room.players[0].id].lane,0);require('./party').tick(p,room.players,p.kart.endAt+1);}
   else{assert.equal((await a.send('party:answer',{answer:0})).ok,true);assert.equal((await b.send('party:answer',{answer:0})).ok,true);}
   assert.equal(p.stage,'reveal');
   assert.equal((await a.send('party:ready')).ok,true);assert.equal((await b.send('party:ready')).ok,true);
  }
  assert.equal(room.phase,'finished');assert.equal(room.party.stage,'finished');assert.ok(room.players.some(x=>x.score>0));
  assert.equal((await a.send('restart')).ok,true);assert.equal(room.phase,'lobby');assert.equal(room.party,null);
  assert.equal(room.players.reduce((sum,x)=>sum+x.wins,0)<=1,true);
  srv.server.close();
 })();
});
