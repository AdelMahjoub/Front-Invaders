/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Sound = function (gameState, name, properties) {
    'use strict';
    Phaser.Sound.call(this, gameState.game, properties.key, +properties.volume, properties.loop);

    this.__gameState = gameState;
    this.__name = name;
    this.__screen = properties.screen;

    if(properties.type === 'sfx') {
        this.__gameState.__soundEffects[this.__name] = this;
    } else if(properties.type === 'track') {
        this.__gameState.__soundTracks[this.__screen].push(this);
    }

};

/** @type {Phaser.Sound} */
App.Sound.prototype = Object.create(Phaser.Sound.prototype);

/** @type {App.Sound|*} */
App.Sound.prototype.constructor = App.Sound;