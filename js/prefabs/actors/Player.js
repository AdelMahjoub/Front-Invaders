/**
 *
 * @param {Phaser.State} gameState
 * @param {string} name
 * @param {*} properties
 * @constructor
 */
App.Player = function (gameState, name, properties) {
    'use strict';

    properties.texture = gameState.__selectedShip.key;

    App.Sprite.call(this, gameState, name, properties);

    this.__gameState.__player = this;

    this.__speed = 230;
    this.__livesMax = 5;
    this.__lives = this.__livesMax;

    this.__invincible = false;
    this.__invincibleDelay = this.__gameState.time.fps * 2;
    this.__invincibleTime = 0;
    this.__invincibleDelta = 1;

    this.__blinkDelay = this.__gameState.time.fps / 10;
    this.__blinkTime = 0;
    this.__blinkDelta = 1;

    this.__engine = this.__gameState.add.group();

    this.__initBody();
    this.__initWeapon(properties);
    this.__initEngine();

    this.__movements = {
        up: false,
        down: false,
        right: false,
        left: false
    };

    /** @type {boolean} fire using keyboard */
    this.__shouldFire = false;
    this.events.onKilled.add(this.__onPlayerKilled, this);

};

/** @type {Phaser.Player} */
App.Player.prototype = Object.create(App.Sprite.prototype);

/** @type {App.Player|*} */
App.Player.prototype.constructor = App.Player;

App.Player.prototype.update = function () {
    'use strict';

    this.__updatePosition();
    this.__fire();
    this.__handleCollisions();
    this.__handleInvincibility();
};

App.Player.prototype.postUpdate = function () {
    'use strict';

    Phaser.Sprite.prototype.postUpdate.call(this);

    this.__alignEngine();
};

App.Player.prototype.__initBody = function () {
    'use strict';

    this.__gameState.game.physics.arcade.enableBody(this);
    this.body.collideWorldBounds = true;
};

/**
 *
 * @param {*} properties
 */
App.Player.prototype.__initWeapon = function (properties) {
    'use strict';

    this.__weapon = this.__gameState.add.weapon(40, 'Blast:' + this.key);

    if (properties.hasOwnProperty('scale')) {
        this.__weapon.bullets.children.forEach(function (bullet) {
            bullet.scale.setTo(properties.scale.x, properties.scale.y);
        }, this);
    }

    this.__weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    this.__weapon.bulletSpeed = properties.bulletSpeed;
    this.__weapon.fireRate = properties.fireRate;
    this.__weapon.bulletAngleOffset = properties.bulletAngleOffset;
    this.__weapon.trackSprite(this);
    this.__weapon.trackOffset.y = -this.height;

    this.__weapon.onFire.add(function () {
        this.__gameState.__playSoundEffect('SFX:PlayerLaser');
    }, this);
};

App.Player.prototype.__initEngine = function () {
    'use strict';

    const preCombustion = this.__gameState.__particlesData.engine.preCombustion;
    const postCombustion = this.__gameState.__particlesData.engine.postCombustion;

    this.__gameState.__plugins.particles.addData('preCombustion', preCombustion);
    this.__gameState.__plugins.particles.addData('postCombustion', postCombustion);

    this.__gameState.__groups[this.__group].add(this.__engine);
    this.__gameState.__groups[this.__group].sendToBack(this.__engine);

    let emitter = this.__gameState.__plugins.particles.createEmitter();

    emitter.addToWorld(this.__engine);
    emitter.emit('preCombustion', 0, 0, {repeat: -1, frequency: 200});
    emitter.emit('postCombustion', 0, 0, {repeat: -1, frequency: 300});

    this.__alignEngine();
};

App.Player.prototype.__alignEngine = function () {
    'use strict';

    if (!this.alive) {
        return;
    }

    this.__engine.alignIn(this, Phaser.CENTER, 0, 18);
};

/**
 *
 * @param {string} direction
 * @param {boolean} shouldMove
 * @private
 */
App.Player.prototype.__move = function (direction, shouldMove) {
    'use strict';

    if (!this.alive) {
        return
    }

    this.__movements[direction] = shouldMove;

};

App.Player.prototype.__updatePosition = function () {
    'use strict';

    if (!this.alive) {
        return;
    }


    if (this.__movements.left && this.body.velocity.x <= 0) {
        this.body.velocity.x = -this.__speed;
    } else if (this.__movements.right && this.body.velocity.x >= 0) {
        this.body.velocity.x = this.__speed;
    } else {
        this.body.velocity.x = 0;
    }

    if (this.__movements.up && this.body.velocity.y <= 0) {
        this.body.velocity.y = -this.__speed;
    } else if (this.__movements.down && this.body.velocity.y >= 0) {
        this.body.velocity.y = this.__speed;
    } else {
        this.body.velocity.y = 0;
    }

};


