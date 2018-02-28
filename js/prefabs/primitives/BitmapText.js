/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.BitmapText = function (gameState, name, properties) {
    'use strict';

    Phaser.BitmapText.call(
        this,
        gameState.game,
        properties.position.x,
        properties.position.y,
        properties.font,
        properties.text,
        properties.size,
        properties.align
    );

    this.__gameState = gameState;
    this.__name = name;
    this.__group = properties['group'] || null;

    if (properties['anchor']) {
        this.anchor.setTo(properties['anchor']['x'], properties['anchor']['y']);
    }

    if(properties['tint']) {
        this.tint = properties['tint'];
    }

    if (properties.hasOwnProperty('visible')) {
        this.visible = properties['visible'];
    }

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

    this.__gameState.__prefabs[this.__name] = this;

    if (this.__name === 'GameOver:ContinueBtnLabel' && !this.__gameState.__continues) {
        this.visible = false;
    }
};

/** @type {Phaser.BitmapText} */
App.BitmapText.prototype = Object.create(Phaser.BitmapText.prototype);

/** @type {App.BitmapText|*} */
App.BitmapText.prototype.constructor = App.BitmapText;