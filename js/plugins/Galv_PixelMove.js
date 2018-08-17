//-----------------------------------------------------------------------------
//  Galv's Pseudo Pixel Move
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  Galv_PixelMove.js
//-----------------------------------------------------------------------------
//  2017-11-15 - Version 1.2 - added script to use to make move routes move a
//                             full tile distance instead of 1/3 tile.
//                             Fixed Galv.PMOVE.pos(x,y) script error
//                             Temp vehicle fix.
//                             Fixed transfer jump bug.
//  2017-07-06 - Version 1.1 - beta, disabled mouse movement
//  2017-06-30 - Version 1.0 - beta
//-----------------------------------------------------------------------------
// Terms can be found at:
// galvs-scripts.com
//-----------------------------------------------------------------------------

var Imported = Imported || {};
Imported.Galv_PixelMove = true;

var Galv = Galv || {};                  // Galv's main object
Galv.PMOVE = Galv.PMOVE || {};          // Galv's stuff


//-----------------------------------------------------------------------------
/*:
 * @plugindesc (v.1.0) Gives the illusion of pixel movement for the player.
 * 
 * @author Galv - galvs-scripts.com
 *
 * @param Diagonal Speed
 * @desc % of move speed characters move while travelling diagonally
 * @default 90
 *
 * @param Diagonal Charset
 * @desc true or false if you want to use diagonal charactersets (see help for more)
 * @default true
 *
 * @param Tile Delay
 * @desc No. frames delay before a below character touch event or damage tile can be repeated
 * @default 30
 *
 * @help
 *   Galv's Pseudo Pixel Move
 * ----------------------------------------------------------------------------
 * This plugin gives the illusion of pixel movement for the player but tries
 * to retain all normal tile-based functionality of the game otherwise.
 *
 * Instead of moving from tile to tile, the player moves on 9 segments within
 * each tile. Each segment has it's own x,y values that can be referenced
 * using the below diagram:
 *
 *
 *     2,1    0,1    1,1
 *
 *     2,0    0,0    1,0
 *
 *     2,2    0,2    1,2
 *  
 * Characters cannot move onto the edge of a tile that is adjacent to a tile
 * that is currently impassable (via map or impassable event etc). This is to
 * stop characters from being able to be up too close to each other and retain
 * the tile based functionality.
 *
 * Not all other plugins have been tested for compatibility with this one. If
 * I get time I will create compatibilities with popular ones that are not
 * compatibile.
 *
 * NOTES: 
 * - Not compatibile with Galv's Diagonal Movement plugin as this one already
 *   includes the diagonal movement plugin with it.
 * - Default mouse movement has been disabled as it does not work with this.
 *
 * KNOWN ISSUES:
 * - events are 1px offset when standing on a certain tile.
 * - Looping maps currently do not work.
 * - Followers do not work.
 * - Vehicles work but travelling in vehicles uses normal tile movement only.
 *
 * ----------------------------------------------------------------------------
 *  SCRIPT CALLS
 * ----------------------------------------------------------------------------
 *
 *      Galv.PMOVE.center();     // player steps to center of tile
 *      Galv.PMOVE.center(true); // turns to face before stepping to center
 *
 *      $gamePlayer._normMove = true;  // sets forced move routes on player to
 *                                     // move an entire tile.
 *                                     // NOTE: Center player first so they
 *                                     // are moving from center to center tile
 *      $gamePlayer._normMove = false; // forced move routes use pseudo pixel
 *                                     // move distance again
 *
 * ----------------------------------------------------------------------------
 *  Check player position on a tile SCRIPT
 * ----------------------------------------------------------------------------
 * To reference each tile's x,y positions (for example in a conditional branch)
 * you can use the following in the SCRIPT field:
 *
 *      Galv.PMOVE.xPos(x,x,x)   // check for list of x values
 *      Galv.PMOVE.yPos(y,y,y)   // check for list of y values
 *      Galv.PMOVE.pos(x,y)      // check for exact x,y value
 *
 * EXAMPLES:
 * Galv.PMOVE.xPos(0)   // will return true if player is on one of the
 *                      // three middle positions
 * Galv.PMOVE.yPos(1)   // will return true if player is on one of the
 *                      // three top positions
 * Galv.PMOVE.xPos(0) && Galv.PMOVE.yPos(1)   // true if both of the above
 * Galv.PMOVE.xPos(0) || Galv.PMOVE.yPos(1)   // true if either of the above
 * Galv.PMOVE.pos(0,0)  // will return true if player is in middle of tile
 * ----------------------------------------------------------------------------
 *
 * ----------------------------------------------------------------------------
 *  EVENT NOTE FIELD
 * ----------------------------------------------------------------------------
 * By default touch events can only be activated after another touch event once
 * a short delay in frames (time) has passed. This delay can be set in the
 * plugin settings.
 * For events that you wish not to set a delay after it's activated, add the
 * following tag to the event's NOTE field
 *
 *   <noDelay>
 *
 * ----------------------------------------------------------------------------
 * Diagonal Charsets
 * -----------------
 * When 'Diagonal Charsets' is true, the plugin will change the sprite if the
 * character is on a diagonal. The diagonal sprite used will be in the position
 * directly below the selected character graphic. This means that only sprites
 * on the top of a character sheet will be able to have diagonal graphics and
 * if an actor or event is set to a sprite on the bottom of a charactersheet
 * then it will not use diagonals.
 *
 * See the demo with an example characterset.
 * ----------------------------------------------------------------------------
 */



