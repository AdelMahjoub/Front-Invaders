/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Sprite = function (gameState, name, properties) {
    'use strict';
    Phaser.Sprite.call(
        this,
        gameState.game,
        properties.position.x,
        properties.position.y,
        properties.texture,
    );

    this.__gameState = gameState;
    this.__name = name;
    this.__group = properties['group'] || null;

    if (properties['anchor']) {
        this.anchor.setTo(properties['anchor']['x'], properties['anchor']['y']);
    }

    if (properties['scale']) {
        this.scale.setTo(properties['scale']['x'], properties['scale']['y']);
    }

    if (properties['frame']) {
        this.frame = parseInt(properties.frame, 10);
    }

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

    this.__gameState.__prefabs[this.__name] = this;
};

/** @type {Phaser.Sprite} */
App.Sprite.prototype = Object.create(Phaser.Sprite.prototype);

/** @type {App.Sprite|*} */
App.Sprite.prototype.constructor = App.Sprite;