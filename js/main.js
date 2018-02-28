window.onload = function () {
    'use strict';

    const game = new Phaser.Game(360, 640, Phaser.CANVAS);

    game.state.add('Boot', new App.Boot());
    game.state.add('Preload', new App.Preload());
    game.state.add('Game', new App.Game());

    game.state.start('Boot', true, false, 'assets/data/Game.json');
};