//-----------------------------------------------------------------------------
//  CODE STUFFS
//-----------------------------------------------------------------------------

(function() {

Galv.PMOVE.diagMod = Number(PluginManager.parameters('Galv_PixelMove')["Diagonal Speed"]) * 0.01;
Galv.PMOVE.diagGraphic = PluginManager.parameters('Galv_PixelMove')["Diagonal Charset"].toLowerCase() == 'true';

Galv.PMOVE.tileDelay = Number(PluginManager.parameters('Galv_PixelMove')["Tile Delay"]);


Galv.PMOVE.xPos = function() {
	var array = Array.prototype.slice.call(arguments);
	return array.contains($gamePlayer._tileQuadrant.x);
};

Galv.PMOVE.yPos = function() {
	var array = Array.prototype.slice.call(arguments);
	return array.contains($gamePlayer._tileQuadrant.y);
};

Galv.PMOVE.pos = function(x,y) {
	return $gamePlayer._tileQuadrant.y == 0 && $gamePlayer._tileQuadrant.x == 0;
};

Galv.PMOVE.center = function(face) {
	$gamePlayer.centerTilePos(face);
};

Galv.PMOVE.getHorzVertDirs = function(direction) {
	switch (direction) {
		case 1: return [4,2];
		case 3: return [6,2];
		case 7: return [4,8];
		case 9: return [6,8];
		default: return [0,0];
	};
};

Galv.PMOVE.getDir = function(horz,vert) {
	if (horz == 4 && vert == 2) return 1;
	if (horz == 6 && vert == 2) return 3;
	if (horz == 4 && vert == 8) return 7;
	if (horz == 6 && vert == 8) return 9;
	return 0;
};

Galv.PMOVE.diagRow = {
	3: 0,
	1: 1,
	9: 2,
	7: 3
};

// DISABLE MOUSE MOVE
Game_Player.prototype.triggerAction = function() {
    if (this.canMove()) {
        if (this.triggerButtonAction()) {
            return true;
        }
    }
    return false;
};

Game_Player.prototype.triggerTouchAction = function() {};
Scene_Map.prototype.processMapTouch = function() {};
// END DISABLE MOUSE MOVE


//-----------------------------------------------------------------------------
//  GAME MAP
//-----------------------------------------------------------------------------

Game_Map.prototype.quadMod = {
	0: 0,
	1: 0.33,
	2: 0.67
};

Game_Map.prototype.xWithDirectionQuad = function(x, d, q) {
	var x = x + (d === 6 ? 0.33 : d === 4 ? -0.33 : 0);
	return Math.round(x * 100) / 100;
};

Game_Map.prototype.yWithDirectionQuad = function(y, d) {
    return y + (d === 2 ? 0.33 : d === 8 ? -0.33 : 0);
};

Game_Map.prototype.roundXWithDirectionQuad = function(x, d, q) {
	var mod = this.quadMod[q];	
	if (d === 6) {
		x = q === 0 ? Math.floor(x) + 1 + mod : Math.floor(x) + mod;
	} else if (d === 4) {
		x = q === 2 ? Math.floor(x) - 1 + mod : Math.floor(x) + mod;
	}
	return this.roundX(x);
};

Game_Map.prototype.roundYWithDirectionQuad = function(y, d, q) {
	var mod = this.quadMod[q];	
	if (d === 2) {
		y = q === 0 ? Math.floor(y) + 1 + mod : Math.floor(y) + mod;
	} else if (d === 8) {
		y = q === 2 ? Math.floor(y) - 1 + mod : Math.floor(y) + mod;
	}
	return this.roundY(y);
};

Galv.PMOVE.Game_Map_eventsXy = Game_Map.prototype.eventsXy;
Game_Map.prototype.eventsXy = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_eventsXy.call(this,x,y);
};

Galv.PMOVE.Game_Map_eventsXyNt = Game_Map.prototype.eventsXyNt;
Game_Map.prototype.eventsXyNt = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_eventsXyNt.call(this,x,y);
};

