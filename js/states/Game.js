/**
 * GameState
 * @constructor
 */
App.Game = function () {
    'use strict';

    Phaser.State.call(this);

    this.__scrollSpeed = 4;
    this.__gameData = null;
    this.__screensData = {
        Start: null,
        Select: null,
        Play: null,
        GameOver: null
    };
    this.__particlesData = null;
    this.__currentScreen = '';
    this.__previousScreen = null;
    this.__prefabClasses = {
        Image: App.Image.prototype.constructor,
        Sprite: App.Sprite.prototype.constructor,
        ScrollingBackground: App.TileSprite.prototype.constructor,
        Text: App.Text.prototype.constructor,
        BitmapText: App.BitmapText.prototype.constructor,
        Button: App.Button.prototype.constructor,
        Player: App.Player.prototype.constructor,
        Asteroid: App.Asteroid.prototype.constructor,
        Enemy: App.Enemy.prototype.constructor,
        LifeBoost: App.LifeBoost.prototype.constructor,
        BronzeMedal: App.BronzeMedal.prototype.constructor,
        SilverMedal: App.SilverMedal.prototype.constructor,
        GoldMedal: App.GoldMedal.prototype.constructor,
        Sound: App.Sound.prototype.constructor
    };
    this.__prefabs = {};
    this.__groups = {};
    this.__player = null;
    this.__selectedShip = null;

    this.__plugins = {
        particles: null,
        hazardsWeapon: null,
        keyboardInputs: null
    };

    this.__explosions = {
        player: {circle: null, emitter: null, total: 20, radius: 30},
        asteroid: {circle: null, emitter: null, total: 20, radius: 30},
        enemyShip: {circle: null, emitter: null, total: 20, radius: 30}
    };

    this.__soundEffects = {};
    this.__soundTracksIndex = -1;
    this.__soundTracks = {
        Start: [],
        Select: [],
        Play: [],
        GameOver: []
    };
    this.__elapsed = 0;
    this.__fadeTime = 4;

    this.__onPauseInput = null;
    this.__touchMoveSensitivity = 1;

    this.__initScores();
    this.__initTimings();
    this.__initHazards();
    this.__initPowerUps();

};

/** @type {Phaser.State} */
App.Game.prototype = Object.create(Phaser.State.prototype);

/** @type {App.Game|*} */
App.Game.prototype.constructor = App.Game;

/**
 *
 * @param {*} gameData
 * @param {string} screen
 */
App.Game.prototype.init = function (gameData, screen) {
    'use strict';

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.__gameData = gameData;
    this.__currentScreen = screen ? screen : 'Start';

    Object.keys(this.__gameData.screens).forEach(function (screen) {
        this.__screensData[screen] = this.cache.getJSON(screen);
    }, this);

    this.__particlesData = this.cache.getJSON('ParticlesData');
};

App.Game.prototype.create = function () {
    'use strict';

    this.__initGroups();
    this.__initPrefabs();
    this.__initPauseMenu();
    this.__initSoundtracks();

    if (this.__screensData[this.__currentScreen]['keyboardInputs']) {
        this.__plugins.keyboardInputs = this.game.plugins.add(new App.KeyboardInput(this));
    }

    this.__plugins.particles = this.game.plugins.add(Phaser.ParticleStorm);

    this.__initHazardsWeapon();
    this.__initExplosions();

    if (this.__currentScreen === 'Play') {
        this.__playSoundEffect('SFX:AmbienceSpace');
    }

    this.game.input.maxPointers = 1;
    this.__initTouchMovements();
    this.__orderGroups();

    if (typeof this['__' + this.__currentScreen] === 'function') {
        this['__' + this.__currentScreen]();
    }

};

App.Game.prototype.update = function () {
    'use strict';

    this.__playSoundtracks(this.__currentScreen);
    this.__Play();
};

