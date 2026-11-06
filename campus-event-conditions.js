/* State reader used by the scheduler; never mutates saves. */
(function(){'use strict';window.CampusEventConditions={canOccur(event,state){return !event.condition||Boolean(event.condition(state))},canChoose(choice,state){return (choice.effect?.money||0)>=0||state.money>=-choice.effect.money}}})();
