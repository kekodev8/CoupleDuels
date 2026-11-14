'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
test('standalone Quick Draw runs four sketch-and-guess heats and records winner',async()=>{
 const original=Module._load;let io=null;
 const fakeExpress=()=>{const app=()=>{};for(const key of ['disable','set','use','get'])app[key]=()=>app;return app;};fakeExpress.static=()=>()=>{};
 class IO{constructor(){this.handlers={};this.sockets={sockets:new Map()};io=this;}on(event,fn){this.handlers[event]=fn;}to(){return{emit(){}};}}
 Module._load=function(name,...args){if(name==='express')return fakeExpress;if(name==='socket.io')return{Server:IO};if(name==='qrcode')return{toString:async()=>'<svg/>'};return original.call(this,name,...args);};
 let srv;try{srv=require('./server');}finally{Module._load=original;}
 class Socket{constructor(id){this.id=id;this.data={};this.handlers={};}on(k,fn){this.handlers[k]=fn;}join(){}leave(){}emit(){}send(k,data){return new Promise(resolve=>this.handlers[k](data||{},resolve));}}
 const a=new Socket('a'),b=new Socket('b');io.handlers.connection(a);io.handlers.connection(b);
 const start=await a.send('create',{name:'Artist A'});assert.equal(start.ok,true);assert.equal((await b.send('join',{code:start.code,name:'Artist B'})).ok,true);
 const room=srv.rooms.get(start.code);
 assert.equal((await a.send('vote',{mode:'quickdraw'})).ok,true);assert.equal((await b.send('vote',{mode:'quickdraw'})).ok,true);
 assert.equal((await a.send('lobby:ready')).ok,true);assert.equal((await b.send('lobby:ready')).ok,true);
 assert.equal((await a.send('start')).ok,true);
 assert.equal(room.arcade,null);assert.ok(room.drawGame);assert.equal(room.drawGame.draw.heat,0);
 const engine=require('./party');
 for(let heat=0;heat<4;heat++){
  const d=room.drawGame.draw;assert.equal(d.heat,heat);assert.equal(d.phase,'draw');
  const artist=room.players[0].id===d.drawerId?a:b;const guesser=artist===a?b:a;
  assert.equal(engine.publicState(room.drawGame,room.players,room.players.find(p=>p.socketId===guesser.id)?.id||room.players.find(p=>p.id!==d.drawerId).id).draw.word,null);
  assert.equal((await guesser.send('quickdraw:stroke',{points:[[0.2,0.3,1]]})).ok,false);
  assert.equal((await artist.send('quickdraw:stroke',{points:[[0.2,0.3,1],[0.5,0.6,0]]})).ok,true);
  engine.tick(room.drawGame,room.players,d.deadline+1);
  assert.equal(room.drawGame.draw.phase,'guess');
  assert.equal((await guesser.send('quickdraw:guess',{word:d.word})).ok,true);
  assert.equal(room.drawGame.draw.phase,'review');
  engine.tick(room.drawGame,room.players,room.drawGame.draw.deadline+1);
 }
 assert.equal(room.drawGame.stage,'reveal');assert.equal(room.players.reduce((s,p)=>s+p.score,0),20);
 // Timer processing transitions the server phase to finished, once only.
 room.phase='finished';srv.server.close();
});
