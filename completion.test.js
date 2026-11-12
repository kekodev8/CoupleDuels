'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const arcade=require('./arcade');
const {hasCompletedGame,syncCompletion}=require('./completion');
const players=[{id:'p1',name:'Keko'},{id:'p2',name:'Jill'}];
for(const mode of ['distorted','memory']){
 test(`${mode}: completing final reveal unlocks rematch without timer tick`,()=>{
  const room={phase:'playing',arcade:arcade.make(mode,players),paused:false,deadline:null};
  const g=room.arcade;
  g.index=g.total-1;
  g.stage= mode==='memory'?'guess':'question';
  const correct=g[mode==='memory'?'memory':'cards'][g.index].choices.indexOf(g[mode==='memory'?'memory':'cards'][g.index].answer);
  assert.equal(arcade.answer(g,'p1',correct),null);
  assert.equal(arcade.answer(g,'p2',correct),null);
  assert.equal(g.stage,'reveal');
  assert.equal(arcade.ready(g,'p1'),null);
  assert.equal(g.stage,'reveal');
  assert.equal(arcade.ready(g,'p2'),null);
  assert.equal(g.stage,'finished');
  assert.equal(room.phase,'playing'); // reproduces old bug
  assert.equal(hasCompletedGame(room),true);
  syncCompletion(room);
  assert.equal(room.phase,'finished');
 });
}
test('quick draw and other completed engines allow rematch',()=>{
 for(const field of ['mini','arcade','race','story','battle']){
  const room={phase:'playing',[field]:{stage:'finished'}};
  assert.equal(hasCompletedGame(room),true,field);
  assert.equal(syncCompletion(room),true);
  assert.equal(room.phase,'finished');
 }
});
