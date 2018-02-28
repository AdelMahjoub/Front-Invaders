/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.PowerUp = function (gameState, name, properties) {
    'use strict';

    App.Sprite.call(this, gameState, name, properties);

    this.__gameState.game.physics.arcade.enable(this);
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;

    this.__speed = properties.speed;
    this.__score = properties.score;

    this.__tween = this.__gameState.game.add.tween(this.scale)
        .to({x: this.scale.x * 1.2, y: this.scale.x * 1.2}, 500)
        .yoyo(true)
        .loop(true)
        .start();

    this.events.onKilled.add(function() {
        this.__gameState.game.tweens.remove(this.__tween);
        this.destroy();
    }, this);

};

/** @type {Phaser.PowerUp} */
App.PowerUp.prototype = Object.create(App.Sprite.prototype);

/** @type {App.PowerUp|*} */
App.PowerUp.prototype.constructor = App.PowerUp;

App.PowerUp.prototype.create = function() {
    'use strict';


};

App.PowerUp.prototype.update = function () {
    'use strict';

    this.body.velocity.y = this.__speed;
};

App.PowerUp.prototype.__collect = function () {
    'use strict';

    this.__gameState.__score += this.__score;
};