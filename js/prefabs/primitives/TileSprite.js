/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.TileSprite = function (gameState, name, properties) {
    'use strict';
    Phaser.TileSprite.call(
        this,
        gameState.game,
        properties.position.x,
        properties.position.y,
        properties.width,
        properties.height,
        properties.texture,
    );

    this.__gameState = gameState;
    this.__name = name;
    this.__group = properties['group'] || null;

    this.__isScrollable = null;
    if(properties.isScrollable) {
        this.__isScrollable = true;
    }

    if (properties['anchor']) {
        this.anchor.setTo(properties['anchor']['x'], properties['anchor']['y']);
    }

    if (properties['scale']) {
        this.scale.setTo(properties['scale']['x'], properties['scale']['y']);
    }

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

    this.__gameState.__prefabs[this.__name] = this;
};

/** @type {Phaser.TileSprite} */
App.TileSprite.prototype = Object.create(Phaser.TileSprite.prototype);

/** @type {App.TileSprite|*} */
App.TileSprite.prototype.constructor = App.TileSprite;

App.TileSprite.prototype.update = function () {
    'use strict';

    if(this.__isScrollable) {
        this.tilePosition.y += this.__gameState.__scrollSpeed;
    }
};