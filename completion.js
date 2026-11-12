'use strict';
// A game engine may finish in an acknowledgement handler as well as in the timer tick.
// Keep the shared room phase aligned before sending snapshots or accepting rematches.
function hasCompletedGame(room){
 if(!room)return false;
 if(room.phase==='finished')return true;
 if(room.arcade?.stage==='finished')return true;
 if(room.mini?.stage==='finished')return true;
 if(room.race?.stage==='finished')return true;
 if(room.story?.stage==='finished')return true;
 if(room.battle?.stage==='finished')return true;
 return false;
}
function syncCompletion(room){
 if(hasCompletedGame(room)){
  room.phase='finished';
  room.deadline=null;
  room.paused=false;
  room.pausedAt=null;
  room.pausedBy=null;
 }
 return room?.phase==='finished';
}
module.exports={hasCompletedGame,syncCompletion};