Galv.PMOVE.Game_Map_tileEventsXy = Game_Map.prototype.tileEventsXy;
Game_Map.prototype.tileEventsXy = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_tileEventsXy.call(this,x,y);
};

Galv.PMOVE.Game_Map_eventIdXy = Game_Map.prototype.eventIdXy;
Game_Map.prototype.eventIdXy = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_eventIdXy.call(this,x,y);
};

Galv.PMOVE.Game_Map_regionId = Game_Map.prototype.regionId;
Game_Map.prototype.regionId = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_regionId.call(this,x,y);
};

Galv.PMOVE.Game_Map_terrainTag = Game_Map.prototype.terrainTag;
Game_Map.prototype.terrainTag = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_terrainTag.call(this,x,y);
};

Galv.PMOVE.Game_Map_autotileType = Game_Map.prototype.autotileType;
Game_Map.prototype.autotileType = function(x, y, z) {
	x = Math.round(x);
	y = Math.round(y);
	Galv.PMOVE.Game_Map_autotileType.call(this,x,y,z);
};

Galv.PMOVE.Game_Map_checkLayeredTilesFlags = Game_Map.prototype.checkLayeredTilesFlags;
Game_Map.prototype.checkLayeredTilesFlags = function(x, y, bit) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_checkLayeredTilesFlags.call(this,x,y,bit);
};

Galv.PMOVE.Game_Map_isLadder = Game_Map.prototype.isLadder;
Game_Map.prototype.isLadder = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_isLadder.call(this,x,y);
};

Galv.PMOVE.Game_Map_isBush = Game_Map.prototype.isBush;
Game_Map.prototype.isBush = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_isBush.call(this,x,y);
};

Galv.PMOVE.Game_Map_isCounter = Game_Map.prototype.isCounter;
Game_Map.prototype.isCounter = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_isCounter.call(this,x,y);
};

Galv.PMOVE.Game_Map_isDamageFloor = Game_Map.prototype.isDamageFloor;
Game_Map.prototype.isDamageFloor = function(x, y) {
	x = Math.round(x);
	y = Math.round(y);
	return Galv.PMOVE.Game_Map_isDamageFloor.call(this,x,y);
};



//-----------------------------------------------------------------------------
//  GAME CHARACTERBASE
//-----------------------------------------------------------------------------

Galv.PMOVE.Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function() {
	Galv.PMOVE.Game_CharacterBase_initMembers.call(this);
	this.setQuadrant();
};

Game_CharacterBase.prototype.setQuadrant = function() {
	this._tileQuadrant = {x:0,y:0};
};

Game_CharacterBase.prototype._cframes = 3;