App.Game.prototype.paused = function () {
    'use strict';

    if (this.__prefabs['Play:PausedText'] && this.__currentScreen === 'Play') {
        this.__prefabs['Play:PausedText'].text = 'pause';
    }
};

App.Game.prototype.pauseUpdate = function () {
    'use strict';

    if (!this.__onPauseInput) {
        this.__onPauseInput = this.input.onUp.add(function (pointer) {
            let x = pointer.position.x;
            let y = pointer.position.y;
            let btnBounds = {};
            let clickedBtn = null;

            this.__groups['PauseMenu'].forEach(function (pauseElement) {
                if (pauseElement.__name !== 'Play:PausePanel') {
                    btnBounds[pauseElement.__name] = pauseElement.getBounds();
                }
            }, this);

            Object.keys(btnBounds).forEach(function (key) {
                let btn = btnBounds[key];
                if (
                    x >= btn.x && x <= (btn.x + btn.width) &&
                    y >= btn.y && y <= (btn.y + btn.height)
                ) {
                    clickedBtn = key;
                }
            }, this);

            switch (clickedBtn) {
                case 'GUI:PauseBtn':
                    this.__togglePause();
                    break;
                case 'GUI:BackBtn':
                    this.__togglePause();
                    break;
                case 'GUI:FullscreenBtn':
                    this.__toggleFullScreen();
                    break;
                case 'GUI:MuteBtn':
                    this.__togglePause();
                    this.__toggleMute();
                    break;
                case 'GUI:HomeBtn':
                    this.__togglePause();
                    this.__SwitchScreen('Start', false);
                    break;
                default:
            }
        }, this);

    }
};

App.Game.prototype.resumed = function () {
    'use strict';

    if (this.__onPauseInput) {
        this.__onPauseInput.detach();
        this.__onPauseInput = null;
    }
    if (this.__prefabs['Play:PausedText'] && this.__currentScreen === 'Play') {
        this.__prefabs['Play:PausedText'].text = '';
        this.__playSoundEffect('SFX:Resume');
    }


};

App.Game.prototype.__initGroups = function () {
    'use strict';

    this.__gameData.groups.forEach(function (group) {
        this.__groups[group] = this.game.add.group();
    }, this);

};

App.Game.prototype.__orderGroups = function () {
    'use strict';

    this.world.bringToTop(this.__groups['Texts']);
    this.world.bringToTop(this.__groups['Hud']);
    this.world.bringToTop(this.__groups['GUI']);
    this.world.bringToTop(this.__groups['PauseMenu']);
    this.world.sendToBack(this.__groups['PowerUps']);
    this.world.sendToBack(this.__groups['Backgrounds']);
};

App.Game.prototype.__initPrefabs = function () {
    'use strict';

    this.__screensData[this.__currentScreen].prefabs.forEach(function (prefab) {
        if (this.__prefabClasses[prefab.class]) {
            new this.__prefabClasses[prefab.class](this, prefab.name, prefab.properties);
        }
    }, this);

};

App.Game.prototype.__SwitchScreen = function (screen, continuePlaying) {
    'use strict';

    let sfx = null;

    this.__previousScreen = this.__currentScreen;

    if (this.__currentScreen === 'Start' && screen === 'Select') {
        sfx = this.__soundEffects['SFX:Start'];
    } else if (this.__currentScreen === 'Select' && screen === 'Play') {
        sfx = this.__soundEffects['SFX:TakeOff'];
    } else if (this.__currentScreen === 'GameOver' && screen === 'Start') {
        sfx = this.__soundEffects['SFX:BackToTitle'];
    }

    if (screen === 'Play') {
        this.__initTimings();
        this.__initPowerUps();
        if (!continuePlaying || !this.__continues) {
            this.__initHazards();
            this.__initScores();
        } else if (continuePlaying) {
            this.__continues--;
            console.log('Play ad video then continue');
        }
    }

    this.__disableParticleEmitters();
    this.__hideForm();

    if (sfx) {
        sfx.play();
        sfx.fadeTo(600, sfx.volume - 0.1);
        sfx.onFadeComplete.add(function () {
            this.state.restart(true, false, this.__gameData, screen);
        }, this);
    } else {
        this.state.restart(true, false, this.__gameData, screen);
    }

};

