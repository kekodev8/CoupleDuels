// 90 distinct mild prompts in three increasing stages; each game samples 5 per stage.
const crypto = require('crypto');
const rapidBank = [
  {
    "type": "vote",
    "title": "Who steals the blankets?",
    "prompt": "Who wakes up hogging the covers?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who is the bigger snack detective?",
    "prompt": "Who always finds the secret snacks?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would adopt a stray duck?",
    "prompt": "Who would bring the duck home first?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who takes longer to pick a movie?",
    "prompt": "Who scrolls forever before pressing play?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who sends the most random memes?",
    "prompt": "Who has the least explainable camera roll?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would forget their own sunglasses?",
    "prompt": "Who loses things they're wearing?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who is more likely to sing in the shower?",
    "prompt": "Who gives the bathroom a free concert?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who starts the weirdest conversations?",
    "prompt": "Who would ask about alien taxes at dinner?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who apologizes to furniture after bumping into it?",
    "prompt": "Who says sorry to a table?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who laughs at their own jokes first?",
    "prompt": "Who cracks before the punchline?",
    "stage": 1,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "match",
    "title": "Our perfect lazy morning",
    "prompt": "Choose without discussing.",
    "stage": 1,
    "choices": [
      "Pancakes",
      "Sleep in",
      "Cartoons",
      "Coffee walk"
    ]
  },
  {
    "type": "match",
    "title": "Pick a tiny pet for the duo",
    "prompt": "Pick the animal you both secretly want.",
    "stage": 1,
    "choices": [
      "Hamster",
      "Gecko",
      "Bunny",
      "Tiny turtle"
    ]
  },
  {
    "type": "match",
    "title": "Which ridiculous house feature?",
    "prompt": "Your dream home's must-have.",
    "stage": 1,
    "choices": [
      "Slide between floors",
      "Secret reading nook",
      "Indoor swing",
      "Snack elevator"
    ]
  },
  {
    "type": "match",
    "title": "Best movie-night snack?",
    "prompt": "Will you two agree?",
    "stage": 1,
    "choices": [
      "Popcorn",
      "Nachos",
      "Ice cream",
      "Pizza"
    ]
  },
  {
    "type": "match",
    "title": "Our imaginary duo uniform?",
    "prompt": "Choose a matching look.",
    "stage": 1,
    "choices": [
      "Hoodies",
      "Pajamas",
      "Suits",
      "Costumes"
    ]
  },
  {
    "type": "match",
    "title": "A free surprise outing?",
    "prompt": "Where would you go tonight?",
    "stage": 1,
    "choices": [
      "Aquarium",
      "Arcade",
      "Museum",
      "Mini golf"
    ]
  },
  {
    "type": "match",
    "title": "What should our couple mascot be?",
    "prompt": "Choose the weird little representative.",
    "stage": 1,
    "choices": [
      "Frog",
      "Raccoon",
      "Capybara",
      "Penguin"
    ]
  },
  {
    "type": "match",
    "title": "Pick a magical everyday object",
    "prompt": "Which one wins?",
    "stage": 1,
    "choices": [
      "Self-cleaning dishes",
      "Bottomless fries",
      "Teleporting keys",
      "Perfect weather remote"
    ]
  },
  {
    "type": "match",
    "title": "Pick a weekend breakfast",
    "prompt": "No peeking at the other answer.",
    "stage": 1,
    "choices": [
      "Waffles",
      "Breakfast burrito",
      "Bagels",
      "French toast"
    ]
  },
  {
    "type": "match",
    "title": "Which fictional home?",
    "prompt": "Where could we live?",
    "stage": 1,
    "choices": [
      "Treehouse",
      "Castle",
      "Spaceship",
      "Underwater dome"
    ]
  },
  {
    "type": "challenge",
    "title": "Sell me this sock",
    "prompt": "Create a ridiculous TV commercial for an ordinary sock. Both tap DONE when finished.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Three-word love story",
    "prompt": "Together tell a love story, alternating only three words at a time.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "The invisible pet",
    "prompt": "Each person introduces an imaginary pet and acts out its personality.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Worst restaurant pitch",
    "prompt": "Invent an awful restaurant name and sell its signature dish.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Dramatic weather report",
    "prompt": "Deliver a serious forecast about the weather inside your room.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Silly secret handshake",
    "prompt": "Invent a short couple handshake and demonstrate it together.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "The compliment plot twist",
    "prompt": "Give a genuine compliment, then end with a goofy movie-trailer voice.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Object fashion show",
    "prompt": "Model the nearest harmless object like it's luxury fashion.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Robot meeting",
    "prompt": "Talk to each other like malfunctioning robots until you both laugh.",
    "stage": 1
  },
  {
    "type": "challenge",
    "title": "Tiny trophy ceremony",
    "prompt": "Award your partner an imaginary trophy for something oddly specific.",
    "stage": 1
  },
  {
    "type": "vote",
    "title": "Who would be banned from a cooking show?",
    "prompt": "For harmless chaos, not actual crimes.",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who is more likely to argue with GPS?",
    "prompt": "Who thinks they know a better route?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would lose a dance-off to a toddler?",
    "prompt": "Point your secret finger.",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would survive a haunted house better?",
    "prompt": "Who would stay calm after a creaking door?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would accidentally become an influencer?",
    "prompt": "Who goes viral without trying?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who is the bigger sore loser at board games?",
    "prompt": "Who says the rules are unfair?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would panic over a mystery noise?",
    "prompt": "Who checks every closet first?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would eat the weirdest food combination?",
    "prompt": "Who has the most confusing snack habits?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who could talk their way into a VIP line?",
    "prompt": "Who has stronger accidental charisma?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who is more likely to nickname every object?",
    "prompt": "Who gives the fridge a human name?",
    "stage": 2,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "match",
    "title": "Choose your escape plan",
    "prompt": "A zombie appears at the door. What now?",
    "stage": 2,
    "choices": [
      "Hide upstairs",
      "Run outside",
      "Make a distraction",
      "Befriend it"
    ]
  },
  {
    "type": "match",
    "title": "Your couple reality show title?",
    "prompt": "What is the show called?",
    "stage": 2,
    "choices": [
      "Chaos & Kisses",
      "Two Brain Cells",
      "The Snack Trials",
      "Oops, Again"
    ]
  },
  {
    "type": "match",
    "title": "Pick an absurd competitive sport",
    "prompt": "What should you master together?",
    "stage": 2,
    "choices": [
      "Extreme pillow stacking",
      "Speed folding",
      "Synchronized skipping",
      "Professional hide-and-seek"
    ]
  },
  {
    "type": "match",
    "title": "What would our secret lair feature?",
    "prompt": "Build your hideout.",
    "stage": 2,
    "choices": [
      "Trapdoor",
      "Laser disco",
      "Snack vault",
      "Giant beanbag"
    ]
  },
  {
    "type": "match",
    "title": "Pick an unlikely double date",
    "prompt": "Who are your imaginary guests?",
    "stage": 2,
    "choices": [
      "Two pirates",
      "Two aliens",
      "Two wizards",
      "Two detectives"
    ]
  },
  {
    "type": "match",
    "title": "Choose the soundtrack for our entrance",
    "prompt": "Which genre plays as you walk in?",
    "stage": 2,
    "choices": [
      "Epic orchestra",
      "90s pop",
      "Heavy metal",
      "Game-show music"
    ]
  },
  {
    "type": "match",
    "title": "What would we sell as a business?",
    "prompt": "Your new questionable startup.",
    "stage": 2,
    "choices": [
      "Fancy rocks",
      "Luxury air",
      "Custom jingles",
      "Miniature hats"
    ]
  },
  {
    "type": "match",
    "title": "Choose a duo superpower",
    "prompt": "Which combined ability is best?",
    "stage": 2,
    "choices": [
      "Instant costume changes",
      "Perfect timing",
      "Teleporting snacks",
      "Talking to pigeons"
    ]
  },
  {
    "type": "match",
    "title": "Choose the terrible first date",
    "prompt": "Which disaster is funniest?",
    "stage": 2,
    "choices": [
      "Haunted laundromat",
      "Clown convention",
      "Silent disco",
      "Indoor fishing"
    ]
  },
  {
    "type": "match",
    "title": "Our imaginary getaway vehicle?",
    "prompt": "Pick the most chaotic ride.",
    "stage": 2,
    "choices": [
      "Golf cart",
      "Hot-air balloon",
      "Giant tricycle",
      "Ice cream truck"
    ]
  },
  {
    "type": "challenge",
    "title": "The fake argument",
    "prompt": "Argue dramatically about whether cereal counts as soup, then make peace.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Two-person news desk",
    "prompt": "Report breaking news about something happening in the room.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Celebrity apology video",
    "prompt": "Apologize sincerely for eating the last imaginary cookie.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Impersonation relay",
    "prompt": "Take turns impersonating each other in a nice, ridiculous way.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Movie trailer voiceover",
    "prompt": "Narrate your partner walking across the room like an action movie.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Worst pickup line contest",
    "prompt": "Each invents the worst wholesome pickup line they can.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Silent movie scene",
    "prompt": "Act out a dramatic scene using only gestures and facial expressions.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Fake cooking show",
    "prompt": "Explain how to prepare an ordinary object as though it's a gourmet recipe. Don't actually eat it.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "Ridiculous product launch",
    "prompt": "Pitch a useless app that nobody asked for.",
    "stage": 2
  },
  {
    "type": "challenge",
    "title": "The dramatic phone call",
    "prompt": "Role-play calling customer service about your invisible dragon.",
    "stage": 2
  },
  {
    "type": "vote",
    "title": "Who would get kicked off a game show for laughing?",
    "prompt": "Who can't keep a straight face?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would accidentally start a dance craze?",
    "prompt": "Who has the more contagious moves?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would befriend the movie villain?",
    "prompt": "Who tries talking things out with the bad guy?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would win a debate against a parrot?",
    "prompt": "Who has the stronger argument?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would become mayor of a tiny island?",
    "prompt": "Who convinces the voters?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would get lost in their own house?",
    "prompt": "Who forgets why they entered a room?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who could keep a fake accent going longer?",
    "prompt": "Who stays in character?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would spend lottery winnings on a giant statue?",
    "prompt": "Who makes the worse financial decisions in fiction?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who is more likely to invent a conspiracy about the toaster?",
    "prompt": "Who investigates strange breakfast patterns?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "vote",
    "title": "Who would be the last survivor in a pillow-fight tournament?",
    "prompt": "Who has the secret pillow-fighting technique?",
    "stage": 3,
    "choices": [
      "Me",
      "My partner"
    ]
  },
  {
    "type": "match",
    "title": "Our final-boss weakness?",
    "prompt": "What defeats your superhero duo?",
    "stage": 3,
    "choices": [
      "A cute puppy",
      "Fresh pizza",
      "Bad Wi-Fi",
      "A nap"
    ]
  },
  {
    "type": "match",
    "title": "Choose a time-travel destination",
    "prompt": "Where do you go together?",
    "stage": 3,
    "choices": [
      "Dinosaurs",
      "The 1980s",
      "Ancient Egypt",
      "Year 3000"
    ]
  },
  {
    "type": "match",
    "title": "Pick a secret agent codename",
    "prompt": "Your official duo callsign.",
    "stage": 3,
    "choices": [
      "Team Chaos",
      "Operation Snack",
      "The Night Owls",
      "Agent Oops"
    ]
  },
  {
    "type": "match",
    "title": "The universe offers one wish",
    "prompt": "Which wish do you both take?",
    "stage": 3,
    "choices": [
      "Never do laundry",
      "Free concerts forever",
      "Instant vacations",
      "Unlimited naps"
    ]
  },
  {
    "type": "match",
    "title": "What would our planet be named?",
    "prompt": "Pick your newly discovered world.",
    "stage": 3,
    "choices": [
      "Snacktopia",
      "Planet Oops",
      "Lovezilla",
      "The Big Bean"
    ]
  },
  {
    "type": "match",
    "title": "Choose our end-credit scene",
    "prompt": "How does this movie end?",
    "stage": 3,
    "choices": [
      "Fireworks",
      "Dance battle",
      "Unexpected sequel",
      "Everyone gets tacos"
    ]
  },
  {
    "type": "match",
    "title": "Pick a bizarre dream job",
    "prompt": "Which absurd career wins?",
    "stage": 3,
    "choices": [
      "Professional cloud judge",
      "Penguin stylist",
      "Moon tour guide",
      "Dragon babysitter"
    ]
  },
  {
    "type": "match",
    "title": "The ultimate harmless prank?",
    "prompt": "Which prank is funniest?",
    "stage": 3,
    "choices": [
      "Googly eyes everywhere",
      "Fake awards ceremony",
      "Mini rubber ducks",
      "Mystery thank-you notes"
    ]
  },
  {
    "type": "match",
    "title": "Choose our mythical mount",
    "prompt": "What are we riding into battle?",
    "stage": 3,
    "choices": [
      "Huge corgi",
      "Flying llama",
      "Rainbow turtle",
      "Giant goose"
    ]
  },
  {
    "type": "match",
    "title": "Choose a relationship victory anthem",
    "prompt": "What vibe ends the night?",
    "stage": 3,
    "choices": [
      "Triumphant rock",
      "Cheesy pop",
      "Epic fantasy",
      "Funky disco"
    ]
  },
  {
    "type": "challenge",
    "title": "The final boss monologue",
    "prompt": "Each delivers a villain speech about a tiny everyday inconvenience.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "Couple courtroom",
    "prompt": "One accuses the other of a harmless crime, like stealing all the good fries. Act out the trial.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "The absurd talent show",
    "prompt": "Each performs a completely made-up talent for the other.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "Reverse interview",
    "prompt": "Interview your partner as if they're a famous household appliance.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "Oscar acceptance speech",
    "prompt": "Thank everyone for your victory in an imaginary ridiculous competition.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "Alien first contact",
    "prompt": "Pretend you're aliens discovering a spoon for the first time.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "Invent a fake holiday",
    "prompt": "Name it, explain its traditions, and perform the official greeting.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "Epic slow-motion replay",
    "prompt": "Reenact dropping an imaginary snack with full sports commentary.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "The romantic villain",
    "prompt": "Confess your love using the voice of an overdramatic cartoon villain.",
    "stage": 3
  },
  {
    "type": "challenge",
    "title": "The ultimate duo entrance",
    "prompt": "Make up a couple superhero name, a catchphrase, and a coordinated entrance.",
    "stage": 3
  }
];
const RAPID_ROUNDS=20;
function shuffle(items){const shuffled=[...items];for(let i=shuffled.length-1;i>0;i--){const j=crypto.randomInt(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}return shuffled;}
function createRapidDeck(history=[]){
 const used=new Set(history),chosen=[],all=rapidBank.map((r,i)=>({...r,id:i}));
 const questions=shuffle(all.filter(r=>r.type!=='challenge'&&!used.has(r.id))).concat(shuffle(all.filter(r=>r.type!=='challenge'&&used.has(r.id))));
 const prompts=shuffle(all.filter(r=>r.type==='challenge'&&!used.has(r.id))).concat(shuffle(all.filter(r=>r.type==='challenge'&&used.has(r.id))));
 for(let chapter=0;chapter<4;chapter++){
  const stage=Math.min(3,chapter+1);
  const chunk=questions.splice(0,4);
  chosen.push(...chunk.map(r=>({...r,stage})));
  const prompt=prompts.shift();
  if(prompt)chosen.push({...prompt,stage});
 }
 if(chosen.length!==RAPID_ROUNDS)throw new Error('Not enough Rapid-Fire cards');
 return {rounds:chosen,ids:chosen.map(r=>r.id)};
}
function publicRound(round,index){const {id,...rest}=round;return {...rest,number:index+1};}
module.exports={rounds:rapidBank,rapidBank,RAPID_ROUNDS,createRapidDeck,publicRound};

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
 {title:'I’m happiest when a plan is…',choices:['Spontaneous','Scheduled early','A little flexible','Someone else decides']},
 {title:'Which silly nickname would I prefer?',choices:['Something adorable','Something funny','Something cool','Just my name']},
 {title:'If we opened a business together, I would pick…',choices:['Coffee shop','Food truck','Game studio','Pet café']},
 {title:'At an amusement park, my first stop would be…',choices:['Big roller coaster','Food stand','Gentle rides','Arcade']},
 {title:'My dream weekend plan is…',choices:['Road trip','Stay home and relax','Concert or festival','Outdoor adventure']},
 {title:'Which is my biggest pet peeve?',choices:['Loud chewing','Being late','Messy rooms','Spoilers']},
 {title:'What would I do with an extra hour?',choices:['Sleep','Play games','Talk to friends','Make something']},
 {title:'My ideal breakfast is…',choices:['Pancakes','Eggs and toast','Fruit and yogurt','Skip breakfast']},
 {title:'The cutest couple activity is…',choices:['Cooking together','Matching costumes','Long walks','Building something']},
 {title:'My reaction to a surprise party would be…',choices:['So excited','Very embarrassed','Happy but nervous','Please never do that']},
 {title:'My ideal fictional world would be…',choices:['Wizard school','Space adventure','Fantasy kingdom','Cozy cartoon town']},
 {title:'When I feel competitive, I…',choices:['Get laser focused','Trash talk playfully','Laugh at my mistakes','Pretend I do not care']},
 {title:'What souvenir would I keep?',choices:['Postcard','Keychain','Local snacks','A photo']},
 {title:'Which room would I renovate first?',choices:['Bedroom','Kitchen','Living room','Gaming corner']},
 {title:'What do I bring to a picnic?',choices:['Sandwiches','Dessert','Music speaker','Games']},
 {title:'My favorite kind of weather is…',choices:['Sunny and warm','Cold and crisp','Rainy and cozy','Snowy']},
 {title:'If I joined a talent show, I would…',choices:['Sing','Dance','Do comedy','Make something artistic']},
 {title:'I would rather get around by…',choices:['Car','Train','Bike','Walking']},
 {title:'When watching a scary movie, I…',choices:['Scream','Laugh','Hide my eyes','Stay calm']},
 {title:'My go-to snack flavor is…',choices:['Sweet','Salty','Spicy','Sour']},
 {title:'If we adopted a fictional creature, I would choose…',choices:['Baby dragon','Unicorn','Talking cat','Tiny alien']}
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
