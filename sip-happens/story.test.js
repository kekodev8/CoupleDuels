const {test}=require('node:test');
const assert=require('node:assert/strict');
const story=require('./story');
const players=[{id:'a',name:'Alex'},{id:'b',name:'Sam'}];
test('five chapters contain 4-6 two-player exchanges each',()=>{
 for(let i=0;i<40;i++){
  const s=story.makeStory();
  assert.equal(s.chapterExchanges.length,5);
  assert.ok(s.chapterExchanges.every(n=>n>=4&&n<=6));
  assert.equal(s.chapterEnds.at(-1),s.chapterExchanges.reduce((a,b)=>a+b*2,0));
  assert.equal(story.publicStory(s,players).turnSeconds,45);
  assert.equal(new Set(s.twists).size,4);
 }
});
test('each chapter stays on scene for all exchanges, then shows untimed twist',()=>{
 const s=story.makeStory();
 for(let chapter=1;chapter<=5;chapter++){
  const exchanges=s.chapterExchanges[chapter-1];
  for(let exchange=1;exchange<=exchanges;exchange++){
   let b=story.publicStory(s,players);
   assert.equal(b.round,chapter);assert.equal(b.exchange,exchange);assert.equal(b.turnPlayerId,'a');
   story.finishTurn(s,players);
   b=story.publicStory(s,players);
   assert.equal(b.turnPlayerId,'b');assert.equal(b.stage,'turn');
   story.finishTurn(s,players);
   if(exchange<exchanges){assert.equal(s.stage,'turn');assert.equal(story.publicStory(s,players).round,chapter);}
  }
  assert.equal(s.stage,'twist');assert.equal(s.deadline,null);
  assert.ok(story.publicStory(s,players).prompt);
  assert.equal(story.readyTwist(s,'a',players),null);assert.equal(s.stage,'twist');
  assert.equal(story.readyTwist(s,'b',players),null);assert.equal(s.stage,'turn');
 }
 assert.equal(story.publicStory(s,players).ending,true);
 assert.equal(story.publicStory(s,players).turnPlayerId,'a');
 story.finishTurn(s,players);assert.equal(story.publicStory(s,players).turnPlayerId,'b');
 story.finishTurn(s,players);assert.equal(s.stage,'finished');
 assert.equal(s.history.length,s.chapterEnds.at(-1)+2);
});
test('45-second deadline refreshes after each turn, never for twists',()=>{
 const s=story.makeStory();assert.ok(s.deadline-Date.now()>44000);
 for(let i=0;i<s.chapterEnds[0];i++)story.finishTurn(s,players);
 assert.equal(s.deadline,null);assert.equal(story.publicStory(s,players).deadline,null);
 story.readyTwist(s,'a',players);story.readyTwist(s,'b',players);
 assert.ok(s.deadline-Date.now()>44000);
});
