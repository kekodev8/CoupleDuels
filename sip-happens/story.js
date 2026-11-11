'use strict';
const crypto=require('crypto');
const OPENINGS=[
 'Your story begins on a completely ordinary Tuesday… until the sky changes color.',
 'You discover a mysterious key tucked inside your couch.',
 'A stranger knocks and says they have been expecting both of you.',
 'You wake up on a spaceship with no memory of boarding.',
 'An old photo shows the two of you in a place you have never visited.',
 'Your pet suddenly starts speaking with a very serious accent.',
 'A treasure map appears on the back of a restaurant receipt.',
 'The elevator opens onto a floor that cannot possibly exist.',
 'A letter arrives addressed to both of you from the year 2089.',
 'A tiny dragon lands on the windowsill and demands breakfast.',
 'An abandoned amusement park lights up as you walk past.',
 'The last bus of the night takes a detour into another universe.'
];
const TWISTS=[
 'Out of nowhere, a giant wearing a tiny party hat blocks your path.',
 'Someone discovers that the villain is actually their future self.',
 'A mysterious door appears, but it only opens when someone tells a terrible joke.',
 'All the characters suddenly swap voices.',
 'A pigeon arrives carrying an extremely important royal message.',
 'The ground begins floating into the sky in giant pieces.',
 'An unexpected guest reveals they have been invisible the entire time.',
 'The main character loses their memory for exactly five minutes.',
 'Everything suddenly turns into a musical. Someone has to sing a line.',
 'An ordinary object becomes incredibly powerful for no good reason.',
 'A loud announcement declares that the world will reset in ten minutes.',
 'A talking cat demands a dramatic sacrifice: the last slice of pizza.',
 'The duo discovers that the map has been upside down this whole time.',
 'A tiny storm cloud follows only one of the characters.',
 'A rival team arrives, but they are suspiciously identical to you.',
 'A portal opens and spits out hundreds of rubber ducks.',
 'A secret passage leads directly into a wedding reception.',
 'Someone accidentally presses a huge button marked DO NOT PRESS.',
 'A character reveals a secret double life as an underground magician.',
 'The only way forward is to win a cooking competition.',
 'Suddenly, gravity stops working for thirty seconds.',
 'An ancient prophecy turns out to have a very embarrassing typo.',
 'The monster you were running from asks for relationship advice.',
 'A mysterious countdown appears above everyone’s heads.'
];
const ENDINGS=[
 'FINAL TWIST: The supposed villain was trying to save everyone. Wrap up the story together!',
 'FINAL TWIST: The story must end back where it began, but one thing has changed forever.',
 'FINAL TWIST: You have one wish left. Decide what happens, then end the story.',
 'FINAL TWIST: A shocking secret is revealed just before the final scene. Give this adventure its ending.',
 'FINAL TWIST: The whole adventure was leading to one impossible choice. Resolve it together.',
 'FINAL TWIST: The mysterious object from the beginning returns. Close the loop!',
 'FINAL TWIST: A very unexpected hero saves the day. Explain how it all ends.',
 'FINAL TWIST: The world is safe—but something absurd will never be the same.'
];
const TURN_SECONDS=45;
const CHAPTER_COUNT=5;
const MIN_EXCHANGES=4;
const MAX_EXCHANGES=6;
const sample=a=>a[crypto.randomInt(a.length)];
function makeStory(){
 const twists=[...TWISTS];
 for(let i=twists.length-1;i>0;i--){const j=crypto.randomInt(i+1);[twists[i],twists[j]]=[twists[j],twists[i]];}
 const chapterExchanges=Array.from({length:CHAPTER_COUNT},()=>crypto.randomInt(MIN_EXCHANGES,MAX_EXCHANGES+1));
 const chapterEnds=[];let accumulated=0;
 for(const exchanges of chapterExchanges){accumulated+=exchanges*2;chapterEnds.push(accumulated);}
 return {step:0,stage:'turn',ready:[],opening:sample(OPENINGS),twists:twists.slice(0,CHAPTER_COUNT-1),ending:sample(ENDINGS),history:[],chapterExchanges,chapterEnds,deadline:Date.now()+TURN_SECONDS*1000};
}
function publicStory(story,players){
 const endingStart=story.chapterEnds.at(-1);
 const ending=story.step>=endingStart;
 const chapterIndex=story.chapterEnds.findIndex(end=>story.step<end);
 const round=ending?CHAPTER_COUNT:chapterIndex+1;
 const previousEnd=round===1?0:story.chapterEnds[round-2];
 const exchange=ending?null:Math.floor((story.step-previousEnd)/2)+1;
 const isFinalTwist=story.stage==='twist'&&ending;
 return {stage:story.stage,step:story.step,round,exchange,exchangesInChapter:story.chapterExchanges[round-1],ending,endingStart,totalTurns:endingStart+2,turnSeconds:TURN_SECONDS,
  turnPlayerId:players[story.step%2]?.id||null,turnName:players[story.step%2]?.name||'',deadline:story.stage==='turn'?story.deadline:null,
  opening:story.opening,prompt:story.stage==='twist'?(isFinalTwist?story.ending:story.twists[round-2]):null,
  ready:story.ready.slice(),history:story.history.slice(),totalRounds:CHAPTER_COUNT};
}
function finishTurn(story,players){
 if(story.stage!=='turn')return false;
 const endingStart=story.chapterEnds.at(-1);
 const chapter=story.chapterEnds.findIndex(end=>story.step<end)+1;
 story.history.push({name:players[story.step%2].name,round:story.step>=endingStart?'Ending':chapter});
 story.step++;
 if(story.step>=endingStart+2){story.stage='finished';story.deadline=null;}
 else if(story.chapterEnds.includes(story.step)){
  story.stage='twist';story.deadline=null;story.ready=[];
 }else{story.deadline=Date.now()+TURN_SECONDS*1000;}
 return true;
}
function readyTwist(story,id,players){
 if(story.stage!=='twist')return 'No plot twist to continue from.';
 if(!players.some(p=>p.id===id))return 'Player not in room.';
 if(!story.ready.includes(id))story.ready.push(id);
 if(players.every(p=>story.ready.includes(p.id))){story.ready=[];story.stage='turn';story.deadline=Date.now()+TURN_SECONDS*1000;}
 return null;
}
module.exports={OPENINGS,TWISTS,ENDINGS,TURN_SECONDS,CHAPTER_COUNT,MIN_EXCHANGES,MAX_EXCHANGES,makeStory,publicStory,finishTurn,readyTwist};
