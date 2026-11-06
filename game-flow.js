/* Durable time intent and notification order. No DOM, rewards or RNG. */
(function(){
  'use strict';
  function ensure(s){s.advanceTargetDay=Math.max(s.day,Math.min(s.day+7,Number(s.advanceTargetDay)||s.day));s.pendingJointReports??=[];s.briefingLedger??={};s.briefingArchive??=[];if(s.weeklyBrief){const week=Math.floor(s.weeklyBrief.day/7);s.weeklyBrief.week=week;s.briefingLedger[week]??={generatedDay:s.weeklyBrief.day,completed:false}}else if(s.lastEventWeek>0)s.briefingLedger[s.lastEventWeek]??={completed:true,restored:true};return s}
  function createBrief(s,items){const week=Math.floor(s.day/7);if(s.weeklyBrief)return s.weeklyBrief;if(s.briefingLedger[week]?.completed)return null;s.weeklyBrief={week,day:s.day,items};s.briefingLedger[week]={generatedDay:s.day,completed:false};s.lastEventWeek=week;return s.weeklyBrief}
  function finishBrief(s){const brief=s.weeklyBrief;if(!brief||brief.items.some(x=>!x.done))return false;const week=brief.week??Math.floor(brief.day/7);s.briefingLedger[week]={...s.briefingLedger[week],completed:true};if(!s.briefingArchive.some(x=>x.week===week))s.briefingArchive.unshift({week,day:brief.day,items:brief.items.map(x=>({id:x.id,done:true}))});s.briefingArchive=s.briefingArchive.slice(0,24);s.weeklyBrief=null;return true}
  function next(s){if(s.gameOver)return'none';if(s.actionFeedback)return'action';if(s.eventFeedback)return'feedback';if(s.pendingJointReports?.length)return'joint';if(s.pendingExamReports?.length)return'standard';if(s.exchangeRequests?.some(r=>r.status==='accepted'&&!r.deferred))return'exchange';if(s.weeklyBrief)return'brief';if(s.pendingCampusEvent)return'event';if(s.day<s.advanceTargetDay)return'advance';return'none'}
  window.GameFlow={ensure,createBrief,finishBrief,next};
})();
