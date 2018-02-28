/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Button = function (gameState, name, properties) {
    'use strict';

    Phaser.Button.call(
        this,
        gameState.game,
        properties.position.x,
        properties.position.y,
        properties.texture,
        null,
        null,
        properties.overFrame,
        properties.outFrame,
        properties.downFrame
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
        this.frame = +properties['frame'];
    }

    if (properties.hasOwnProperty('visible')) {
        this.visible = properties['visible'];
    }

    if (this.__group) {
        this.__gameState.__groups[this.__group].add(this);
    }

    this.__gameState.__prefabs[this.__name] = this;

    let callbackContext = null;
    let callback = null;

    if (properties.callbackContext === 'gameState') {
        callbackContext = this.__gameState;
    } else if (App[properties.callbackContext]) {
        callbackContext = App[properties.callbackContext];
    }

    if (callbackContext) {
        callback = callbackContext[properties.callback];
    }

    if (callback) {
        this.onInputUp.add(function () {
            callback.apply(callbackContext, properties.args);
        });
    }

    if (this.__name === 'GameOver:ContinueBtn' && !this.__gameState.__continues) {
        this.visible = false;
    }

};

/** @type {Phaser.Button} */
App.Button.prototype = Object.create(Phaser.Button.prototype);

/** @type {App.Button|*} */
App.Button.prototype.constructor = App.Button;