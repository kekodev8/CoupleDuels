// Three increasingly silly stages, all intentionally mild and optional.
const rounds = [
  {type:'vote', title:'Who’s the bigger snack thief?', choices:['Me','My partner'], prompt:'Point the finger. Privately pick the person most likely to steal the last fry.'},
  {type:'match', title:'Choose your ideal date', choices:['Cozy movie night','Spontaneous road trip','Arcade rivalry','Sunset picnic'], prompt:'Pick your favorite without discussing. Match for 2 points each.'},
  {type:'challenge',title:'The compliment speedrun', prompt:'Take turns giving one oddly specific compliment. Both tap DONE when you finish.'},
  {type:'vote', title:'Who texts “I’m on my way” while still getting ready?',choices:['Me','My partner'],prompt:'Vote in secret. Be merciful, or don’t.'},
  {type:'match',title:'Choose a superpower',choices:['Teleportation','Mind reading','Time pause','Talking to animals'],prompt:'Which power would make your duo unstoppable?'},
  {type:'challenge',title:'The terrible commercial',prompt:'Make a ridiculous advertisement for the nearest ordinary object. Go full TV salesman. Take as long as you need.'},
  {type:'vote',title:'Who would survive a zombie movie longer?',choices:['Me','My partner'],prompt:'No teaming up on this one. Pick privately.'},
  {type:'match',title:'Our imaginary vacation',choices:['Haunted castle','Tropical island','Snowy cabin','City adventure'],prompt:'Where are you sending the two of you?'},
  {type:'challenge',title:'Impression battle',prompt:'Each person does a kind, silly impression of the other. Finish when you both feel ready.'},
  {type:'vote',title:'Who would accidentally go viral?',choices:['Me','My partner'],prompt:'Pick who’s most likely to become a meme.'},
  {type:'match',title:'Pick our fictional mascot',choices:['Tiny dragon','Dramatic goose','Wizard frog','Suspicious raccoon'],prompt:'Which one represents your relationship energy?'},
  {type:'challenge',title:'The dramatic confession',prompt:'Confess an absolutely ordinary fact like it’s the big reveal in a soap opera.'},
  {type:'vote',title:'Who would get lost in IKEA?',choices:['Me','My partner'],prompt:'Votes are secret until both submit.'},
  {type:'match',title:'Final boss weekend',choices:['Cook-off','No-plan adventure','Game tournament','DIY masterpiece'],prompt:'Pick the weekend that sounds the most fun.'},
  {type:'challenge',title:'The grand finale',prompt:'Together, invent a ridiculous couple superhero name and victory pose.'}
];
function publicRound(round,index){ return {...round, number:index+1, stage:Math.floor(index/5)+1}; }
module.exports={rounds,publicRound};

// Four-choice personal preference questions. The same 10 questions are asked
// of each player; five are then reused for guessing the partner's answers.
const compatibilityBank = [
 {title:'My perfect Friday night is…',choices:['Movie and snacks','Going somewhere new','Games together','Dinner out']},
 {title:'My dream vacation is…',choices:['Beach resort','Mountain cabin','Big city','Theme park']},
 {title:'My ideal pet would be…',choices:['Dog','Cat','Small animal','No pet']},
 {title:'When I am stressed, I prefer…',choices:['A hug','Some alone time','A distraction','Talking it out']},
 {title:'My favorite kind of date is…',choices:['Home-cooked meal','Outdoor adventure','Fancy restaurant','Arcade or games']},
 {title:'My favorite time of day is…',choices:['Early morning','Afternoon','Evening','Late night']},
 {title:'My go-to comfort food is…',choices:['Pizza','Tacos','Pasta','Something sweet']},
 {title:'I would rather spend unexpected money on…',choices:['A trip','A new gadget','Clothes or decor','Save it']},
 {title:'At a party, I usually…',choices:['Talk to everyone','Stick to my people','Find the snacks','Leave early']},
 {title:'If I could have a superpower, I’d pick…',choices:['Teleportation','Mind reading','Flight','Time travel']},
 {title:'A perfect surprise would be…',choices:['A thoughtful gift','A planned date','A cute note','Favorite food']},
 {title:'The chore I dislike most is…',choices:['Washing dishes','Doing laundry','Cleaning bathrooms','Taking out trash']},
 {title:'My movie-night pick is usually…',choices:['Comedy','Horror','Action','Romance']},
 {title:'When choosing food, I’m…',choices:['Very adventurous','A little adventurous','Loyal to favorites','Super picky']},
 {title:'If we had a free afternoon, I’d choose…',choices:['A long nap','Shopping or browsing','Exploring outdoors','Playing games']},
 {title:'My favorite gift to receive is…',choices:['An experience','Something practical','Something handmade','A fun surprise']},
 {title:'Which season feels the most like me?',choices:['Spring','Summer','Autumn','Winter']},
 {title:'How do I like to celebrate a win?',choices:['Tell everyone','Quietly enjoy it','Treat myself','Celebrate together']},
 {title:'What kind of music fits my mood best?',choices:['Pop','Hip-hop','Rock or alternative','Chill or acoustic']},
 {title:'If I could learn one skill overnight…',choices:['Play an instrument','Speak a language','Cook anything','Dance amazingly']},
 {title:'My ideal morning starts with…',choices:['Coffee or tea','A big breakfast','Sleeping in','A workout or walk']},
 {title:'For a road trip, I care most about…',choices:['The playlist','The snacks','The destination','The company']},
 {title:'My texting style is…',choices:['Instant replies','Lots of memes','Voice notes','I forget to reply']},
 {title:'I would rather live…',choices:['By the ocean','In the mountains','In a big city','In the countryside']},
 {title:'When I’m bored, I tend to…',choices:['Scroll videos','Start a project','Message someone','Go outside']},
 {title:'My favorite type of dessert is…',choices:['Ice cream','Cake','Cookies','Fruit or something light']},
 {title:'If we got matching outfits, I’d pick…',choices:['Comfy pajamas','Funny costumes','Matching colors','Absolutely not']},
 {title:'On a rainy day, I want to…',choices:['Watch shows','Go for a drive','Bake or cook','Stay in bed']},
 {title:'If I won a small prize, I’d…',choices:['Share it','Spend it now','Save it','Buy us a treat']},
 {title:'I’m happiest when a plan is…',choices:['Spontaneous','Scheduled early','A little flexible','Someone else decides']}
];
function shuffledIndices(length){
 const a=Array.from({length},(_,i)=>i);
 for(let i=a.length-1;i>0;i--){const j=require('crypto').randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
function createCompatibilityDeck(){
 const selected=shuffledIndices(compatibilityBank.length).slice(0,10);
 const guesses=shuffledIndices(10).slice(0,5);
 return {questions:selected.map(i=>compatibilityBank[i]),guessIndices:guesses};
}
module.exports.compatibilityBank=compatibilityBank;
module.exports.createCompatibilityDeck=createCompatibilityDeck;
