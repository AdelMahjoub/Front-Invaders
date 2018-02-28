/**
 *
 * @constructor
 */
App.Boot = function () {
    'use strict';
    Phaser.State.call(this);
    this.__gameDataFile = '';
};

/** @type {Phaser.State} */
App.Boot.prototype = Object.create(Phaser.State.prototype);

/** @type {App.Boot|*} */
App.Boot.prototype.constructor = App.Boot;

/**
 *
 * @param {string} gameDataFile
 */
App.Boot.prototype.init = function (gameDataFile) {
    'use strict';

    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.scale.setMinMax(270, 480, 432, 768);
    this.scale.roundPixels = true;
    this.time.advancedTiming = true;
    this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    this.__gameDataFile = gameDataFile;
};

App.Boot.prototype.preload = function () {
    'use strict';

    this.load.bitmapFont('verminVibes', 'assets/fonts/VerminVibes1989.png', 'assets/fonts/VerminVibes1989.xml');
    this.load.spritesheet('LoadingBar', 'assets/images/LoadingBar.png', 100, 16, 2);
    this.load.json('gameData', this.__gameDataFile);
};

App.Boot.prototype.create = function () {
    'use strict';

    this.state.start('Preload', true, false, this.cache.getJSON('gameData'));
};