App.Game.prototype.__Start = function () {
    'use strict';

    this.__getUser();

};

App.Game.prototype.__Help = function () {
    'use strict';

    if (this.game.device.desktop) {
        this.__groups['DesktopHelp'].forEach(function (element) {
            element.visible = true;
        });
    } else if (this.game.device.touch) {
        this.__groups['TouchHelp'].forEach(function (element) {
            element.visible = true;
        });
    }

};

App.Game.prototype.__Select = function () {
    'use strict';

    if (this.__currentScreen !== 'Select') {
        return;
    }

    this.__selectedShip = this.__groups['ShipSelection'].next();
    this.__selectedShip.visible = true;
    this.__updateShipSelectionText();

};

App.Game.prototype.__Play = function () {
    'use strict';

    if (this.__currentScreen !== 'Play' || !this.__player) {
        return;
    }

    if (!this.__player.alive) {

        this.__toGameOverTime += this.__toGameOverDelta;

        if (this.__toGameOverTime >= this.__toGameOverDelay) {
            this.__stopSoundEffect('SFX:AmbienceSpace');
            this.__playSoundEffect('SFX:ToGameOver');
            this.__SwitchScreen('GameOver', false);
        }

    } else {
        this.__spawnHazards();
        this.__prefabs['Play:ScoreText'].text = this.__score;
        this.__prefabs['Play:WaveText'].text = this.__wave;
        this.__prefabs['Play:LifeHud'].frame = this.__player.__lives;

    }

};

App.Game.prototype.__GameOver = function () {
    'use strict';

    if (this.__currentScreen !== 'GameOver') {
        return;
    }

    let total = this.__wave * this.__waveScoreMultiplier + this.__score;
    this.__prefabs['GameOver:ScoreText'].text = 'Score\n' + this.__score;
    this.__prefabs['GameOver:WaveText'].text = 'Waves\n' + this.__wave + ' x ' + this.__waveScoreMultiplier;
    this.__prefabs['GameOver:TotalText'].text = 'Total\n' + total;

    let highScore = App.user.data ? App.user.data.score : App.highScore;
    if(!App.user.data && highScore < total) {
        highScore = total;
        App.highScore = total;
    } else if(App.user.data && highScore < total) {
        highScore = total;
        this.__onScoreUpdate();
        this.__toggleHomeBtn(false);
        this.__toggleSyncMessage(true);

        let formData = new FormData();
        formData.append('score', total.toString());
        formData.append('action', 'update');
        axios.defaults.withCredentials = true;
        axios({
            method: 'POST',
            url: App.authUrl,
            data: formData,
            config: {
                headers: {'Content-Type': 'multipart/form-data' },
                withCredentials: true
            }
        }).then(function(response) {
            this.__toggleHomeBtn(true);
            this.__toggleSyncMessage(false);
            this.__onScoreUpdated();

        }.bind(this))
            .catch(function(error) {
                this.__toggleHomeBtn(true);
                this.__toggleSyncMessage(false);
                this.__onScoreUpdated();

            }.bind(this))

    }

    this.__prefabs['GameOver:HiScoreText'].text = 'best\n' + highScore;

};