Galv.PMOVE.Game_CharacterBase_realMoveSpeed = Game_CharacterBase.prototype.realMoveSpeed;
Game_CharacterBase.prototype.realMoveSpeed = function() {
	var spd = Galv.PMOVE.Game_CharacterBase_realMoveSpeed.call(this);
	return this._diagDir ? spd * Galv.PMOVE.diagMod : spd;
};

Galv.PMOVE.Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
Game_CharacterBase.prototype.canPass = function(x, y, d) {
	var x = Math.round(x);
	var y = Math.round(y);
	return Galv.PMOVE.Game_CharacterBase_canPass.call(this,x,y,d);
};

Galv.PMOVE.Game_CharacterBase_setDirection = Game_CharacterBase.prototype.setDirection;
Game_CharacterBase.prototype.setDirection = function(d) {
	if (this._diagStraigten) this._diagDir = false;
	Galv.PMOVE.Game_CharacterBase_setDirection.call(this,d);
};

Game_CharacterBase.prototype.getOtherdir = function(horz, vert) {
    return this.canPass(this._x, this._y, horz) ? horz : vert;
};



// Overwrite
Game_CharacterBase.prototype.moveDiagonally = function(horz, vert) {
	var diag = this.canPassDiagonally(this._x, this._y, horz, vert);
    var norm = this.canPass(this._x, this._y, horz) || this.canPass(this._x, this._y, vert);
	
	if (diag) {
		this._diagDir = Galv.PMOVE.getDir(horz,vert);
        this._x = $gameMap.roundXWithDirection(this._x, horz);
        this._y = $gameMap.roundYWithDirection(this._y, vert);
        this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(horz));
        this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(vert));
        this.increaseSteps();
	} else if (norm) {
		this._diagDir = false;
		this.moveStraight(this.getOtherdir(horz,vert));
    };
	
	this._diagStraigten = false;
    if (this._direction === this.reverseDir(horz)) this.setDirection(horz);
    if (this._direction === this.reverseDir(vert)) this.setDirection(vert);
	this._diagStraigten = true;
};


//-----------------------------------------------------------------------------
//  GAME CHARACTER
//-----------------------------------------------------------------------------

// OVERWRITE
Game_Character.prototype.turnTowardCharacter = function(character) {
    var sx = this.deltaXFrom(Math.round(character.x));
    var sy = this.deltaYFrom(Math.round(character.y));
	
	var absSx = Math.abs(sx);
	var absSy = Math.abs(sy);

	if (absSx == absSy) {
		if (sx < 0) {
			this._diagDir = sy > 0 ? 9 : 3;
		} else if (sx > 0) {
			this._diagDir = sy > 0 ? 7 : 1;
		}
	} else {
		this._diagDir = 0;
	};
	if (absSx > absSy) {
       	this.setDirection(sx > 0 ? 4 : 6);
    } else if (sy !== 0) {
        this.setDirection(sy > 0 ? 8 : 2);
    }
};

// OVERWRITE
Game_Character.prototype.moveTowardCharacter = function(character) {
	//if (diag) {
		this.turnTowardCharacter(character);
		
		if (this._diagDir) {
			var d = Galv.PMOVE.getHorzVertDirs(this._diagDir);
			this.moveDiagonally(d[0],d[1]);
			return
		}
	//}
	
    var sx = this.deltaXFrom(Math.round(character.x));
    var sy = this.deltaYFrom(Math.round(character.y));
    if (Math.abs(sx) > Math.abs(sy)) {
        this.moveStraight(sx > 0 ? 4 : 6);
        if (!this.isMovementSucceeded() && sy !== 0) {
            this.moveStraight(sy > 0 ? 8 : 2);
        }
    } else if (sy !== 0) {
        this.moveStraight(sy > 0 ? 8 : 2);
        if (!this.isMovementSucceeded() && sx !== 0) {
            this.moveStraight(sx > 0 ? 4 : 6);
        }
    }
};

//-----------------------------------------------------------------------------
//  GAME EVENT
//-----------------------------------------------------------------------------

