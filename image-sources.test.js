'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {TITLES,candidatesFromCommons}=require('./image-sources');
test('image service uses a fixed list of known titles',()=>{
 assert(TITLES.has('Adventure Time'));assert(TITLES.has('Sponge (tool)'));
 assert(!TITLES.has('http://127.0.0.1:8080/'));
});
test('commons provider prioritizes filenames matching the puzzle',()=>{
 const rows={query:{pages:[
  {title:'File:Random texture.png',imageinfo:[{mime:'image/png',thumburl:'https://upload.wikimedia.org/random.png'}]},
  {title:'File:Adventure Time cast.jpg',imageinfo:[{mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/adv.jpg'}]}
 ]}};
 assert.equal(candidatesFromCommons(rows,'Adventure Time')[0],'https://upload.wikimedia.org/adv.jpg');
});
test('memory puzzle hides provider and answer labels until reveal',()=>{
 const src=fs.readFileSync(path.join(__dirname,'public/arcade-ui.js'),'utf8');
 const art=src.slice(src.indexOf('function publicWikiArt'),src.indexOf('function arcadeArt'));
 assert.match(art,/showSource=false/);
 assert.match(art,/Mystery picture/);
 assert.doesNotMatch(art,/category\.toLowerCase\(\)/);
 const ready=src.slice(src.indexOf('if(a.stage===\'ready\')contents='),src.indexOf('if(a.stage===\'preview\')contents='));
 assert.match(ready,/disabled/);
 assert.match(src,/wikiThumbnail\(page\)\.then/);
});
