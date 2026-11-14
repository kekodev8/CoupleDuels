'use strict';
// Party Mode: 16 synchronized, condensed mini-rounds drawn from all 11 game themes.
const MODES=['rapid','compatibility','sipbattle','story','race','mindmeld','emojirush','tapduel','distorted','quickdraw','memory'];
const POOLS={
 rapid:[['Who is most likely to laugh at the worst possible moment?',['Me','My partner','Both of us'],null,'match'],['Who would survive a haunted house longer?',['Me','My partner','Both of us'],null,'match']],
 compatibility:[['Pick the ideal surprise date.',['Arcade','Movie night','Road trip','Fancy dinner'],null,'match'],['Which superpower would you both take?',['Teleport','Fly','Read minds','Time travel'],null,'match']],
 sipbattle:[['Battle! Pick your move. Rock beats scissors, scissors beats paper, paper beats rock.',['Rock','Paper','Scissors'],null,'rps']],
 story:[['Your story starts with a mysterious door. What is behind it?',['A portal','A talking cat','A secret party','A monster'],null,'match'],['Which plot twist makes the better ending?',['Everyone was dreaming','The villain is family','Time starts reversing','The pet saves the day'],null,'match']],
 race:[['Kart Clash sprint! Pick your route. Try to outsmart your rival.',['Shortcut','Speed boost','Safe road'],null,'rps']],
 mindmeld:[['MIND MELD: Without talking, pick the same snack.',['Pizza','Popcorn','Tacos','Ice cream'],null,'match'],['MIND MELD: Pick the same vacation.',['Beach','Mountain','City','Road trip'],null,'match']],
 emojirush:[['Guess the movie: 🦁👑',['The Lion King','Frozen','Shrek','Finding Nemo'],0,'quiz'],['Guess the film: ❄️👑⛄',['Moana','Frozen','Coco','Up'],1,'quiz'],['Guess the film: 🐠🔎',['Finding Nemo','Toy Story','Ratatouille','Cars'],0,'quiz']],
 tapduel:[['TAP DUEL: Be the first to tap when GO appears!',['TAP'],null,'tap']],
 distorted:[['MYSTERY GUESS: A yellow square lives in a pineapple under the sea.',['SpongeBob','Gumball','Jake','Pikachu'],0,'quiz'],['MYSTERY GUESS: A boy wears a magical watch with alien transformations.',['Ben 10','Finn','Dexter','Steven'],0,'quiz']],
 quickdraw:[['QUICK DRAW: First to tap after GO wins!',['DRAW'],null,'tap']],
 memory:[['MEMORY HEIST: Remember these items: 🍕 🎮 🐱 🚗. Which was third?',['Pizza','Controller','Cat','Car'],2,'quiz'],['MEMORY HEIST: Remember: 🔑 🦋 🎲 🎸. Which came first?',['Guitar','Key','Butterfly','Dice'],1,'quiz']],
};
function shuffle(a,random=Math.random){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function make(random=Math.random){const modes=shuffle([...MODES,...shuffle([...MODES],random).slice(0,5)],random);const seen={};return {index:0,stage:'playing',rounds:modes.map(mode=>{const list=POOLS[mode];const n=seen[mode]||0;seen[mode]=n+1;const [prompt,choices,correct,type]=list[n%list.length];return {mode,prompt,choices,correct,type};}),answers:{},ready:{},results:null,goAt:0,challenge:'',outcome:''};}
function current(p){return p?.rounds[p.index];}
function publicState(p,players){if(!p)return null;const r=current(p);return {index:p.index,total:16,stage:p.stage,round:r?{mode:r.mode,prompt:r.prompt,choices:r.choices,type:r.type}:null,goAt:p.goAt,results:p.results,challenge:p.challenge||'',outcome:p.outcome||'',players:players.map(x=>({id:x.id,name:x.name,score:x.score,answered:Object.hasOwn(p.answers,x.id),ready:!!p.ready[x.id]}))};}
function begin(p){p.stage='playing';p.answers={};p.ready={};p.results=null;p.goAt=current(p)?.type==='tap'?Date.now()+1800:0;}
function submit(p,players,id,answer,now=Date.now()){
 const r=current(p);if(!r||p.stage!=='playing')return 'Round is not accepting answers.';
 if(Object.hasOwn(p.answers,id))return 'Already answered.';
 if(!players.some(x=>x.id===id))return 'Unknown player.';
 if(r.type==='tap'){
  if(answer!=='tap')return 'Invalid tap.';
  p.answers[id]=now<p.goAt?'false-start':now;
 }else if(r.type==='quiz'||r.type==='match'||r.type==='rps'){
  if(!Number.isInteger(answer)||answer<0||answer>=r.choices.length)return 'Invalid answer.';
  p.answers[id]=answer;
 }else return 'Invalid round type.';
 if(r.type==='tap'&&now>=p.goAt){ // A clean first tap ends the heat; late player may still tap but cannot steal points.
   finish(p,players);
 }else if(players.every(x=>Object.hasOwn(p.answers,x.id))){finish(p,players);}
 return null;
}
function finish(p,players){if(p.stage!=='playing')return;p.stage='reveal';const r=current(p),a=players.map(x=>p.answers[x.id]);const awarded={};for(const x of players)awarded[x.id]=0;
 if(r.type==='quiz'){players.forEach((x,i)=>{if(a[i]===r.correct)awarded[x.id]=2;});}
 else if(r.type==='match'){if(a.length===2&&a[0]===a[1])players.forEach(x=>awarded[x.id]=2);}
 else if(r.type==='rps'&&a.length===2){const win=(a[0]-a[1]+3)%3;if(win===1)awarded[players[0].id]=3;else if(win===2)awarded[players[1].id]=3;else players.forEach(x=>awarded[x.id]=1);}
 else if(r.type==='tap'){const good=players.filter(x=>typeof p.answers[x.id]==='number');if(good.length){good.sort((x,y)=>p.answers[x.id]-p.answers[y.id]);awarded[good[0].id]=3;}}
 for(const x of players)x.score+=awarded[x.id];
 p.results={awarded,answers:players.map(x=>({id:x.id,answer:p.answers[x.id]??null})),correct:r.type==='quiz'?r.correct:null};
}
function ready(p,players,id){if(p.stage!=='reveal')return 'Not at the results screen.';if(!players.some(x=>x.id===id))return 'Unknown player.';p.ready[id]=true;if(players.every(x=>p.ready[x.id])){p.index++;if(p.index>=16)p.stage='finished';else begin(p);}return null;}
module.exports={MODES,POOLS,make,current,publicState,begin,submit,finish,ready};