App.Player.prototype.__fire = function () {
    'use strict';

    if (!this.alive) {
        return;
    }

    if (this.__gameState.input.activePointer.isDown || this.__shouldFire) {
        this.__weapon.fire();
    }
};

/**
 * Fire using keyboard key
 * @param {boolean} shouldFire
 */
App.Player.prototype.__triggerFire = function (shouldFire) {
    'use strict';

    this.__shouldFire = shouldFire;

};

App.Player.prototype.__handleCollisions = function () {
    'use strict';

    if (!this.alive) {
        return;
    }

    this.__gameState.game.physics.arcade.overlap(
        this.__weapon.bullets,
        this.__gameState.__groups['Hazards'],
        this.__onBulletsVsHazards,
        this.__bulletsOverlapCondition,
        this
    );

    this.__gameState.game.physics.arcade.overlap(
        this,
        this.__gameState.__groups['Hazards'],
        this.__onPlayerVsHazards,
        this.__shipOverlapCondition,
        this
    );

    this.__gameState.game.physics.arcade.overlap(
        this,
        this.__gameState.__plugins.hazardsWeapon.bullets,
        this.__onPlayerVsHazards,
        this.__shipOverlapCondition,
        this
    );

    this.__gameState.game.physics.arcade.overlap(
        this,
        this.__gameState.__groups['PowerUps'],
        this.__onPlayerVsPowerUps,
        this.__bulletsOverlapCondition,
        this
    );
};

/**
 *
 * @param {Phaser.Bullet|*} bullet
 * @param {App.Asteroid|App.Enemy} hazard
 */
App.Player.prototype.__onBulletsVsHazards = function (bullet, hazard) {
    'use strict';

    let x = hazard.x;
    let y = hazard.y;

    if (typeof hazard['__explode'] === 'function') {
        hazard.__explode();
        this.__handleExplosionSfx(hazard);
    }

    bullet.kill();
    hazard.destroy();

    if (hazard.hasOwnProperty('__score')) {
        this.__gameState.__score += hazard.__score;
    }

    this.__gameState.__spawnPowerUp(x, y);
};

/**
 *
 * @param {App.Player} player
 * @param {App.Asteroid|App.Enemy|Phaser.Bullet} hazard
 */
App.Player.prototype.__onPlayerVsHazards = function (player, hazard) {
    'use strict';

    let x = hazard.x;
    let y = hazard.y;

    if (typeof hazard['__explode'] === 'function') {
        hazard.__explode();
        this.__handleExplosionSfx(hazard);
    }

    hazard.kill();

    if (this.__lives > 0) {
        this.__lives--;
        this.__invincible = true;
        this.__gameState.__playSoundEffect('SFX:HullHit');
    } else {
        this.__gameState.__playSoundEffect('SFX:ShipExplosion');
        this.__explode();
        this.kill();
    }

    this.__gameState.__spawnPowerUp(x, y);
};

App.Player.prototype.__onPlayerVsPowerUps = function (player, powerUp) {
    'use strict';

    powerUp.__collect();
    powerUp.kill();
};

App.Player.prototype.__bulletsOverlapCondition = function () {
    'use strict';

    return this.alive;
};

App.Player.prototype.__shipOverlapCondition = function () {
    'use strict';

    return this.alive && !this.__invincible;
};

App.Player.prototype.__handleInvincibility = function () {
    'use strict';

    if (!this.alive) {
        return;
    }

    if (this.__invincible) {
        this.__blinkTime += this.__blinkDelta;
        if (this.__blinkTime >= this.__blinkDelay) {
            this.alpha = this.alpha === 1 ? 0 : 1;
            this.__engine.alpha = this.__engine.alpha === 1 ? 0 : 1;
            this.__blinkTime = 0;
        }
        this.__invincibleTime += this.__invincibleDelta;
        if (this.__invincibleTime >= this.__invincibleDelay) {
            this.__invincibleTime = 0;
            this.__invincible = false;
        }
    } else {
        this.alpha = 1;
        this.__engine.alpha = 1;
        this.__invincibleTime = 0;
        this.__blinkTime = 0;
    }
};

App.Player.prototype.__explode = function () {
    'use strict';

    this.__gameState.__explosions.player.emitter.emit(
        'playerExplosion',
        this.x,
        this.y,
        {
            zone: this.__gameState.__explosions.player.circle,
            total: this.__gameState.__explosions.player.total
        }
    );
};

App.Player.prototype.__onPlayerKilled = function () {
    'use strict';

    this.__weapon.destroy();
    this.__engine.visible = false;
};

/**
 *
 * @param {App.Asteroid|App.Enemy} hazard
 */
App.Player.prototype.__handleExplosionSfx = function (hazard) {
    'use strict';

    if (hazard.__name.includes('Asteroid')) {
        this.__gameState.__playSoundEffect('SFX:AsteroidExplosion');
    } else if (hazard.__name.includes('EnemyShip')) {
        this.__gameState.__playSoundEffect('SFX:ShipExplosion');
    }
};