/*
Galv.PMOVE.Game_Event_isCollidedWithPlayerCharacters = Game_Event.prototype.isCollidedWithPlayerCharacters;
Game_Event.prototype.isCollidedWithPlayerCharacters = function(x, y) {
	var x = Math.round(x);
	var y = Math.round(y);
    return Galv.PMOVE.Game_Event_isCollidedWithPlayerCharacters.call(this,x,y);
};
*/

//-----------------------------------------------------------------------------
//  GAME ACTOR
//-----------------------------------------------------------------------------
/*
Galv.PMOVE.Game_Actor_onPlayerWalk = Game_Actor.prototype.onPlayerWalk;
Game_Actor.prototype.onPlayerWalk = function() {
	if ($gamePlayer.tileDelayed()) return;
	//if (this._tileDelay === 0) this._tileDelay = Galv.PMOVE.tileDelay;
	Galv.PMOVE.Game_Actor_onPlayerWalk.call(this);
};
*/

Galv.PMOVE.Game_Actor_executeFloorDamage = Game_Actor.prototype.executeFloorDamage;
Game_Actor.prototype.executeFloorDamage = function() {
	if ($gamePlayer.tileDelayed()) return;
	Galv.PMOVE.Game_Actor_executeFloorDamage.call(this);
	if (!$gamePlayer.tileDelayed()) $gamePlayer.setTileDelay();
};

//-----------------------------------------------------------------------------
//  GAME PARTY
//-----------------------------------------------------------------------------
/*
Galv.PMOVE.Game_Party_onPlayerWalk = Game_Party.prototype.onPlayerWalk;
Game_Party.prototype.onPlayerWalk = function() {
	Galv.PMOVE.Game_Party_onPlayerWalk.call(this);
	//$gamePlayer.setTileDelay();
};
*/


//-----------------------------------------------------------------------------
//  GAME PLAYER
//-----------------------------------------------------------------------------

Galv.PMOVE.Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function() {
	Galv.PMOVE.Game_Player_initMembers.call(this);
	this._tileDelay = 0;
};

Galv.PMOVE.Game_Player_update = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
	Galv.PMOVE.Game_Player_update.call(this,sceneActive);
	if (this._tileDelay > 0) this._tileDelay -= 1;
};

Game_Player.prototype.setTileDelay = function() {
	this._tileDelay = this.isDashing() ? Galv.PMOVE.tileDelay * 0.5 : Galv.PMOVE.tileDelay;
};

Game_Player.prototype.tileDelayed = function() {
	return this._tileDelay > 0;
};

// OVERWRITE
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
	var x = Math.round(x);
	var y = Math.round(y);
    if (!$gameMap.isEventRunning()) {
        $gameMap.eventsXy(x, y).forEach(function(event) {
            if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
				if (!event.event().meta.noDelay && !$gamePlayer.tileDelayed()) $gamePlayer.setTileDelay();
                event.start();
            }
        });
    }
};

Galv.PMOVE.Game_Player_checkEventTriggerHere = Game_Player.prototype.checkEventTriggerHere;
Game_Player.prototype.checkEventTriggerHere = function(triggers) {
	if (this.tileDelayed()) return;
	Galv.PMOVE.Game_Player_checkEventTriggerHere.call(this,triggers);
};

Game_Player.prototype.quadDirX = function(d) {
	var quad = this._tileQuadrant.x;
	if (d === 6) {
		quad = this._tileQuadrant.x + 1;
		if (quad > 2) quad = 0;
	} else if (d === 4) {
		quad = this._tileQuadrant.x - 1;
		if (quad < 0) quad = 2;
	}
	return quad;
};

Game_Player.prototype.quadDirY = function(d) {
	var quad = this._tileQuadrant.y;
	if (d === 2) {
		quad = this._tileQuadrant.y + 1;
		if (quad > 2) quad = 0;
	} else if (d === 8) {
		quad = this._tileQuadrant.y - 1;
		if (quad < 0) quad = 2;
	}
	return quad;
};

Game_Player.prototype.pos = function(x, y) {
    return Math.round(this._x) === x && Math.round(this._y) === y;
};

