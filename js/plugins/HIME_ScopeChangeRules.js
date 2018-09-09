/*:
-------------------------------------------------------------------------------
@title Scope Change Rules
@author Hime --> HimeWorks (http://himeworks.com)
@version 1.0
@date Apr 19, 2016
@filename HIME_ScopeChangeRules.js
@url http://himeworks.com/2016/04/scope-change-rules/

If you enjoy my work, consider supporting me on Patreon!

* https://www.patreon.com/himeworks

If you have any questions or concerns, you can contact me at any of
the following sites:

* Main Website: http://himeworks.com
* Facebook: https://www.facebook.com/himeworkscom/
* Twitter: https://twitter.com/HimeWorks
* Youtube: https://www.youtube.com/c/HimeWorks
* Tumblr: http://himeworks.tumblr.com/

-------------------------------------------------------------------------------
@plugindesc v1.0 - Change an action's scope based on various conditions
@help 
-------------------------------------------------------------------------------
== Description ==

This plugin allows you to change an action's scope dynamically based on a
set of conditions that are defined for the item or skill.

For example, imagine you have a "Fire" spell that targets one enemy.
However, when a special "Cast All" state is applied to the battler, the
spell's scope is changed to "All Enemy", allowing you to target everyone
while the state is active.

A single skill or item can have multiple scope changing rules defined.
The first rule that is met will be the scope that is used.

== Terms of Use ==

- Free for use in non-commercial projects with credits
- Free for use in commercial projects, but it would be nice to let me know
- Please provide credits to HimeWorks

== Required ==

Hime Scope Core
(http://himeworks.com/2016/04/hime-scope-core/)

== Change Log ==

1.0 - Apr 19, 2016
 * Initial release

== Usage ==

To assign scope changing rules, note-tag items or skills with

  <scope change rule: SCOPE_TYPE>
    FORMULA
  </scope change rule>
  
Where the SCOPE_TYPE is the type of scope that you would like to change it to.
See the instructions for Hime Scope Core for a list of scopes that you can use.

The FORMULA is a javascript formula that evaluates to true or false.

You can use the following formula variables:

  a - the user of the skill
  s - game switches
  v - game variables
  
For example, let's say you wanted a skill to change to target all enemies
if state 14 was applied.

You would write

  <scope change rule: all-enemy>
    a.isStateAffected(14)
  </scope change rule>
  
And whenever state 14 is applied, the scope of the action will change when
you select the action.
  
For more formulas, consult the formula reference
http://himeworks.com/wiki/index.php?title=MV_Formula_Library

-------------------------------------------------------------------------------
*/ 
var Imported = Imported || {} ;
var TH = TH || {};
Imported.TH_ScopeChangeRules = 1;
TH.ScopeChangeRules = TH.ScopeChangeRules || {};

function Data_ScopeChangeRule() { 
  this.initialize.apply(this, arguments);
};

(function ($) {

  $.regex = /<scope[-_ ]change[-_ ]rule:\s*(.+?)\s*>([\s\S]*?)<\/scope[-_ ]change[-_ ]rule>/img
  
  $.evalScopeChangeRuleFormula = function(formula, a) {
    var v = $gameVariables;
    var s = $gameSwitches;
    return eval(formula);
  };
  
  Data_ScopeChangeRule.prototype.initialize = function(scope, formula) {
    this.scope = scope;
    this.formula = formula;
  };
  
  $.ScopeChangeRuleData = function(item) {
    if (item.ScopeChangeRuleData === undefined) {
      item.ScopeChangeRuleData = [];
      var res;
      while (res = $.regex.exec(item.note)) {
        var scope = ScopeManager.getScopeId(res[1]);
        var formula = res[2];
        
        var data = new Data_ScopeChangeRule(scope, formula);
        item.ScopeChangeRuleData.push(data);
      }
    }
    return item.ScopeChangeRuleData;
  };
  
  var TH_GameAction_getItemScope = Game_Action.prototype.getItemScope;
  Game_Action.prototype.getItemScope = function(item) {
    var ScopeChangeRuleData = $.ScopeChangeRuleData(item);
    for (var i = 0; i < ScopeChangeRuleData.length; i++) {
      var data = ScopeChangeRuleData[i]; 
      if ($.evalScopeChangeRuleFormula(data.formula, this.subject())) {
        return data.scope;
      }
    }
    return TH_GameAction_getItemScope.call(this, item);
  };
  
})(TH.ScopeChangeRules);