App.Game.prototype.__Leaderboard = function () {
    'use strict';

    let topScores = [];
    let rankX = 10;
    let nameX = 30;
    let scoreX = 350;
    let startY = 180;
    let paddingY = 30;
    let fontSize = 16;

    axios.defaults.withCredentials = true;
    axios.get(App.authUrl + '?query=topScores', {withCredentials: true})
        .then(function(response) {
            topScores = response.data.data;
            this.__scorers = [];
            topScores.forEach(function(user, index) {
                let rank = this.add.bitmapText(rankX, startY + paddingY * index, 'verminVibes', index + 1, fontSize);
                let name = this.add.bitmapText(nameX, startY + paddingY * index, 'verminVibes', user.username, fontSize);
                let score = this.add.bitmapText(scoreX, startY + paddingY * index, 'verminVibes', user.score, fontSize);
                score.anchor.x = 1;
                this.__scorers.push({rank, name, score});
            }, this);
        }.bind(this))

};

App.Game.prototype.__SignInScreen = function() {
    'use strict';

    this.__showForm();
    let formContainer = document.querySelector('#signin-container');
    let form = document.querySelector('#signin-form');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        this.__toggleHomeBtn(false);

        let username = document.querySelector('input[name="username"]');
        let password = document.querySelector('input[name="password"]');

        if(!(Boolean(username.value) && Boolean(password.value))) {
            let message = 'All fields are required';
            this.__errorMessage = this.game.add.bitmapText(this.world.centerX, this.world.centerY, 'verminVibes', message, 16);
            this.__errorMessage.anchor.setTo(0.5);
            this.__errorMessage.tint = '0xff0028';
            this.__toggleHomeBtn(true);
        } else {
            let formData = new FormData();
            formData.append('username', username.value);
            formData.append('password', password.value);
            formData.append('action', 'authenticate');
            if(this['errorMessage']) {
                this.__errorMessage.destroy();
            }
            this.__toggleHomeBtn(false);
            this.__toggleSyncMessage(true);
            axios({
                method: 'POST',
                url: App.authUrl,
                data: formData,
                config: {
                    headers: {'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                }
            }).then(function(response) {
                    this.__toggleHomeBtn(true);
                    this.__toggleSyncMessage(false);
                    App.user.data = response.data.data;
                    if(App.user.data) {
                        this.__SwitchScreen('Start', false);
                    } else {
                        let message = 'Invalid username or password';
                        this.__errorMessage = this.game.add.bitmapText(this.world.centerX, this.world.centerY, 'verminVibes', message, 16);
                        this.__errorMessage.anchor.setTo(0.5);
                        this.__errorMessage.tint = '0xff0028';
                    }
                }.bind(this))
                .catch(function(error) {
                    this.__toggleHomeBtn(true);
                    this.__toggleSyncMessage(false);
                    let message = 'An unexpected error occured please try again.';
                    this.__errorMessage = this.game.add.bitmapText(this.world.centerX, this.world.centerY, 'verminVibes', message, 16);
                    this.__errorMessage.anchor.setTo(0.5);
                    this.__errorMessage.tint = '0xff0028';
                }.bind(this))
        }
    }.bind(this), false);

};

App.Game.prototype.__browseShips = function (direction) {
    'use strict';

    let newShip = null;
    this.__selectedShip.visible = false;

    switch (direction) {
        case 1 :
            newShip = this.__groups['ShipSelection'].next();
            break;
        case -1:
            newShip = this.__groups['ShipSelection'].previous();
            break;
    }

    if (newShip) {
        this.__playSoundEffect('SFX:Browse');
        this.__selectedShip = newShip;
        this.__selectedShip.visible = true;
        this.__updateShipSelectionText();
    }
};

App.Game.prototype.__updateShipSelectionText = function () {
    'use strict';

    this.__prefabs['Select:ShipName'].text = this.__selectedShip.key.replace('Ship', '');
    this.__prefabs['Select:ShipName'].x = this.world.centerX;
};

