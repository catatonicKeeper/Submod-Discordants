/*:
-------------------------------------------------------------------------------
@title Hime Scope Core
@author Hime --> HimeWorks (http://himeworks.com)
@version 1.0
@date Apr 19, 2016
@filename HIME_ScopeCore.js
@url http://himeworks.com/2016/04/hime-scope-core/

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
@plugindesc v1.0 - Core functionality for managing targeting and scopes
@help 
-------------------------------------------------------------------------------
== Description ==

This plugin changes the way item/skill scopes are handled in RPG Maker.

By default, all scopes are defined by the item or skill, and the action's
scope is based on the item or skill being used.

With this plugin, the action's scope is separated from the skill.
For example, if your skill targets "one enemy" by default, you could
write additional plugins that make it so that the action can be changed to
target "all enemies", or "one ally" as needed.

The purpose of this plugin is to improve compatibility between different
scope-related plugins and to provide a standard way of managing scope.

== Terms of Use ==

- Free for use in non-commercial projects with credits
- Free for use in commercial projects, but it would be nice to let me know
- Please provide credits to HimeWorks

== Change Log ==

1.0 - Apr 19, 2016
 * Initial release

== Usage ==

Plug and play.

-------------------------------------------------------------------------------
*/ 
var Imported = Imported || {} ;
var TH = TH || {};
Imported.TH_HimeScopeCore = 1;
TH.HimeScopeCore = TH.HimeScopeCore || {};

function ScopeManager() {
  
};

(function ($) {

  $.scopeIds = {};
  
  var TH_DataManager_loadDatabase = DataManager.loadDatabase;
  DataManager.loadDatabase = function() {
    ScopeManager.init();
    TH_DataManager_loadDatabase.call(this);    
  };
  
  ScopeManager.init = function() {
    this.registerScopes();
  };
  
  ScopeManager.registerScopes = function() {
    this.addScope("1-enemy", 1);
    this.addScope("all-enemy", 2);
    this.addScope("1-random-enemy", 3);
    this.addScope("2-random-enemy", 4);
    this.addScope("3-random-enemy", 5);
    this.addScope("4-random-enemy", 6);
    this.addScope("1-ally", 7);
    this.addScope("all-ally", 8);
    this.addScope("1-ally-dead", 9);
    this.addScope("all-ally-dead", 10);
    this.addScope("user", 11);
  }
  
  ScopeManager.addScope = function(name, id) {
    $.scopeIds[name] = id;
  };

  ScopeManager.getScopeId = function(name) {
    return $.scopeIds[name];
  }

  var TH_GameAction_clear = Game_Action.prototype.clear;
  Game_Action.prototype.clear = function() {
    TH_GameAction_clear.call(this);
    this._scope = 0;
  };
  
  var TH_GameAction_setSkill = Game_Action.prototype.setSkill;
  Game_Action.prototype.setSkill = function(skillId) {
    TH_GameAction_setSkill.call(this, skillId);
    this.setItemScope();
  };

  var TH_GameAction_setItem = Game_Action.prototype.setItem;
  Game_Action.prototype.setItem = function(itemId) {
    TH_GameAction_setItem.call(this, itemId);
    this.setItemScope();
  };

  var TH_GameAction_setItemObject = Game_Action.prototype.setItemObject;
  Game_Action.prototype.setItemObject = function(object) {
    TH_GameAction_setItemObject.call(this, object);
    this.setItemScope();    
  };
  
  /* Set up default scope based on the selected item/skill */
  Game_Action.prototype.setItemScope = function() {
    var item = this.item();
    if (item) {
      this.setScope(this.getItemScope(item));
    }
  };
  
  Game_Action.prototype.getItemScope = function(item) {
    if (item) {
      return item.scope;
    } else {
      return 0;
    }    
  }
  
  Game_Action.prototype.setScope = function(scope) {
    this._scope = scope;
  };

  Game_Action.prototype.scope = function() {
    return this._scope;
  };

  /* Overwrite. Scopes are stored with the action now */
  Game_Action.prototype.checkItemScope = function(list) {
    return list.contains(this.scope());
  };
})(TH.HimeScopeCore);