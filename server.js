'use strict';
const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const QRCode=require('qrcode');
const crypto=require('crypto');
const {RAPID_ROUNDS,createRapidDeck,publicRound,createCompatibilityDeck}=require('./game');
const battle=require('./sipbattle');
const storyEngine=require('./story');
const kart=require('./race');
const mini=require('./minigames');
const arcade=require('./arcade');
const party=require('./party');
const {loadImage,TITLES}=require('./image-sources');
const {hasCompletedGame,syncCompletion}=require('./completion');
const {pauseRoom,resumeRoom}=require('./pause');
const app=express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.static('public',{extensions:['html']}));
app.get('/health',(req,res)=>res.json({ok:true}));
// Images are fetched server-side from independent public providers, then served
// from this app's own HTTPS origin. The page title is never displayed as a clue.
app.get('/api/clue-image',async(req,res)=>{
 const title=String(req.query.title||'');
 if(!TITLES.has(title))return res.status(404).send('Unknown picture');
 try{
  const image=await loadImage(title);
  if(!image)return res.status(404).send('Image source unavailable');
  res.set('Cache-Control','public, max-age=1800');
  res.type(image.mime).send(image.data);
 }catch{res.status(502).send('Image not available');}
});
app.get('/api/qr',async(req,res)=>{
  try{
    const requested=String(req.query.url||'');
    const u=new URL(requested);
    // Only generate QR codes for this deployed site.
    if(u.origin!==`${req.protocol}://${req.get('host')}`)return res.status(400).send('Invalid destination');
    const svg=await QRCode.toString(requested,{type:'svg',margin:1,width:240,color:{dark:'#121526',light:'#ffffff'}});
    res.type('svg').send(svg);
  }catch{res.status(400).send('Bad URL');}
});
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:false}});
const rooms=new Map();
function roomCode(){let code;do{code=crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(code));return code;}
function cleanName(value){return String(value||'Player').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,20)||'Player';}
function uid(){return crypto.randomBytes(18).toString('hex');}
function findPlayer(room,token){return room.players.find(p=>p.token===token);}
function snapshot(room,token){
 syncCompletion(room);
 const you=findPlayer(room,token);
 const compat=room.mode==='compatibility';
 const isActive=room.phase==='playing'||room.phase==='reveal';
 let round=null,reveal=null,summary=null;
 if(room.mode==='party'){ /* Party rounds are exposed in party.publicState. */ }else if(['story','race','sipbattle','mindmeld','emojirush','tapduel','distorted','quickdraw','memory'].includes(room.mode)) { /* Story state is served independently from quiz rounds. */ }else if(compat && isActive){
  const self=room.index<10,questionIndex=self?room.index:room.compat.guessIndices[room.index-10];
  const q=room.compat.questions[questionIndex];
  round={number:room.index+1,total:15,type:self?'self':'guess',title:q.title,choices:q.choices,stage:self?1:2,
   prompt:self?'Answer for YOURSELF. Your answer stays secret until the prediction round.':'Choose what you think your partner answered earlier.'};
  if(room.phase==='reveal'){
   reveal=room.players.map(p=>({id:p.id,name:p.name,answer:p.answer,
    actual:room.compat.selfAnswers[p.id][questionIndex],
    partnerAnswer:room.compat.selfAnswers[room.players.find(other=>other.id!==p.id).id][questionIndex],
    correct:room.compat.selfAnswers[room.players.find(other=>other.id!==p.id).id][questionIndex]!==null && p.answer!==null && p.answer===room.compat.selfAnswers[room.players.find(other=>other.id!==p.id).id][questionIndex]}));
  }
 }else if(isActive){
  round=publicRound(room.rapidRounds[room.index],room.index);
  if(room.phase==='reveal')reveal=room.players.map(p=>({id:p.id,name:p.name,answer:p.answer}));
 }
 if(compat && room.phase==='finished'){
  summary={matches:room.compat.matches,possible:10,percent:room.compat.matches*10,
   individual:room.players.map(p=>({id:p.id,name:p.name,correct:room.compat.correct[p.id]})),
   breakdown:room.compat.guessIndices.map((qi,order)=>({question:room.compat.questions[qi].title,
    choices:room.compat.questions[qi].choices,players:room.players.map(p=>({id:p.id,name:p.name,selfAnswer:room.compat.selfAnswers[p.id][qi],guess:room.compat.guessAnswers[p.id][order],partnerAnswer:room.compat.selfAnswers[room.players.find(other=>other.id!==p.id).id][qi]}))}))};
 }
 return {party:room.mode==='party'?party.publicState(room.party,room.players,you?.id):null,votes:room.votes||{},arcade:room.arcade?arcade.publicState(room.arcade):null,mini:room.mini?mini.publicMini(room.mini):null,race:room.mode==='race'&&room.race?kart.publicRace(room.race):null,story:room.mode==='story'&&room.story?storyEngine.publicStory(room.story,room.players):null,battle:room.mode==='sipbattle'&&room.battle?battle.publicBattle(room.battle,room.players):null,code:room.code,mode:room.mode,phase:room.phase,paused:!!room.paused,pausedBy:room.pausedBy||null,players:room.players.map(p=>({id:p.id,name:p.name,connected:!!p.socketId,score:p.score,ready:!!p.ready,avatar:p.avatar||'m1',color:Number.isInteger(p.color)?p.color:0,mood:p.mood||'Chill',drinks:p.drinks||0,wins:p.wins||0,vote:(room.votes||{})[p.id]||null,answered:isActive?!!(p.answer!==null):undefined})),youId:you?.id,hostId:room.players[0]?.id,roundIndex:room.index,deadline:room.deadline||null,round,reveal,summary};
}
function transition(room){
 if(room.paused)return;
 if(room.phase==='playing'){
  if(room.mode==='compatibility'){
   if(room.index<10){
    for(const p of room.players)room.compat.selfAnswers[p.id][room.index]=p.answer;
    room.index++;
    room.players.forEach(p=>p.answer=null);
    room.phase='playing';room.deadline=null;
   }else{
    const qIndex=room.compat.guessIndices[room.index-10];
    for(const p of room.players){
     room.compat.guessAnswers[p.id][room.index-10]=p.answer;
     const partner=room.players.find(other=>other.id!==p.id);
     const actual=room.compat.selfAnswers[partner.id][qIndex];
     if(actual!==null && p.answer!==null && p.answer===actual){
      room.compat.matches++;room.compat.correct[p.id]++;p.score+=1;
     }
    }
    room.phase='reveal';room.deadline=null;room.players.forEach(p=>p.ready=false);
   }
  }else{
   const round=room.rapidRounds[room.index];
   const both=room.players.every(p=>p.answer!==null);
   if(both){
    if(round.type==='challenge')room.players.forEach(p=>p.score+=1);
    else if(round.type==='match'&&room.players[0].answer===room.players[1].answer)room.players.forEach(p=>p.score+=2);
    else if(round.type==='vote'){
     const votes=room.players.map((p,i)=>p.answer===0?p.id:room.players[1-i].id);
     if(votes[0]===votes[1])room.players.forEach(p=>p.score+=2);
    }
   }
   room.phase='reveal';room.deadline=null;room.players.forEach(p=>p.ready=false);
  }
 }else if(room.phase==='reveal'){
  room.index++;
  if(room.index=== (room.mode==='compatibility'?15:RAPID_ROUNDS)){room.phase='finished';room.deadline=null;}
  else{room.phase='playing';room.players.forEach(p=>p.answer=null);room.deadline=null;}
 }
 room.updated=Date.now();broadcast(room);schedule(room);
}
function schedule(room){
 clearTimeout(room.timer);room.timer=null;
 if(room.paused)return;
 if(room.mode==='story'&&room.story?.stage==='turn'){const left=Math.max(0,room.story.deadline-Date.now());room.timer=setTimeout(()=>{if(rooms.get(room.code)!==room||room.story.stage!=='turn')return;storyEngine.finishTurn(room.story,room.players);if(room.story.stage==='finished')room.phase='finished';room.updated=Date.now();broadcast(room);schedule(room);},left);room.timer.unref?.();return;}
 if(!room.deadline)return;
 room.timer=setTimeout(()=>{if(rooms.get(room.code)!==room)return;transition(room)},Math.max(0,room.deadline-Date.now()));
 room.timer.unref?.();
}
function recordVictory(room){
 if(room.phase!=='finished'||room.winsRecorded||room.players.length!==2)return;
 room.winsRecorded=true;
 let standings=null;
 if(room.arcade)standings=room.arcade.players;
 else if(room.mini)standings=room.mini.players;
 if(standings){for(const p of room.players)p.score=standings.find(x=>x.id===p.id)?.score||0;}
 if(room.race){for(const p of room.players)p.score=p.id===room.race.winner?1:0;}
 if(room.battle){for(const p of room.players)p.score=p.id===room.battle.winner?1:0;}
 const [a,b]=room.players;if(a.score>b.score)a.wins=(a.wins||0)+1;else if(b.score>a.score)b.wins=(b.wins||0)+1;
}
function broadcast(room){syncCompletion(room);recordVictory(room);for(const p of room.players){if(p.socketId)io.to(p.socketId).emit('state',snapshot(room,p.token));}}
function ackError(ack,error){if(typeof ack==='function')ack({ok:false,error});}
function ackOK(ack,rest){if(typeof ack==='function')ack({ok:true,...rest});}
function attach(socket,room,player){
 if(player.socketId&&player.socketId!==socket.id)io.to(player.socketId).emit('replaced');
 player.socketId=socket.id;player.ready=false;
 socket.data={code:room.code,token:player.token};socket.join(room.code);room.updated=Date.now();
 broadcast(room);
}
io.on('connection',socket=>{
 socket.on('create',({name}={},ack)=>{
  if(socket.data.code)return ackError(ack,'Already in a room');
  const code=roomCode(),token=uid();
  const room={code,votes:{},party:null,phase:'lobby',mode:'rapid',index:0,compat:null,battle:null,story:null,race:null,mini:null,arcade:null,paused:false,pausedAt:null,pausedBy:null,rapidRounds:null,rapidHistory:[],updated:Date.now(),players:[{id:uid(),token,name:cleanName(name),socketId:null,score:0,answer:null,ready:false,avatar:'m1',color:0,mood:'Chill',drinks:0,wins:0}]};
  rooms.set(code,room);attach(socket,room,room.players[0]);ackOK(ack,{code,token});
 });
 socket.on('join',({code,token,name}={},ack)=>{
  if(socket.data.code)return ackError(ack,'Already in a room');
  const room=rooms.get(String(code||'').trim().toUpperCase());
  if(!room)return ackError(ack,'Room not found. Check the code.');
  let player=token&&findPlayer(room,token);
  if(!player){
   if(room.players.length>=2)return ackError(ack,'This room already has two players.');
   if(room.phase!=='lobby')return ackError(ack,'Game already in progress.');
   player={id:uid(),token:uid(),name:cleanName(name),socketId:null,score:0,answer:null,ready:false,avatar:'f1',color:2,mood:'Chill',drinks:0,wins:0};room.players.push(player);
  }
  attach(socket,room,player);ackOK(ack,{code:room.code,token:player.token});
 });
 socket.on('profile',({avatar,color,mood,drinks}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.phase!=='lobby')return ackError(ack,'Lobby only.');
  if(avatar!==undefined){if(!/^(m[123]|f[123])$/.test(String(avatar)))return ackError(ack,'Invalid avatar.');player.avatar=avatar;}
  if(color!==undefined){if(!Number.isInteger(color)||color<0||color>4)return ackError(ack,'Invalid color.');player.color=color;}
  if(mood!==undefined){if(!['Chill','Playful','Curious','Spicy','Tired','Competitive','Chaotic','Relaxed'].includes(mood))return ackError(ack,'Invalid mood.');player.mood=mood;}
  if(drinks!==undefined){if(!Number.isInteger(drinks)||drinks<0||drinks>999)return ackError(ack,'Invalid drink count.');player.drinks=drinks;}
  room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('lobby:ready',(_,ack)=>{const {room,player}=current(socket);if(!room||!player||room.phase!=='lobby')return ackError(ack,'Lobby only.');player.ready=!player.ready;room.updated=Date.now();broadcast(room);ackOK(ack,{});});
 socket.on('vote',({mode}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.phase!=='lobby')return ackError(ack,'Lobby only.');
  if(!['rapid','compatibility','sipbattle','story','race','mindmeld','emojirush','tapduel','distorted','quickdraw','memory','party'].includes(mode))return ackError(ack,'Unknown mode.');
  room.votes=room.votes||{};room.votes[player.id]=mode;
  if(room.players.length===2&&room.players.every(p=>room.votes[p.id]===mode))room.mode=mode;
  room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('mode',({mode}={},ack)=>{
  const {room,player}=current(socket);
  if(!room||!player||player.id!==room.players[0].id)return ackError(ack,'Host only.');
  if(room.phase!=='lobby')return ackError(ack,'Choose a mode before starting.');
  if(!['rapid','compatibility','sipbattle','story','race','mindmeld','emojirush','tapduel','distorted','quickdraw','memory','party'].includes(mode))return ackError(ack,'Unknown game mode.');
  room.mode=mode;room.votes={};room.players.forEach(p=>p.ready=false);room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('start',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player)return ackError(ack,'Not in a room');
  if(player.id!==room.players[0].id)return ackError(ack,'Only the host can start.');
  if(room.players.length!==2||!room.players.every(p=>p.socketId))return ackError(ack,'Both players must be connected.');
  if(room.phase!=='lobby')return ackError(ack,'Game already started.');
  if(!room.players.every(p=>p.ready))return ackError(ack,'Both players must press Ready.');
  if(room.players.length!==2||!room.players.every(p=>room.votes?.[p.id]===room.mode))return ackError(ack,'Both players must vote for the same game.');
  room.index=0;room.phase='playing';room.winsRecorded=false;room.paused=false;room.pausedAt=null;room.pausedBy=null;
  room.party=room.mode==='party'?party.make():null;
  if(room.party)party.begin(room.party,room.players);
  room.battle=room.mode==='sipbattle'?battle.makeBattle(room.players):null;
  room.story=room.mode==='story'?storyEngine.makeStory():null;
  room.race=room.mode==='race'?kart.createRace(room.players):null;
  room.mini=['mindmeld','emojirush','tapduel'].includes(room.mode)?mini.make(room.mode,room.players):null;
  room.arcade=['distorted','quickdraw','memory'].includes(room.mode)?arcade.make(room.mode,room.players):null;
  if(room.mode==='rapid'){
   const deck=createRapidDeck(room.rapidHistory);
   room.rapidRounds=deck.rounds;room.rapidHistory.push(...deck.ids);
   // Keep a recent history of 75 prompts; older prompts can re-enter rotation.
   room.rapidHistory=room.rapidHistory.slice(-75);
  }else room.rapidRounds=null;
  if(room.mode==='compatibility'){
   room.compat={...createCompatibilityDeck(),selfAnswers:{},guessAnswers:{},correct:{},matches:0};
   for(const p of room.players){room.compat.selfAnswers[p.id]=Array(10).fill(null);room.compat.guessAnswers[p.id]=Array(5).fill(null);room.compat.correct[p.id]=0;}
  }else room.compat=null;
  room.deadline=null; // Untimed questions and challenges: both players advance by answering.
  room.players.forEach(p=>{p.score=0;p.answer=null;p.ready=false});
  broadcast(room);schedule(room);ackOK(ack,{});
 });
 socket.on('pause',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player)return ackError(ack,'Not in a room.');
  if(!['playing','reveal'].includes(room.phase))return ackError(ack,'Nothing active to pause.');
  if(room.paused)return ackOK(ack,{});
  pauseRoom(room,player.name);
  clearTimeout(room.timer);room.timer=null;room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('resume',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player)return ackError(ack,'Not in a room.');
  if(!room.paused)return ackOK(ack,{});
  resumeRoom(room);
  room.updated=Date.now();broadcast(room);schedule(room);ackOK(ack,{});
 });
 socket.on('party:challenge',({text}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.phase!=='finished'||room.mode!=='party'||!room.party)return ackError(ack,'Party finale only.');
  const winner=room.players.slice().sort((a,b)=>b.score-a.score);if(winner[0].score===winner[1].score||winner[0].id!==player.id)return ackError(ack,'Only the winner can suggest a challenge.');
  const cleaned=String(text||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,140);
  if(cleaned.length<3)return ackError(ack,'Enter a short challenge.');room.party.challenge=cleaned;room.party.outcome='';room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('party:outcome',({choice}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.phase!=='finished'||room.mode!=='party'||!room.party)return ackError(ack,'Party finale only.');
  const ranking=room.players.slice().sort((a,b)=>b.score-a.score);if(ranking[0].score===ranking[1].score||ranking[1].id!==player.id)return ackError(ack,'Only the other player chooses.');
  if(!['drink','challenge','skip'].includes(choice))return ackError(ack,'Unknown choice.');
  room.party.outcome=choice;room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('party:stroke',({points}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.mode!=='party'||room.phase!=='playing'||room.paused)return ackError(ack,'Party unavailable.');
  const err=party.drawStroke(room.party,room.players,player.id,points);if(err)return ackError(ack,err);
  // Broadcast strokes separately: repaint the existing canvas, not the entire webpage.
  for(const peer of room.players)if(peer.socketId)io.to(peer.socketId).emit('party:stroke',{points,drawerId:player.id});
  ackOK(ack,{});
 });
 socket.on('party:guess',({word}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.mode!=='party'||room.phase!=='playing'||room.paused)return ackError(ack,'Party unavailable.');
  const err=party.guess(room.party,room.players,player.id,word);if(err)return ackError(ack,err);
  room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('party:lane',({step}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.mode!=='party'||room.phase!=='playing'||room.paused)return ackError(ack,'Party unavailable.');
  const err=party.lane(room.party,room.players,player.id,step);if(err)return ackError(ack,err);
  room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('party:answer',({answer}={},ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.mode!=='party'||room.phase!=='playing'||room.paused)return ackError(ack,'Party Mode unavailable.');
  const err=party.submit(room.party,room.players,player.id,answer);
  if(err)return ackError(ack,err);room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('party:ready',(_,ack)=>{
  const {room,player}=current(socket);if(!room||!player||room.mode!=='party'||room.phase!=='playing'||room.paused)return ackError(ack,'Party Mode unavailable.');
  const err=party.ready(room.party,room.players,player.id);
  if(err)return ackError(ack,err);if(room.party.stage==='finished')room.phase='finished';room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('answer',({answer}={},ack)=>{
  const {room,player}=current(socket);
  if(!room||!player||room.paused||room.phase!=='playing'||['sipbattle','story','race'].includes(room.mode))return ackError(ack,'Round is not accepting answers.');
  if(player.answer!==null)return ackError(ack,'Already submitted.');
  const round=room.mode==='compatibility'?room.compat.questions[room.index<10?room.index:room.compat.guessIndices[room.index-10]]:room.rapidRounds[room.index];
  if(room.mode!=='compatibility'&&round.type==='challenge'){
    if(answer!=='done')return ackError(ack,'Tap done to finish.');
  }else if(!Number.isInteger(answer)||answer<0||answer>=round.choices.length)return ackError(ack,'Invalid choice.');
  player.answer=answer;room.updated=Date.now();
  if(room.players.every(p=>p.answer!==null)){transition(room);ackOK(ack,{});return;}
  broadcast(room);ackOK(ack,{});
 });
 socket.on('reveal:ready',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player||room.paused||room.phase!=='reveal'||!['rapid','compatibility'].includes(room.mode))return ackError(ack,'Nothing to confirm.');
  player.ready=true;
  if(room.players.every(p=>p.ready))transition(room);
  else{room.updated=Date.now();broadcast(room);}
  ackOK(ack,{});
 });
 socket.on('arcade:answer',({answer}={},ack)=>{const {room,player}=current(socket);if(!room||!player||room.paused||room.phase!=='playing'||!room.arcade)return ackError(ack,'Game unavailable.');const error=arcade.answer(room.arcade,player.id,answer);if(error)return ackError(ack,error);room.updated=Date.now();broadcast(room);ackOK(ack,{});});
 socket.on('arcade:ready',(_,ack)=>{const {room,player}=current(socket);if(!room||!player||room.paused||room.phase!=='playing'||!room.arcade)return ackError(ack,'Game unavailable.');const error=arcade.ready(room.arcade,player.id);if(error)return ackError(ack,error);syncCompletion(room);room.updated=Date.now();broadcast(room);ackOK(ack,{});});
 socket.on('arcade:draw',(_,ack)=>{const {room,player}=current(socket);if(!room||!player||room.paused||room.phase!=='playing'||!room.arcade)return ackError(ack,'Game unavailable.');const error=arcade.draw(room.arcade,player.id);if(error)return ackError(ack,error);room.updated=Date.now();broadcast(room);ackOK(ack,{});});
 socket.on('mini:answer',({answer}={},ack)=>{
  const {room,player}=current(socket);
  if(!room||!player||room.paused||room.phase!=='playing'||!room.mini)return ackError(ack,'Game unavailable.');
  const err=mini.answer(room.mini,player.id,answer);if(err)return ackError(ack,err);
  room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('mini:ready',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player||room.paused||room.phase!=='playing'||!room.mini)return ackError(ack,'Game unavailable.');
  const err=mini.ready(room.mini,player.id);if(err)return ackError(ack,err);
  room.updated=Date.now();broadcast(room);ackOK(ack,{});
 });
 socket.on('mini:tap',()=>{
  const {room,player}=current(socket);
  if(!room||!player||room.paused||room.phase!=='playing'||!room.mini)return;
  mini.tap(room.mini,player.id);room.updated=Date.now();broadcast(room);
 });
 socket.on('story:done',(_,ack)=>{const {room,player}=current(socket);if(!room||!player||room.mode!=='story'||room.paused||room.phase!=='playing'||room.story.stage!=='turn')return ackError(ack,'Story turn not available.');if(room.players[room.story.step%2].id!==player.id)return ackError(ack,'Wait for your turn.');storyEngine.finishTurn(room.story,room.players);if(room.story.stage==='finished')room.phase='finished';room.updated=Date.now();broadcast(room);schedule(room);ackOK(ack,{});});
 socket.on('story:ready',(_,ack)=>{const {room,player}=current(socket);if(!room||!player||room.mode!=='story'||room.paused||room.phase!=='playing')return ackError(ack,'Story not active.');const err=storyEngine.readyTwist(room.story,player.id,room.players);if(err)return ackError(ack,err);room.updated=Date.now();broadcast(room);schedule(room);ackOK(ack,{});});
 socket.on('race:choose',({character}={},ack)=>raceAction(socket,ack,({room,player})=>kart.choose(room.race,player.id,character)));
 socket.on('race:track',({track}={},ack)=>raceAction(socket,ack,({room,player})=>kart.trackChoice(room.race,player.id,room.players[0].id,track)));
 socket.on('race:ready',(_,ack)=>raceAction(socket,ack,({room,player})=>kart.ready(room.race,player.id)));
 socket.on('race:item',()=>{const {room,player}=current(socket);if(room?.mode==='race'&&!room.paused&&room.race&&player){const error=kart.useItem(room.race,player.id);if(!error){room.updated=Date.now();broadcast(room);}}});
 socket.on('race:input',({steer=0,boost=false}={})=>{const {room,player}=current(socket);if(room?.mode==='race'&&!room.paused&&room.race&&player)kart.input(room.race,player.id,steer,boost);});
 socket.on('battle:select',({allies}={},ack)=>battleAction(socket,ack,({room,player})=>battle.select(room.battle,player.id,allies)));
 socket.on('battle:ready',(_,ack)=>battleAction(socket,ack,({room,player})=>battle.teamReady(room.battle,player.id,room.players)));
 socket.on('battle:claim',(_,ack)=>battleAction(socket,ack,({room,player})=>battle.claim(room.battle,player.id)));
 socket.on('battle:buy',({upgrade}={},ack)=>battleAction(socket,ack,({room,player})=>battle.buy(room.battle,player.id,upgrade)));
 socket.on('battle:shopready',(_,ack)=>battleAction(socket,ack,({room,player})=>battle.shopReady(room.battle,player.id,room.players)));
 socket.on('battle:move',({actor,target,move}={},ack)=>battleAction(socket,ack,({room,player})=>{
  const err=battle.fight(room.battle,room.players,player.id,actor,target,move);
  if(!err && room.battle.stage==='finished'){room.phase='finished';room.deadline=null;}
  return err;
 }));
 socket.on('restart',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player||player.id!==room.players[0].id)return ackError(ack,'Host only.');
  if(!hasCompletedGame(room))return ackError(ack,'Finish the game first.');
  clearTimeout(room.timer);room.deadline=null;room.phase='lobby';room.party=null;room.votes={};room.paused=false;room.pausedAt=null;room.pausedBy=null;room.index=0;room.story=null;room.mini=null;room.arcade=null;room.race=null;room.battle=null;room.players.forEach(p=>{p.score=0;p.answer=null;p.ready=false});broadcast(room);ackOK(ack,{});
 });
 socket.on('leave',(_,ack)=>{
  const {room,player}=current(socket);
  if(!room||!player){socket.data={};return ackOK(ack,{});}
  // Ignore stale tabs so they cannot remove a player on a different device.
  if(player.socketId!==socket.id){socket.data={};return ackOK(ack,{});}
  const wasHost=room.players[0]?.id===player.id;
  socket.leave(room.code);
  socket.data={};
  room.updated=Date.now();
  if(wasHost){
   clearTimeout(room.timer);room.timer=null;rooms.delete(room.code);
   for(const remaining of room.players){
    if(remaining.id!==player.id&&remaining.socketId){
     const other=io.sockets.sockets.get(remaining.socketId);
     if(other){other.leave(room.code);other.data={};other.emit('room:closed',{message:'The host left. Create a new room to play again.'});}
    }
   }
  }else{
   room.players=room.players.filter(p=>p.id!==player.id);
   clearTimeout(room.timer);room.timer=null;room.phase='lobby';room.index=0;room.deadline=null;room.paused=false;room.pausedAt=null;room.pausedBy=null;
   room.battle=null;room.compat=null;room.story=null;room.race=null;room.mini=null;room.arcade=null;room.party=null;room.votes={};
   room.players.forEach(p=>{p.answer=null;p.ready=false;p.score=0;});
   broadcast(room);
  }
  ackOK(ack,{});
 });
 socket.on('disconnect',()=>{
  const {room,player}=current(socket);
  if(player&&player.socketId===socket.id){player.socketId=null;room.updated=Date.now();broadcast(room);}
 });
});
function raceAction(socket,ack,fn){const {room,player}=current(socket);if(!room||!player||room.paused||room.mode!=='race'||!room.race||room.phase!=='playing')return ackError(ack,'Race unavailable.');const error=fn({room,player});if(error)return ackError(ack,error);room.updated=Date.now();broadcast(room);ackOK(ack,{});}
function battleAction(socket,ack,fn){const {room,player}=current(socket);if(!room||!player||room.paused||room.mode!=='sipbattle'||!room.battle||!['playing','finished'].includes(room.phase))return ackError(ack,'Battle unavailable.');try{const error=fn({room,player});if(error)return ackError(ack,error);room.updated=Date.now();broadcast(room);ackOK(ack,{});}catch(e){console.error('Battle action error:',e);ackError(ack,'Move failed.');}}
function current(socket){const room=rooms.get(socket.data?.code);return {room,player:room&&findPlayer(room,socket.data.token)};}
setInterval(()=>{for(const room of rooms.values()){if(room.mode==='party'&&!room.paused&&room.phase==='playing'&&party.tick(room.party,room.players)){room.updated=Date.now();broadcast(room);}if(room.mode==='party'&&!room.paused&&room.phase==='playing'&&room.party?.stage==='playing'&&party.current(room.party)?.type==='tap'&&Date.now()>room.party.goAt+4500){party.finish(room.party,room.players);room.updated=Date.now();broadcast(room);}if(room.arcade&&!room.paused&&room.phase==='playing'){if(arcade.tick(room.arcade)){if(room.arcade.stage==='finished')room.phase='finished';room.updated=Date.now();broadcast(room);}}if(room.mini&&!room.paused&&room.phase==='playing'){if(mini.tick(room.mini)){if(room.mini.stage==='finished')room.phase='finished';room.updated=Date.now();broadcast(room);}}if(room.mode==='race'&&!room.paused&&room.race&&room.phase==='playing'){kart.advance(room.race);if(room.race.stage==='finished')room.phase='finished';if(['countdown','racing','finished'].includes(room.race.stage))broadcast(room);}}},100).unref();
setInterval(()=>{const cutoff=Date.now()-1000*60*60*6;for(const [key,room] of rooms)if(room.updated<cutoff){clearTimeout(room.timer);rooms.delete(key)};},60000).unref();
const port=process.env.PORT||3000;
if(require.main===module)server.listen(port,()=>console.log(`Sip Happens listening on http://localhost:${port}`));
module.exports={app,server,rooms};
