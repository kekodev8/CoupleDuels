const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compatibilityBank,createCompatibilityDeck}=require('./game');
test('compatibility question bank provides 30 valid prompts',()=>{
 assert.ok(compatibilityBank.length>=30);
 for(const q of compatibilityBank){assert.equal(typeof q.title,'string');assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);}
});
test('deck has ten unique self questions and five unique reused predictions',()=>{
 for(let n=0;n<50;n++){
  const deck=createCompatibilityDeck();
  assert.equal(deck.questions.length,10);
  assert.equal(new Set(deck.questions.map(q=>q.title)).size,10);
  assert.equal(deck.guessIndices.length,5);
  assert.equal(new Set(deck.guessIndices).size,5);
  assert.ok(deck.guessIndices.every(i=>i>=0&&i<10));
 }
});
