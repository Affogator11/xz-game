/* Shared eligibility and cost checks. Never mutates saves. */
(function(){
  'use strict';
  function choiceBlock(choice,state){
    const {money=0,ap=0} = choice.effect||{};
    if (money<0&&state.money<-money) return '资金不足';
    if (ap<0&&state.actionPoints<-ap) return '行动点不足';
    return '';
  }
  window.CampusEventConditions = {
    canOccur(event,state){return !event.condition||Boolean(event.condition(state))},
    choiceBlock,
    canChoose(choice,state){return !choiceBlock(choice,state)}
  };
})();
