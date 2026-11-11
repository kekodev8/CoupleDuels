const {test}=require('node:test');const assert=require('node:assert/strict');const story=require('./story');
const players=[{id:'a',name:'Alex'},{id:'b',name:'Sam'}];
test('create story uses five rounds and a cooperative ending',()=>{const s=story.makeStory();assert.equal(s.stage,'turn');assert.equal(story.publicStory(s,players).turnPlayerId,'a');assert.ok(s.opening);assert.equal(s.twists.length,4);assert.equal(s.deadline> Date.now(),true);
 for(let chapter=1;chapter<=5;chapter++){
  assert.equal(story.publicStory(s,players).round,chapter);
  story.finishTurn(s,players);assert.equal(story.publicStory(s,players).turnPlayerId,'b');
  story.finishTurn(s,players);assert.equal(s.stage,'twist');assert.equal(s.deadline,null);
  assert.equal(story.readyTwist(s,'a',players),null);assert.equal(s.stage,'twist');
  assert.equal(story.readyTwist(s,'b',players),null);assert.equal(s.stage,'turn');
 }
 assert.equal(story.publicStory(s,players).ending,true);assert.equal(story.publicStory(s,players).turnPlayerId,'a');story.finishTurn(s,players);assert.equal(story.publicStory(s,players).turnPlayerId,'b');story.finishTurn(s,players);assert.equal(s.stage,'finished');assert.equal(s.history.length,12);
});
test('twists are unique and the timer does not apply during twists',()=>{for(let i=0;i<30;i++){const s=story.makeStory();assert.equal(new Set(s.twists).size,4);story.finishTurn(s,players);story.finishTurn(s,players);assert.equal(story.publicStory(s,players).deadline,null);assert.ok(story.publicStory(s,players).prompt);}});