Game_Player.prototype.canPassTile = function(x, y) {
    if (!$gameMap.isValid(x, y)) {
        return false;
    }
    if (this.isThrough() || this.isDebugThrough()) {
        return true;
    }
    if (!$gameMap.isPassable(x, y, this._direction)) {
        return false;
    }
    if (this.isCollidedWithCharacters(x, y)) {
        return false;
    }
    return true;
};

Game_Player.prototype.canPass = function(x, y, d, qx, qy) {
	var x = Math.round(x);
	var y = Math.round(y);
	var canPassTile = Game_CharacterBase.prototype.canPass.call(this,x,y,d);

	if (this._normMove) return canPassTile;
	// check passability on tile quadrant, do diag slide if needed
	switch (d) {
		case 6:
			if (qx === 1) {
				if (!canPassTile) return false;
				if (qy === 1) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x,y + 1,d);
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(9);
					return pass;
				}
				if (qy === 2) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x,y - 1,d);
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(3);
					return pass;
				}
			} else if (qx === 2 && this._tileQuadrant.x === 1) {
				return this.canPassTile(x,y);  // if caught up against something
			}
			return true;
			break;
		case 4:
			if (qx === 2) {
				if (!canPassTile) return false;
				if (qy === 1) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x,y + 1,d);
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(7);
					return pass;
				}
				if (qy === 2) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x,y - 1,d);
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(1);
					return pass;
				}
			} else if (qx === 1 && this._tileQuadrant.x === 2) {
				return this.canPassTile(x,y);  // if caught up against something
			}
			return true;
			break;
		case 8:
			if (qy === 2) {
				if (!canPassTile) return false;
				if (qx === 1) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x + 1,y,d);
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(7);
					return pass;
				}
				if (qx === 2) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x - 1,y,d);
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(9);
					return pass;
				}
			} else if (qy === 1 && this._tileQuadrant.y === 2) {
				return this.canPassTile(x,y);  // if caught up against something
			}
			return true;
			break;
		case 2:
			if (qy === 1) {
				if (!canPassTile) return false;
				if (qx === 1) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x + 1,y,d);  // do diagonal down left around event here?
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(1);
					return pass;
				}
				if (qx === 2) {
					var pass = Game_CharacterBase.prototype.canPass.call(this,x - 1,y,d);  // do diagonal down right around event here?
					if (!pass) this._diagSlide = Galv.PMOVE.getHorzVertDirs(3);
					return pass;
				}
			} else if (qy === 2 && this._tileQuadrant.y === 1) {
				return this.canPassTile(x,y);  // if caught up against something
			}
			return true;
			break;
	}

	return canPassTile;
};

// OVERWRITE
Game_Player.prototype.canPassDiagonally = function(x, y, horz, vert, qx, qy) {
	if (!this.canPass(x, y, vert, qx, qy) || !this.canPass(x, y, horz, qx, qy)) return false;
	return true;
};


Game_Player.prototype.centerTilePos = function(face) {
	if (face) this.turnTowardCharacter(this);
	this._tileQuadrant.x = 0;
	this._tileQuadrant.y = 0;
	this._x = Math.round(this._x);
	this._y = Math.round(this._y);
};

// OVERWRITE
Game_Player.prototype.moveStraight = function(d) {
	this._diagDir = false;
	this._diagSlide = null;
	
	if (this._normMove) return Game_CharacterBase.prototype.moveStraight.call(this,d);
	
	
	var qDirX = this.quadDirX(d);
	var qDirY = this.quadDirY(d);
	
	//if (this.isMoveRouteForcing()) {
		//return Game_Character.prototype.moveStraight.call(this, d);
	//};

	var targetQuadX = $gameMap.roundXWithDirectionQuad(this._x, d, qDirX);
	var targetQuadY = $gameMap.roundYWithDirectionQuad(this._y, d, qDirY);

    this.setMovementSuccess(this.canPass(targetQuadX, targetQuadY, d, qDirX, qDirY));

    if (this.isMovementSucceeded()) {
        this.setDirection(d);
		this._tileQuadrant.x = qDirX;
		this._tileQuadrant.y = qDirY;
        this._x = targetQuadX;
        this._y = targetQuadY;
        this._realX = $gameMap.xWithDirectionQuad(this._x, this.reverseDir(d), qDirX);
        this._realY = $gameMap.yWithDirectionQuad(this._y, this.reverseDir(d), qDirY);
        this.increaseSteps();
		if (Imported.Galv_ShadowDarken) this.checkShadow();
    } else if (this._diagSlide) {
		this.moveDiagonally(this._diagSlide[0],this._diagSlide[1]);
	} else {
        this.setDirection(d);
        this.checkEventTriggerTouchFront(d);
    }
};

