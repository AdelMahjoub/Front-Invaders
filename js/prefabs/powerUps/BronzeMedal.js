/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.BronzeMedal = function (gameState, name, properties) {
    'use strict';

    App.PowerUp.call(this, gameState, name, properties);

};

/** @type {Phaser.PowerUp} */
App.BronzeMedal.prototype = Object.create(App.PowerUp.prototype);

/** @type {App.PowerUp|*} */
App.BronzeMedal.prototype.constructor = App.BronzeMedal;

App.BronzeMedal.prototype.__collect = function () {
    'use strict';

    App.PowerUp.prototype.__collect.call(this);

    this.__gameState.__playSoundEffect('SFX:PickupBronze');
};