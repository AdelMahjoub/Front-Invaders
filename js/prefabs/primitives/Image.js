/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Image = function (gameState, name, properties) {
    'use strict';

    Phaser.Image.call(
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

    if (properties.hasOwnProperty('visible')) {
        this.visible = properties['visible'];
    }

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

    this.__gameState.__prefabs[this.__name] = this;

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

};

/** @type {Phaser.Image} */
App.Image.prototype = Object.create(Phaser.Image.prototype);

/** @type {App.Image|*} */
App.Image.prototype.constructor = App.Image;
