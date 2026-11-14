'use strict';
// Party Mode: 16 synchronized mini-games. The Kart and Quick Draw heats are real interactive games.
const MODES=['rapid','compatibility','sipbattle','story','race','mindmeld','emojirush','tapduel','distorted','quickdraw','memory'];
const DRAW_WORDS=['cat','pizza','rocket','ghost','banana','castle','skateboard','frog','tornado','robot','unicorn','pancake','bicycle','pirate','dinosaur','umbrella','popcorn','spider','rainbow','volcano','snowman','dragon','toothbrush','headphones','cowboy','spaceship','taco','mermaid','penguin','vampire','guitar','lollipop','shark','cactus','mushroom','hotdog','sunglasses','butterfly','wizard','donut'];
const POOLS={
 rapid:[['Who is most likely to laugh at the worst possible moment?',['Me','My partner','Both of us'],null,'match'],['Who would survive a haunted house longer?',['Me','My partner','Both of us'],null,'match']],
 compatibility:[['Pick the ideal surprise date.',['Arcade','Movie night','Road trip','Fancy dinner'],null,'match'],['Which superpower would you both take?',['Teleport','Fly','Read minds','Time travel'],null,'match']],
 sipbattle:[['Battle! Rock beats scissors, scissors beats paper, paper beats rock.',['Rock','Paper','Scissors'],null,'rps']],
 story:[['Your story starts with a mysterious door. What is behind it?',['A portal','A talking cat','A secret party','A monster'],null,'match'],['Which plot twist makes the better ending?',['Everyone was dreaming','The villain is family','Time starts reversing','The pet saves the day'],null,'match']],
 race:[['KART CLASH — steer around obstacles in a 15-second head-to-head race!',[],null,'kart']],
 mindmeld:[['MIND MELD: Without talking, pick the same snack.',['Pizza','Popcorn','Tacos','Ice cream'],null,'match'],['MIND MELD: Pick the same vacation.',['Beach','Mountain','City','Road trip'],null,'match']],
 emojirush:[['Guess the movie: 🦁👑',['The Lion King','Frozen','Shrek','Finding Nemo'],0,'quiz'],['Guess the film: ❄️👑⛄',['Moana','Frozen','Coco','Up'],1,'quiz'],['Guess the film: 🐠🔎',['Finding Nemo','Toy Story','Ratatouille','Cars'],0,'quiz']],
 tapduel:[['TAP DUEL: Be the first to tap when GO appears!',['TAP'],null,'tap']],
 distorted:[['MYSTERY GUESS: A yellow square lives in a pineapple under the sea.',['SpongeBob','Gumball','Jake','Pikachu'],0,'quiz'],['MYSTERY GUESS: A boy wears a magical watch with alien transformations.',['Ben 10','Finn','Dexter','Steven'],0,'quiz']],
 quickdraw:[['QUICK DRAW — 4 sketch-and-guess turns: 10, 8, 6 and 4 seconds!',[],null,'draw']],
 memory:[['MEMORY HEIST: Remember: 🍕 🎮 🐱 🚗. Which was third?',['Pizza','Controller','Cat','Car'],2,'quiz'],['MEMORY HEIST: Remember: 🔑 🦋 🎲 🎸. Which came first?',['Guitar','Key','Butterfly','Dice'],1,'quiz']],
};
function shuffle(a,random=Math.random){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function make(random=Math.random){const modes=shuffle([...MODES,...shuffle([...MODES],random).slice(0,5)],random);const seen={};return {index:0,stage:'playing',rounds:modes.map(mode=>{const list=POOLS[mode];const n=seen[mode]||0;seen[mode]=n+1;const [prompt,choices,correct,type]=list[n%list.length];return {mode,prompt,choices,correct,type};}),answers:{},ready:{},results:null,goAt:0,draw:null,kart:null,challenge:'',outcome:''};}
function current(p){return p?.rounds[p.index];}
function begin(p,players=[],now=Date.now()){p.stage='playing';p.answers={};p.ready={};p.results=null;p.draw=null;p.kart=null;const r=current(p);p.goAt=r?.type==='tap'?now+1800:0;
 if(r?.type==='draw')startDraw(p,players,now);
 if(r?.type==='kart')p.kart={endAt:now+15000,lastTick:now,spawnAt:now+900,seq:0,hazards:[],cars:Object.fromEntries(players.map(x=>[x.id,{lane:1,hits:0,stars:0}])),awarded:{}};
}
function startDraw(p,players,now=Date.now(),heat=0,totals=null){const drawer=players[(p.index+heat)%players.length];p.draw={heat,phase:'draw',drawerId:drawer?.id||null,word:DRAW_WORDS[(p.index*11+heat*13+Math.floor(now/100000))%DRAW_WORDS.length],deadline:now+[10000,8000,6000,4000][heat],strokes:[],totals:totals||Object.fromEntries(players.map(x=>[x.id,0])),correct:false,lastStrokeAt:0};}
function publicState(p,players,viewerId=null){if(!p)return null;const r=current(p),d=p.draw,k=p.kart;return {index:p.index,total:16,stage:p.stage,round:r?{mode:r.mode,prompt:r.prompt,choices:r.choices,type:r.type}:null,goAt:p.goAt,results:p.results,challenge:p.challenge||'',outcome:p.outcome||'',draw:d?{heat:d.heat,phase:d.phase,drawerId:d.drawerId,word:(viewerId===d.drawerId||d.phase==='review')?d.word:null,deadline:d.deadline,strokes:d.strokes,correct:d.correct,totals:d.totals}:null,kart:k?{endAt:k.endAt,hazards:k.hazards,cars:k.cars}:null,players:players.map(x=>({id:x.id,name:x.name,score:x.score,answered:Object.hasOwn(p.answers,x.id),ready:!!p.ready[x.id]}))};}
function submit(p,players,id,answer,now=Date.now()){const r=current(p);if(!r||p.stage!=='playing')return 'Round is not accepting answers.';if(r.type==='draw'||r.type==='kart')return 'Use this mini-game’s controls.';if(Object.hasOwn(p.answers,id))return 'Already answered.';if(!players.some(x=>x.id===id))return 'Unknown player.';
 if(r.type==='tap'){if(answer!=='tap')return 'Invalid tap.';p.answers[id]=now<p.goAt?'false-start':now;}
 else if(['quiz','match','rps'].includes(r.type)){if(!Number.isInteger(answer)||answer<0||answer>=r.choices.length)return 'Invalid answer.';p.answers[id]=answer;}
 else return 'Invalid round type.';
 if(r.type==='tap'&&now>=p.goAt)finish(p,players);else if(players.every(x=>Object.hasOwn(p.answers,x.id)))finish(p,players);return null;}
function finish(p,players){if(p.stage!=='playing')return;p.stage='reveal';const r=current(p),a=players.map(x=>p.answers[x.id]);const awarded={};for(const x of players)awarded[x.id]=0;
 if(r.type==='quiz')players.forEach((x,i)=>{if(a[i]===r.correct)awarded[x.id]=2;});
 else if(r.type==='match'){if(a.length===2&&a[0]===a[1])players.forEach(x=>awarded[x.id]=2);}
 else if(r.type==='rps'&&a.length===2){const win=(a[0]-a[1]+3)%3;if(win===1)awarded[players[0].id]=3;else if(win===2)awarded[players[1].id]=3;else players.forEach(x=>awarded[x.id]=1);}
 else if(r.type==='tap'){const good=players.filter(x=>typeof p.answers[x.id]==='number');if(good.length){good.sort((x,y)=>p.answers[x.id]-p.answers[y.id]);awarded[good[0].id]=3;}}
 else if(r.type==='draw'){for(const x of players)awarded[x.id]=p.draw.totals[x.id]||0;}
 else if(r.type==='kart'){const cars=p.kart.cars;for(const x of players){const c=cars[x.id];awarded[x.id]=Math.max(0,2+c.stars*2-c.hits);}}
 for(const x of players)x.score+=awarded[x.id];p.results={awarded,answers:players.map(x=>({id:x.id,answer:p.answers[x.id]??null})),correct:r.type==='quiz'?r.correct:null};}
function ready(p,players,id){if(p.stage!=='reveal')return 'Not at the results screen.';if(!players.some(x=>x.id===id))return 'Unknown player.';p.ready[id]=true;if(players.every(x=>p.ready[x.id])){p.index++;if(p.index>=16)p.stage='finished';else begin(p,players);}return null;}
function drawStroke(p,players,id,points,now=Date.now()){const d=p.draw;if(!d||current(p)?.type!=='draw'||p.stage!=='playing'||d.phase!=='draw'||d.drawerId!==id||now>d.deadline)return 'Drawing unavailable.';
 if(!Array.isArray(points)||points.length<1||points.length>24||d.strokes.length>=1200)return 'Invalid stroke.';
 const clean=[];for(const point of points){if(!Array.isArray(point)||point.length!==3||!point.every(n=>typeof n==='number'&&Number.isFinite(n))||point[0]<0||point[0]>1||point[1]<0||point[1]>1||![0,1].includes(point[2]))return 'Invalid stroke.';clean.push(point.map((n,i)=>i<2?Math.round(n*1000)/1000:n));}d.strokes.push(...clean);return null;}
function guess(p,players,id,word,now=Date.now()){const d=p.draw;if(!d||current(p)?.type!=='draw'||d.phase!=='guess'||p.stage!=='playing'||id===d.drawerId)return 'Guess unavailable.';
 if(!players.some(x=>x.id===id))return 'Unknown player.';
 if(now>d.deadline)return 'Time expired.';
 const normalize=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');if(!normalize(word))return 'Enter a guess.';
 if(normalize(word)===normalize(d.word)){d.correct=true;d.totals[id]=(d.totals[id]||0)+3;d.totals[d.drawerId]=(d.totals[d.drawerId]||0)+2;d.phase='review';d.deadline=now+2200;return null;}
 return 'Not quite! Try again.';}
function lane(p,players,id,step){const k=p.kart;if(!k||current(p)?.type!=='kart'||p.stage!=='playing'||!Number.isInteger(step)||Math.abs(step)!==1||!players.some(x=>x.id===id))return 'Kart controls unavailable.';k.cars[id].lane=Math.max(0,Math.min(2,k.cars[id].lane+step));return null;}
function tick(p,players,now=Date.now()){
 if(p.stage!=='playing')return false;const r=current(p);
 if(r?.type==='draw'&&p.draw){const d=p.draw;if(now<d.deadline)return false;
  if(d.phase==='draw'){d.phase='guess';d.deadline=now+12000;return true;}
  if(d.phase==='guess'){d.phase='review';d.deadline=now+1900;return true;}
  if(d.phase==='review'){if(d.heat===3){finish(p,players);}else startDraw(p,players,now,d.heat+1,d.totals);return true;}}
 if(r?.type==='kart'&&p.kart){const k=p.kart;if(now>=k.endAt){finish(p,players);return true;}
  const dt=Math.min(500,Math.max(0,now-k.lastTick));if(dt<170)return false;k.lastTick=now;
  for(const h of k.hazards)h.y+=dt/3100;
  for(const h of k.hazards){if(h.y>=.86&&!h.done){h.done=true;for(const x of players){const c=k.cars[x.id];if(c.lane===h.lane){if(h.type==='star')c.stars++;else c.hits++;}}}}
  k.hazards=k.hazards.filter(h=>h.y<1.12);
  if(now>=k.spawnAt){k.seq++;const lane=(k.seq*7+Math.floor(p.index*3))%3;k.hazards.push({id:k.seq,lane,y:-.1,type:k.seq%4===0?'star':'cone',done:false});k.spawnAt=now+920;}
  return true;}
 return false;}
module.exports={MODES,DRAW_WORDS,POOLS,make,current,publicState,begin,submit,finish,ready,drawStroke,guess,lane,tick,startDraw};
