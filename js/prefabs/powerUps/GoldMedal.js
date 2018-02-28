/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.GoldMedal = function (gameState, name, properties) {
    'use strict';

    App.PowerUp.call(this, gameState, name, properties);

};

/** @type {Phaser.PowerUp} */
App.GoldMedal.prototype = Object.create(App.PowerUp.prototype);

/** @type {App.PowerUp|*} */
App.GoldMedal.prototype.constructor = App.GoldMedal;

App.GoldMedal.prototype.__collect = function () {
    'use strict';

    App.PowerUp.prototype.__collect.call(this);

    this.__gameState.__playSoundEffect('SFX:PickupGold');
};