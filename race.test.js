'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('./race');const players=[{id:'a',name:'Alice'},{id:'b',name:'Bob'}];
test('has 5 drivers and five unique tracks',()=>{assert.equal(R.CHARACTERS.length,5);assert.equal(R.TRACKS.length,5);assert.equal(new Set(R.TRACKS.map(t=>t.id)).size,5)});
test('select and ready requires both players',()=>{const r=R.createRace(players);assert.equal(R.choose(r,'a','nova'),null);assert.equal(R.trackChoice(r,'b','a','space'),'Host chooses the track.');assert.equal(R.trackChoice(r,'a','a','space'),null);R.ready(r,'a');assert.equal(r.stage,'select');R.ready(r,'b');assert.equal(r.stage,'countdown');assert.equal(r.trackId,'space')});
test('race starts and finishes with winner',()=>{const r=R.createRace(players);R.ready(r,'a');R.ready(r,'b');let now=r.startAt;R.advance(r,now);assert.equal(r.stage,'racing');R.input(r,'a',0,true);for(let i=0;i<1100&&r.stage!=='finished';i++){now+=100;R.advance(r,now);}assert.equal(r.stage,'finished');assert.ok(players.some(p=>p.id===r.winner));});
test('inputs stay within track bounds',()=>{const r=R.createRace(players);R.ready(r,'a');R.ready(r,'b');R.advance(r,r.startAt);R.input(r,'a',99,false);for(let i=1;i<=150;i++)R.advance(r,r.startAt+i*100);assert.ok(r.players[0].x<=1.02);assert.ok(r.players[0].distance>0);});
