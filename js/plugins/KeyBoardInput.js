/**
 *
 * @param {Phaser.State} gameState
 * @constructor
 */
App.KeyboardInput = function (gameState) {
    'use strict';

    Phaser.Plugin.call(this, gameState.game);

    this.__gameState = gameState;
    this.__inputsData = this.__gameState.__screensData[this.__gameState.__currentScreen]['keyboardInputs'];
    this.__inputs = {};

    Object.keys(this.__inputsData).forEach(function (event) {
        this.__inputs[event] = {};
        Object.keys(this.__inputsData[event]).forEach(function (key) {
            let keyCode = Phaser.KeyCode[key];
            this.__inputs[event][keyCode] = this.__inputsData[event][key];
        }, this);
    }, this);

    this.__gameState.input.keyboard.addCallbacks(this, this.__processInput, this.__processInput, null);

};

/** @type {Phaser.Plugin} */
App.KeyboardInput.prototype = Object.create(Phaser.Plugin.prototype);

/** @type {App.KeyboardInput|*} */
App.KeyboardInput.prototype.constructor = App.KeyboardInput;

App.KeyboardInput.prototype.__processInput = function (keyboardEvent) {
    'use strict';

    let eventType = keyboardEvent.type;
    let keyCode = keyboardEvent.keyCode.toString();

    if (!this.__inputs[eventType][keyCode]) {
        return;
    }

    let cbData = this.__inputs[eventType][keyCode].callback.split('.');
    let cbArgs = this.__inputs[eventType][keyCode].args;
    let cbContextName = cbData[0];
    let cbMethodName = cbData[1];

    let context = cbContextName === 'gameState' ? this.__gameState : this.__gameState[cbContextName];
    let method = context[cbMethodName];

    if (method) {
        method.apply(context, cbArgs);
    }

};