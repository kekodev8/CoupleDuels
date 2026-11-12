'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {pauseRoom,resumeRoom}=require('./pause');
test('story clock resumes with exactly the time remaining before pause',()=>{
 const room={paused:false,deadline:null,story:{deadline:45000}};
 assert.equal(pauseRoom(room,'Alex',12000),true);
 assert.equal(room.pausedBy,'Alex');
 assert.equal(resumeRoom(room,90000),true);
 assert.equal(room.story.deadline,123000); // 33 seconds remaining at resumption
 assert.equal(room.paused,false);
});
test('reveal deadline is shifted for the duration of a pause',()=>{
 const room={paused:false,deadline:18000};
 pauseRoom(room,'Jamie',15000);resumeRoom(room,35000);
 assert.equal(room.deadline,38000);
});
test('race simulation and penalties retain position and timing through pause',()=>{
 const player={steer:1,boost:true,hitUntil:11000,finishAt:20000};
 const room={paused:false,deadline:null,race:{stage:'racing',lastUpdate:9000,players:[player]}};
 pauseRoom(room,'Alex',10000);
 assert.equal(player.steer,0);assert.equal(player.boost,false);
 resumeRoom(room,40000);
 assert.equal(room.race.lastUpdate,40000);
 assert.equal(player.hitUntil,41000);
 assert.equal(player.finishAt,50000);
});
test('race start countdown stays frozen',()=>{
 const room={paused:false,race:{stage:'countdown',startAt:15000,lastUpdate:10000,players:[]}};
 pauseRoom(room,'Alex',12000);resumeRoom(room,27000);
 assert.equal(room.race.startAt,30000);
});
test('multiple pause or resume requests do not shift clocks twice',()=>{
 const room={paused:false,deadline:30000};
 assert.equal(pauseRoom(room,'A',10000),true);
 assert.equal(pauseRoom(room,'B',18000),false);
 assert.equal(resumeRoom(room,20000),true);
 assert.equal(resumeRoom(room,22000),false);
 assert.equal(room.deadline,40000);
});
