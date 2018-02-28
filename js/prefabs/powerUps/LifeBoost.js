/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.LifeBoost = function (gameState, name, properties) {
    'use strict';

    App.PowerUp.call(this, gameState, name, properties);

};

/** @type {Phaser.PowerUp} */
App.LifeBoost.prototype = Object.create(App.PowerUp.prototype);

/** @type {App.PowerUp|*} */
App.LifeBoost.prototype.constructor = App.LifeBoost;

App.LifeBoost.prototype.__collect = function () {
    'use strict';

    App.PowerUp.prototype.__collect.call(this);

    let lifePower = this.__gameState.__player.__lives + 1;
    this.__gameState.__player.__lives = Math.min(lifePower, this.__gameState.__player.__livesMax);
    this.__gameState.__playSoundEffect('SFX:LifeBoost');
};