/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Text = function (gameState, name, properties) {
    'use strict';

    Phaser.Text.call(
        this,
        gameState.game,
        properties.position.x,
        properties.position.y,
        properties.text,
        properties.style
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

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

    this.__gameState.__prefabs[this.__name] = this;
};

/** @type {Phaser.Text} */
App.Text.prototype = Object.create(Phaser.Text.prototype);

/** @type {App.Text|*} */
App.Text.prototype.constructor = App.Text;