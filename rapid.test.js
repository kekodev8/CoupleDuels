const test=require('node:test');
const assert=require('node:assert/strict');
const {rapidBank,createRapidDeck,RAPID_ROUNDS,publicRound}=require('./game');
test('90 unique prompts, 30 per stage and valid options',()=>{
 assert.equal(rapidBank.length,90);
 assert.equal(new Set(rapidBank.map(x=>x.title)).size,90);
 for(let stage=1;stage<=3;stage++)assert.equal(rapidBank.filter(x=>x.stage===stage).length,30);
 for(const r of rapidBank){assert.ok(r.title&&r.prompt); if(r.type!=='challenge')assert.ok(r.choices?.length>=2);}
});
test('rapid deck has four chapters of four questions then one performance prompt',()=>{
 for(let run=0;run<50;run++){
  const deck=createRapidDeck();assert.equal(deck.rounds.length,20);
  assert.equal(new Set(deck.ids).size,20);
  for(let i=0;i<4;i++){
   const block=deck.rounds.slice(i*5,i*5+5);
   assert.ok(block.slice(0,4).every(r=>r.type!=='challenge'));
   assert.equal(block[4].type,'challenge');
  }
  assert.equal(publicRound(deck.rounds[0],0).id,undefined);
 }
});
test('rematches prioritize fresh questions until depleted',()=>{
 let history=[];
 for(let i=0;i<3;i++){
  const deck=createRapidDeck(history);
  assert.ok(deck.ids.every(x=>!history.includes(x)));
  history.push(...deck.ids);
 }
 assert.equal(new Set(history).size,60);
});