App.Game.prototype.__initTouchMovements = function () {
    'use strict';

    if (this.__currentScreen === 'Play' && this.game.device.touch) {

        let recentX = null;
        let recentY = null;
        let oldX = null;
        let oldY = null;

        this.game.input.addMoveCallback(function (pointer, x, y) {
            if (this.game.input.activePointer.isMouse) {
                return;
            }

            recentX = x;
            recentY = y;

            if (oldX !== null && oldY !== null) {
                let dx = recentX - oldX;
                let dy = recentY - oldY;

                this.__player.x += dx * this.__touchMoveSensitivity;
                this.__player.y += dy * this.__touchMoveSensitivity;
            }

            oldX = recentX;
            oldY = recentY;

        }, this);

        this.game.input.onUp.add(function () {
            if (this.game.input.activePointer.isMouse) {
                return;
            }

            oldX = null;
            oldY = null;
        }, this)

    }
};

App.Game.prototype.__initHazardsWeapon = function () {
    'use strict';

    this.__plugins.hazardsWeapon = this.add.weapon(40, 'Blast:EnemyShip');

    let properties = {
        scale: {x: 0.6, y: 0.6},
        speed: 200,
        bulletSpeed: 500,
        fireRate: 320,
        bulletAngleOffset: 90,
        group: 'Hazards'
    };

    this.__plugins.hazardsWeapon.bullets.children.forEach(function (bullet) {
        this.game.physics.arcade.enable(bullet);
        bullet.scale.setTo(properties.scale.x, properties.scale.y);
    }, this);

    this.__plugins.hazardsWeapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    this.__plugins.hazardsWeapon.bulletSpeed = -properties.bulletSpeed;
    this.__plugins.hazardsWeapon.fireRate = properties.fireRate;
    this.__plugins.hazardsWeapon.bulletAngleOffset = properties.bulletAngleOffset;
    this.__plugins.hazardsWeapon.autoExpandBulletsGroup = true;
};

App.Game.prototype.__initExplosions = function () {
    'use strict';

    Object.keys(this.__particlesData).forEach(function (entity) {
        if (this.__explosions.hasOwnProperty(entity)) {
            Object.keys(this.__particlesData[entity]).forEach(function (key) {
                this.__plugins.particles.addData(key, this.__particlesData[entity][key]);
                this.__plugins.particles.addData(key, this.__particlesData[entity][key]);
                this.__plugins.particles.addData(key, this.__particlesData[entity][key]);
            }, this);
            this.__explosions[entity].emitter = this.__plugins.particles.createEmitter();
            this.__explosions[entity].circle = this.__plugins.particles.createCircleZone(this.__explosions[entity].radius);
            this.__explosions[entity].emitter.addToWorld();
        }
    }, this);

};

App.Game.prototype.__disableParticleEmitters = function () {
    'use strict';

    try {
        this.__plugins.particles.emitters.forEach(function (emitter) {
            emitter.enabled = false;
        }, this);
    } catch (e) {
        console.log(e.message);
    }
};

App.Game.prototype.__initHazards = function () {
    'use strict';

    this.__waveStarted = false;
    this.__waveTime = 0;

    this.__hazardsDelta = 0.8;
    this.__hazardsTime = 0;

    this.__hazardsPerWave = 20;
    this.__hazardsCount = 0;
    this.__hazardsDiversityIndex = 0;

    if (this.__screensData.Play) {
        this.__hazardsList = JSON.parse(JSON.stringify(this.__screensData.Play.hazards.list));
        this.__hazardsDiversity = JSON.parse(JSON.stringify(this.__screensData.Play.hazards.diversity));
        this.__hazardsProperties = JSON.parse(JSON.stringify(this.__screensData.Play.hazards.properties));
    } else {
        this.__hazardsList = [];
        this.__hazardsDiversity = [];
        this.__hazardsProperties = {};
    }

};

App.Game.prototype.__initScores = function () {
    'use strict';

    this.__score = 0;
    this.__wave = 0;
    this.__waveScoreMultiplier = 1500;
    this.__continues = 1;
};