// Overwrite
Game_Player.prototype.moveDiagonallyNorm = function(horz, vert) {
	Game_CharacterBase.prototype.moveDiagonally.call(this,horz,vert);
};

// OVERWRITE
Game_Player.prototype.moveDiagonally = function(horz, vert) {
	this._diagSlide = null;
	
	if (this._normMove) {
		this.moveDiagonallyNorm(horz,vert);
		return;
	}

	var qDirX = this.quadDirX(horz);
	var qDirY = this.quadDirY(vert);
	var targetQuadX = $gameMap.roundXWithDirectionQuad(this._x, horz, qDirX);
	var targetQuadY = $gameMap.roundYWithDirectionQuad(this._y, vert, qDirY);
	var diag = this.canPassDiagonally(targetQuadX, targetQuadY, horz, vert, qDirX, qDirY);


	if (diag) {
		this._diagDir = Galv.PMOVE.getDir(horz,vert);
		this._tileQuadrant.x = qDirX;
		this._tileQuadrant.y = qDirY;
		this._x = targetQuadX;
		this._y = targetQuadY;
        this._realX = $gameMap.xWithDirectionQuad(this._x, this.reverseDir(horz), qDirX);
        this._realY = $gameMap.yWithDirectionQuad(this._y, this.reverseDir(vert), qDirY);
        this.increaseSteps();
		if (Imported.Galv_ShadowDarken) this.checkShadow();
	} else {
		// DIAGONAL IS BLOCKED, CHECK HORZ AND VERT FOR POSSIBLE MOVE

		var qDirYh = this.quadDirY(horz);
		var targetQuadYh = $gameMap.roundYWithDirectionQuad(this._y, horz, qDirYh);	
		var normX = this.canPass(targetQuadX, targetQuadYh, horz, qDirX, qDirYh);
		
		var qDirXv = this.quadDirX(vert);
		var targetQuadXv = $gameMap.roundXWithDirectionQuad(this._x, vert, qDirXv);
		var normY = this.canPass(targetQuadXv, targetQuadY, vert, qDirXv, qDirY);
		
		if (normY) {
			this._diagDir = false;
			this.moveStraight(vert);
		} else if (normX) {
			this._diagDir = false;
			this.moveStraight(horz);
		}
    };
	
	this._diagStraigten = false;
    if (this._direction === this.reverseDir(horz)) this.setDirection(horz);
    if (this._direction === this.reverseDir(vert)) this.setDirection(vert);
	this._diagStraigten = true;
};

Galv.PMOVE.Game_Player_jump = Game_Player.prototype.jump;
Game_Player.prototype.jump = function(xPlus, yPlus) {
	Galv.PMOVE.Game_Player_jump.call(this,xPlus,yPlus);
	this._x = Math.round(this._x);
	this._y = Math.round(this._y);
	this._tileQuadrant.x = 0;
	this._tileQuadrant.y = 0;
};

Game_Player.prototype.moveTowardCharacter = function(character) {
	this._normMove = true;
	Game_Character.prototype.moveTowardCharacter.call(this,character);
	this._normMove = false;
};


//-----------------------------------------------------------------------------
//  GAME FOLLOWER
//-----------------------------------------------------------------------------

Game_Follower.prototype.realMoveSpeed = function() {
	return $gamePlayer.realMoveSpeed();
};


//-----------------------------------------------------------------------------
//  GAME PLAYER
//-----------------------------------------------------------------------------

