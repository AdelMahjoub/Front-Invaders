/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Enemy = function (gameState, name, properties) {
    'use strict';

    App.Sprite.call(this, gameState, name, properties);

    this.position.set(
        this.__gameState.rnd.between(this.width / 2, this.__gameState.world.width - this.width / 2),
        -this.height
    );

    this.__speed = properties.speed;
    this.__score = properties.score;

    this.__fireDelay = this.__gameState.time.fps * 1.16;
    this.__fireDelta = 1;
    this.__fireTime = 0;

    this.__dodgeDelay = this.__gameState.time.fps;
    this.__dodgeDelta = 1;
    this.__dodgeTime = 0;
    this.__dodgeTween = null;

    this.__gameState.game.physics.arcade.enableBody(this);

};

/** @type {Phaser.Enemy} */
App.Enemy.prototype = Object.create(App.Sprite.prototype);

/** @type {App.Enemy|*} */
App.Enemy.prototype.constructor = App.Enemy;

App.Enemy.prototype.update = function () {
    'use strict';

    this.body.velocity.y = this.__speed;

    if (this.y > this.height) {
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }

    if (this.checkWorldBounds && this.outOfBoundsKill) {
        if (!this.inWorld) {
            this.destroy();
        }
    }

    this.__fire();
    this.__dodge();

};

App.Enemy.prototype.__fire = function () {
    'use strict';

    if (!this.alive) {
        return;
    }

    this.__fireTime += this.__fireDelta;
    if (this.__fireTime >= this.__fireDelay) {
        this.__gameState.__plugins.hazardsWeapon.fire({x: this.x, y: this.y + this.height});
        this.__fireTime = 0;
        this.__gameState.__playSoundEffect('SFX:EnemyLaser');
    }
};

App.Enemy.prototype.__dodge = function () {
    'use strict';

    if (!this.alive) {
        return;
    }

    this.__dodgeTime += this.__dodgeDelta;
    if (this.__dodgeTime >= this.__dodgeDelay && !this.__dodgeTween) {

        let dodgeTo = null;

        if ((this.x + this.width) < this.__gameState.world.centerX || (this.x - this.width) > this.__gameState.world.centerX) {
            dodgeTo = this.__gameState.rnd.between(this.x, this.__gameState.world.centerX);
        } else {
            let left = 0 + this.width;
            let right = this.__gameState.world.width - this.width;
            let randomPosition = this.__gameState.rnd.pick([left, right]);
            dodgeTo = this.__gameState.rnd.between(this.x, randomPosition);
        }

        if (dodgeTo) {
            this.__dodgeTween = this.__gameState.add.tween(this.position)
                .to({x: dodgeTo}, 600, null, true);
        }

        this.__dodgeTime = 0;
    }
};

App.Enemy.prototype.__explode = function () {
    'use strict';

    this.__gameState.__explosions.enemyShip.emitter.emit(
        'enemyShipExplosion',
        this.x,
        this.y,
        {
            zone: this.__gameState.__explosions.enemyShip.circle,
            total: this.__gameState.__explosions.enemyShip.total
        }
    );
};