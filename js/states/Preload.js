/**
 *
 * @constructor
 */
App.Preload = function () {
    'use strict';

    Phaser.State.call(this);

    this.__gameData = null;

    this.__loadingGroup = null;
    this.__loadingBarContainer = null;
    this.__loadingBar = null;
    this.__loadingBox = null;
    this.__loadingText = null;
    this.__audioList = [];
};

/** @type {Phaser.State} */
App.Preload.prototype = Object.create(Phaser.State.prototype);

/** @type {App.Preload|*} */
App.Preload.prototype.constructor = App.Preload;

/**
 *
 * @param {*} gameData
 */
App.Preload.prototype.init = function (gameData) {
    'use strict';

    this.__gameData = gameData;

    this.__loadingBox = this.add.sprite(this.world.centerX, this.world.centerY, this.__createLoadingBox());
    this.__loadingBox.anchor.setTo(0.5);

    this.__loadingGroup = this.add.group();
    this.__loadingBar = this.add.sprite(0, 0, 'LoadingBar', 0, this.__loadingGroup);
    this.__loadingBar.anchor.setTo(0.5);

    this.__loadingBarContainer = this.add.sprite(0, 0, 'LoadingBar', 1, this.__loadingGroup);
    this.__loadingBarContainer.anchor.setTo(0.5);

    this.__loadingText = this.add.bitmapText(0, 20, 'verminVibes', '', 18, this.__loadingGroup);
    this.__loadingText.anchor.setTo(0.5);

    this.__loadingGroup.x = this.world.centerX;
    this.__loadingGroup.y = this.world.centerY;

};

App.Preload.prototype.preload = function () {
    'use strict';

    this.__gameData.assets.forEach(function (asset) {
        switch (asset.type) {
            case 'image':
                this.load.image(asset.key, asset.url);
                break;
            case 'audio':
                this.__audioList.push(asset.key);
                this.load.audio(asset.key, asset.urls);
                break;
            case 'spritesheet':
                this.load.spritesheet(asset.key, asset.url, asset.frameWidth, asset.frameHeight, asset.frameMax);
                break;
        }
    }, this);

    Object.keys(this.__gameData.screens).forEach(function (screen) {
        this.load.json(screen, this.__gameData.screens[screen]);
    }, this);

    this.load.json('ParticlesData', this.__gameData.particles);

    this.load.setPreloadSprite(this.__loadingBar);

    this.load.onFileComplete.add(function (progress, asset, loaded, current, total) {
        this.__loadingText.text = `Loading.. ${progress} %`;
    }, this);

};

App.Preload.prototype.loadRender = function () {
    'use strict';

    this.__loadingBox.rotation += 0.05;
};

App.Preload.prototype.create = function () {
    'use strict';

    this.sound.setDecodedCallback(this.__audioList, function () {
        this.state.start('Game', true, false, this.__gameData);
    }, this);

};

App.Preload.prototype.render = function () {
    'use strict';

    this.__loadingBox.rotation += 0.05;
};

App.Preload.prototype.__createLoadingBox = function () {
    'use strict';

    let box = this.make.graphics(0, 0);

    box.lineStyle(1, 0xFF0000, 0.8);
    box.beginFill(0xFF700B, 0.5);
    box.drawRect(0, 0, 50, 50);
    box.endFill();

    return box.generateTexture();
};