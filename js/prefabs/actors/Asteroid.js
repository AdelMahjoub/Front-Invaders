/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Asteroid = function (gameState, name, properties) {
    'use strict';

    App.Sprite.call(this, gameState, name, properties);

    this.position.set(
        this.__gameState.rnd.between(this.width / 2, this.__gameState.world.width - this.width / 2),
        -this.height
    );

    this.__speed = properties.speed;
    this.__rotationSpeed = this.__gameState.rnd.pick([1, -1]) * properties.rotationSpeed;
    this.__score = properties.score;

    this.__gameState.game.physics.arcade.enableBody(this);

};

/** @type {Phaser.Asteroid} */
App.Asteroid.prototype = Object.create(App.Sprite.prototype);

/** @type {App.Asteroid|*} */
App.Asteroid.prototype.constructor = App.Asteroid;

App.Asteroid.prototype.update = function () {
    'use strict';

    this.body.velocity.y = this.__speed;
    this.body.angularVelocity = this.__rotationSpeed;
    if (this.y > this.height) {
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }

    if (this.checkWorldBounds && this.outOfBoundsKill) {
        if (!this.inWorld) {
            this.destroy();
        }
    }
};

App.Asteroid.prototype.__explode = function () {
    'use strict';

    if (!this.inWorld) {
        return;
    }

    this.__gameState.__explosions.asteroid.emitter.emit(
        'asteroidExplosion',
        this.x,
        this.y,
        {
            zone: this.__gameState.__explosions.asteroid.circle,
            total: this.__gameState.__explosions.asteroid.total
        }
    );
};