App.Game.prototype.__initTimings = function () {
    'use strict';

    if (this.time && this.time.fps >= 30) {
        this.__toGameOverDelay = this.time.fps * 4;
        this.__waveDelay = this.time.fps * 3;
        this.__hazardsDelay = this.time.fps / 1.5;
    } else {
        this.__toGameOverDelay = 240;
        this.__waveDelay = 180;
        this.__hazardsDelay = 40;
    }
    this.__toGameOverDelta = 1;
    this.__toGameOverTime = 0;

    this.__waveDelta = 1;

    this.__hazardsDeltaMax = 2;
    this.__hazardsDeltaIncrease = 0.2;
    this.__hazardsIncreasePerWave = 5;

};

App.Game.prototype.__initPowerUps = function () {
    'use strict';

    if (this.__screensData.Play) {
        this.__powerUpsList = JSON.parse(JSON.stringify(this.__screensData.Play.powerUps.list));
        this.__powerUpsProperties = JSON.parse(JSON.stringify(this.__screensData.Play.powerUps.properties));
    } else {
        this.__powerUpsList = [];
        this.__powerUpsProperties = {};
    }
};

App.Game.prototype.__spawnHazards = function () {
    'use strict';

    /** wait for __waveDelay then start wave*/
    if (!this.__waveStarted) {
        this.__waveTime += this.__waveDelta;
        if (this.__waveTime >= this.__waveDelay) {
            this.__wave++;
            this.__waveStarted = true;
        }
    }

    /** if wave has started, wait for __hazards delay then spawn hazards */
    if (this.__waveStarted) {
        this.__hazardsTime += this.__hazardsDelta;
        if (this.__hazardsTime >= this.__hazardsDelay) {
            this.__hazardsCount++;
            this.__hazardsTime = 0;
            let randomHazard = this.rnd.pick(this.__hazardsList);
            let hazardProperties = this.__hazardsProperties[randomHazard.class];
            hazardProperties.texture = randomHazard.texture;
            hazardProperties.score = randomHazard.score;
            new this.__prefabClasses[randomHazard.class](this, randomHazard.texture, hazardProperties);
        }
    }

    /** if spawned hazards reaches __hazardsPerWave, prepare for next wave */
    if (this.__hazardsCount >= this.__hazardsPerWave) {
        this.__waveTime = 0;
        this.__waveStarted = false;
        this.__hazardsCount = 0;
        this.__hardenWave();
    }
};

App.Game.prototype.__spawnPowerUp = function (x, y) {
    'use strict';

    let randomPowerUpClass = this.rnd.pick(this.__powerUpsList);
    let randomPowerUpProperties = this.__powerUpsProperties[randomPowerUpClass];
    let dropRate = randomPowerUpProperties.dropRate;
    if (Phaser.Utils.chanceRoll(dropRate)) {
        randomPowerUpProperties.position = {x: x, y: y};
        new this.__prefabClasses[randomPowerUpClass](this, randomPowerUpClass, randomPowerUpProperties);
    }
};

App.Game.prototype.__hardenWave = function () {
    'use strict';

    /** increase hazards speed and rotation speed */
    Object.keys(this.__hazardsProperties).forEach(function (hazardClass) {
        if (this.__hazardsProperties[hazardClass].hasOwnProperty('speed')) {
            this.__hazardsProperties[hazardClass].speed++;
            this.__hazardsProperties[hazardClass].speed = Math.min(
                this.__hazardsProperties[hazardClass].speed,
                this.__hazardsProperties[hazardClass].maxSpeed
            )
        }
        if (this.__hazardsProperties[hazardClass].hasOwnProperty('rotationSpeed')) {
            this.__hazardsProperties[hazardClass].rotationSpeed++;
            this.__hazardsProperties[hazardClass].rotationSpeed = Math.min(
                this.__hazardsProperties[hazardClass].rotationSpeed,
                this.__hazardsProperties[hazardClass].maxRotationSpeed
            );
        }
    }, this);

    /** increase the number of hazards to spawn per wave */
    /** add new hazards type to spawn  */
    if (this.__wave % 3 === 0) {
        this.__hazardsPerWave += this.__hazardsIncreasePerWave;
        if (this.__hazardsDiversityIndex < this.__hazardsDiversity.length) {
            this.__hazardsList.push(this.__hazardsDiversity[this.__hazardsDiversityIndex]);
        }
        this.__hazardsDiversityIndex++;
    }

    /** hasten hazards spanw  */
    if (this.__wave % 5 === 0) {
        this.__hazardsDelta += this.__hazardsDeltaIncrease;
        this.__hazardsDelta = Math.min(this.__hazardsDelta, this.__hazardsDeltaMax);
    }
};