// OVERWRITE
Game_Player.prototype.getInputDirection = function() {
    return Input.dir8;
};

Galv.PMOVE.Game_Player_executeMove = Game_Player.prototype.executeMove;
Game_Player.prototype.executeMove = function(direction) {
	if (direction % 2 == 0) {
    	Galv.PMOVE.Game_Player_executeMove.call(this,direction);
	} else if (Math.abs(direction % 2) == 1) {
		var dirArray = Galv.PMOVE.getHorzVertDirs(direction);
		this.moveDiagonally(dirArray[0],dirArray[1]);
	};
};


// OVERWRITE
Game_Player.prototype.getOnVehicle = function() {
    var direction = this.direction();
    var x1 = Math.round(this.x);
    var y1 = Math.round(this.y);
    var x2 = $gameMap.roundXWithDirection(x1, direction);
    var y2 = $gameMap.roundYWithDirection(y1, direction);
    if ($gameMap.airship().pos(x1, y1)) {
        this._vehicleType = 'airship';
    } else if ($gameMap.ship().pos(x2, y2)) {
        this._vehicleType = 'ship';
    } else if ($gameMap.boat().pos(x2, y2)) {
        this._vehicleType = 'boat';
    }
    if (this.isInVehicle()) {
        this._vehicleGettingOn = true;
        if (!this.isInAirship()) {
            this.forceMoveForward();
        } else {
			Galv.PMOVE.center();
		}
		this._normMove = true;
        this.gatherFollowers();
    }
    return this._vehicleGettingOn;
};


Galv.PMOVE.Game_Player_getOffVehicle = Game_Player.prototype.getOffVehicle;
Game_Player.prototype.getOffVehicle = function() {
	this._normMove = false;
	Galv.PMOVE.Game_Player_getOffVehicle.call(this);
};

Galv.PMOVE.Game_Player_forceMoveForward = Game_Player.prototype.forceMoveForward;
Game_Player.prototype.forceMoveForward = function() {
	Galv.PMOVE.center();
	this._normMove = true;
	Galv.PMOVE.Game_Player_forceMoveForward.call(this);
	this._normMove = false;
};


Galv.PMOVE.Game_Player_performTransfer = Game_Player.prototype.performTransfer;
Game_Player.prototype.performTransfer = function() {
	Galv.PMOVE.center();
	Galv.PMOVE.Game_Player_performTransfer.call(this);
};


//-----------------------------------------------------------------------------
//  DIAG GRAPHIC
//-----------------------------------------------------------------------------
// If using Diaonal Charset
if (Galv.PMOVE.diagGraphic) {
Galv.PMOVE.Sprite_Character_characterPatternY = Sprite_Character.prototype.characterPatternY;
Sprite_Character.prototype.characterPatternY = function() {
	if (!this._isBigCharacter && this._character._diagDir && this._character.characterIndex() < 4) {
		return Galv.PMOVE.diagRow[this._character._diagDir];
	} else {
    	return Galv.PMOVE.Sprite_Character_characterPatternY.call(this);
	};
};

Galv.PMOVE.Sprite_Character_characterBlockX = Sprite_Character.prototype.characterBlockX;
Sprite_Character.prototype.characterBlockX = function() {
	if (!this._isBigCharacter && this._character._diagDir && this._character.characterIndex() < 4) {
		var index = this._character.characterIndex() + 4;
        return index % 4 * this._character._cframes;
	} else {	
	    return Galv.PMOVE.Sprite_Character_characterBlockX.call(this);
	};

};

Galv.PMOVE.Sprite_Character_characterBlockY = Sprite_Character.prototype.characterBlockY;
Sprite_Character.prototype.characterBlockY = function() {
	if (!this._isBigCharacter && this._character._diagDir && this._character.characterIndex() < 4) {
		var index = this._character.characterIndex() + 4;
        return Math.floor(index / 4) * 4;
	} else {	
	    return Galv.PMOVE.Sprite_Character_characterBlockY.call(this);
	};

};
};

//-----------------------------------------------------------------------------
//  // end if using diagonal charset
//-----------------------------------------------------------------------------
})();