const test=require('node:test');
const assert=require('node:assert/strict');
const {rapidBank,createRapidDeck,RAPID_ROUNDS,publicRound}=require('./game');
test('90 unique prompts, 30 per stage and valid options',()=>{
 assert.equal(rapidBank.length,90);
 assert.equal(new Set(rapidBank.map(x=>x.title)).size,90);
 for(let stage=1;stage<=3;stage++)assert.equal(rapidBank.filter(x=>x.stage===stage).length,30);
 for(const r of rapidBank){assert.ok(r.title&&r.prompt); if(r.type!=='challenge')assert.ok(r.choices?.length>=2);}
});
test('random deck has 15 unique prompts, five per stage',()=>{
 for(let run=0;run<50;run++){
  const deck=createRapidDeck();assert.equal(deck.rounds.length,RAPID_ROUNDS);
  assert.equal(new Set(deck.ids).size,15);
  for(let stage=1;stage<=3;stage++)assert.equal(deck.rounds.filter(r=>r.stage===stage).length,5);
  assert.equal(publicRound(deck.rounds[0],0).id,undefined);
 }
});
test('rematches prioritize never-before-seen questions',()=>{
 let history=[];
 for(let i=0;i<6;i++){
  const deck=createRapidDeck(history);
  assert.ok(deck.ids.every(x=>!history.includes(x)));
  history.push(...deck.ids);
 }
 assert.equal(new Set(history).size,90);
});