App.Game.prototype.__initPauseMenu = function () {
    'use strict';

    if (this.__currentScreen === 'Play') {
        this.__togglePauseMenu();
    }
    this.game.onPause.add(this.__togglePauseMenu, this);
    this.game.onResume.add(this.__togglePauseMenu, this);
};

App.Game.prototype.__togglePause = function () {
    'use strict';

    this.game.paused = !this.game.paused;
};

App.Game.prototype.__togglePauseMenu = function () {
    'use strict';

    this.__groups['PauseMenu'].forEach(function (pauseElement) {
        if (pauseElement.__name !== 'GUI:PauseBtn') {
            pauseElement.visible = !pauseElement.visible;
        }
    }, this);
};

App.Game.prototype.__playSoundEffect = function (key) {
    'use strict';

    if (this.__soundEffects[key].isPlaying) {
        this.__soundEffects[key].stop();
    }
    this.__soundEffects[key].play();
};

App.Game.prototype.__stopSoundEffect = function (key) {
    'use strict';

    if (this.__soundEffects[key].isPlaying) {
        this.__soundEffects[key].stop();
    }
};

App.Game.prototype.__initSoundtracks = function () {
    'use strict';

    this.__stopAllSoundtracks();

    this.__screensData['Shared'].sounds.forEach(function (sound) {
        if (this.__prefabClasses[sound.class]) {
            new this.__prefabClasses[sound.class](this, sound.name, sound.properties);
        }
    }, this);
};

App.Game.prototype.__playSoundtracks = function (screen) {
    'use strict';

    let isPlaying = false;
    if (this.__soundTracks[screen] && this.__soundTracks[screen].length) {
        this.__soundTracks[screen].forEach(function (track) {
            if (track.isPlaying) {
                isPlaying = true;
                this.__elapsed += this.time.physicsElapsed;
                if (track.totalDuration - this.__elapsed <= this.__fadeTime) {
                    track.fadeOut((track.totalDuration - this.__elapsed) * 1000);
                }
            }
        }, this);

        if (!isPlaying) {
            this.__soundTracksIndex++;
            if (this.__soundTracksIndex >= this.__soundTracks[screen].length) {
                this.__soundTracksIndex = 0;
            }
            this.__elapsed = 0;
            this.__soundTracks[screen][this.__soundTracksIndex].fadeIn(this.__fadeTime * 1000);
        }
    }

};

App.Game.prototype.__stopAllSoundtracks = function () {
    'use strict';

    Object.keys(this.__soundTracks).forEach(function (screenSoundtracks) {
        if (this.__soundTracks[screenSoundtracks].length) {
            this.__soundTracks[screenSoundtracks].forEach(function (track) {
                track.stop();
            }, this);
        }
        this.__soundTracks[screenSoundtracks] = [];
    }, this);

    this.__soundTracksIndex = -1;
    this.__elapsed = 0;
};

App.Game.prototype.__toggleFullScreen = function () {
    'use strict';

    if (!this.game.device.fullscreen) {
        return;
    }

    if (this.game.scale.isFullScreen) {
        this.game.scale.stopFullScreen();
        this.__prefabs['GUI:FullscreenBtn'].frame = 0;
    } else {
        this.game.scale.startFullScreen();
        this.__prefabs['GUI:FullscreenBtn'].frame = 1;
    }
};

