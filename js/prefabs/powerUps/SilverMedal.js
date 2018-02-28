/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.SilverMedal = function (gameState, name, properties) {
    'use strict';

    App.PowerUp.call(this, gameState, name, properties);

};

/** @type {Phaser.PowerUp} */
App.SilverMedal.prototype = Object.create(App.PowerUp.prototype);

/** @type {App.PowerUp|*} */
App.SilverMedal.prototype.constructor = App.SilverMedal;

App.SilverMedal.prototype.__collect = function () {
    'use strict';

    App.PowerUp.prototype.__collect.call(this);

    this.__gameState.__playSoundEffect('SFX:PickupSilver');
};