App.Game.prototype.__toggleMute = function () {
    'use strict';

    this.sound.mute = !this.sound.mute;
    this.__prefabs['GUI:MuteBtn'].frame = this.sound.mute ? 0 : 1;
};

App.Game.prototype.__showLeaderboard = function() {
    'use strict';

    if(App.user.data) {
        this.__SwitchScreen('Leaderboard', false);
    } else {
        this.__SwitchScreen('SignInScreen', false);
    }
};

App.Game.prototype.__getUser = function() {
    'use strict';

    this.__toggleSyncMessage(true);
    axios.defaults.withCredentials = true;
    axios.get(App.authUrl, {withCredentials: true})
        .then(function(response) {
            App.user.data = response.data.data;
            this.__toggleLeaderboardBtn(true);
            this.__toggleSyncMessage(false);
        }.bind(this))
        .catch(function(error) {
            this.__toggleLeaderboardBtn(true);
            this.__toggleSyncMessage(false);
        }.bind(this));

};

App.Game.prototype.__toggleSyncMessage = function(toggle) {
    'use strict';

    this.__prefabs['Start:SyncMessage'].visible = toggle;
};

App.Game.prototype.__toggleLeaderboardBtn = function(toggle) {
    'use strict';

    this.__prefabs['GUI:LeaderboardBtn'].visible = toggle;
};

App.Game.prototype.__onScoreUpdate = function () {
    'use strict';

    this.__prefabs['GameOver:ContinueBtn'].visible = false;
    this.__prefabs['GameOver:ContinueBtnLabel'].visible = false;
    this.__prefabs['GameOver:RestartBtn'].visible = false;
    this.__prefabs['GameOver:RestartBtnLabel'].visible = false;
};

App.Game.prototype.__onScoreUpdated = function () {
    'use strict';

    if (this.__continues) {
        this.__prefabs['GameOver:ContinueBtn'].visible = true;
        this.__prefabs['GameOver:ContinueBtnLabel'].visible = true;
    }

    this.__prefabs['GameOver:RestartBtn'].visible = true;
    this.__prefabs['GameOver:RestartBtnLabel'].visible = true;
};

App.Game.prototype.__toggleHomeBtn = function(toggle) {
    'use strict';
    this.__prefabs['GUI:HomeBtn'].visible = toggle;
};

App.Game.prototype.__showForm = function() {
    'use strict';

    let canvas = document.querySelector('canvas');
    let formContainer = document.querySelector('#signin-container');

    formContainer.classList.remove('hidden');
    formContainer.classList.add('visible');

    let centerX = canvas.getBoundingClientRect().left + this.game.width / 2 - formContainer.getBoundingClientRect().width / 3.4;
    let centerY = canvas.getBoundingClientRect().top + this.game.height / 2 - formContainer.getBoundingClientRect().height / 2;

    formContainer.style.top = centerY + 'px';
    formContainer.style.left = centerX + 'px';
};

App.Game.prototype.__hideForm = function() {
    'use strict';

    let formContainer = document.querySelector('#signin-container');
    formContainer.style.top = '0px';
    formContainer.style.left = '0px';
    if(!formContainer.classList.contains('hidden')) {
        formContainer.classList.add('hidden');
        formContainer.classList.remove('visible');
    }
};

/** ******************************************************** */
App.Game.prototype.__testBtn = function () {
    'use strict';

    console.log(Array.from(arguments));


};
App.Game.prototype.__screenshot = function() {
    'use strict';

    // html2canvas(document.querySelector("canvas")).then(canvas => {
    //     let img = document.createElement('img');
    //     img.src = canvas.toDataURL()
    //     document.querySelector("#screenshots").appendChild(img);
    // });
};