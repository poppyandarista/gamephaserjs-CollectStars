var scenePlay = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
        Phaser.Scene.call(this, { key: "scenePlay" });
        this.totalCoinsCollected = 0; 
    },

    preload: function () {
        this.load.image("background", "assets/BG1.png");
        this.load.image("btn_play", "assets/play.png");
        this.load.image("ground", "assets/platforms.2.png");
        this.load.image("ground2", "assets/platforms.4.png");
        this.load.image("ground3", "assets/platforms.3.png");
        this.load.image("gameOver", "assets/gameover.png");
        this.load.image("restart", "assets/Restart.png");
        this.load.image("missioncomplete", "assets/missioncomplete2.png");
        this.load.image("star", "assets/star.png");

        for (let i = 1; i <= 8; i++) {
            this.load.image(`run${i}`, `assets/Run(${i}).png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image(`jump${i}`, `assets/Jump(${i}).png`);
        }
        for (let i = 1; i <= 10; i++) {
            this.load.image(`dead${i}`, `assets/Dead(${i}).png`);
        }

        this.load.audio("snd_coin", "assets/collect-new.mp3");
        this.load.audio("snd_lose", "assets/lose-new.mp3");
        this.load.audio("snd_jump", "assets/jump-new.mp3");
        this.load.audio("snd_leveling", "assets/levelup-new.mp3");
        this.load.audio("music_play", "assets/music_play.mp3");
    },

    create: function () {
        // Initialize physics world
        this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);
        
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;
        
        this.isGameStarted = true;
        this.isPlayerDead = false;
        this.countCoin = 0;
        this.currentLevel = 1;

        this.sfx = {
            coin: this.sound.add('snd_coin'),
            lose: this.sound.add('snd_lose'),
            jump: this.sound.add('snd_jump'),
            levelup: this.sound.add('snd_leveling'),
        };
        
        this.music = this.sound.add('music_play', { loop: true });
        this.music.play({ seek: 5 });

        let bg = this.add.image(0, 0, 'background').setOrigin(0);
        let scaleX = gameWidth / bg.width;
        let scaleY = gameHeight / bg.height;
        let finalScale = Math.max(scaleX, scaleY);
        bg.setScale(finalScale).setScrollFactor(0);

        // === CREATE SCORE TEXT WITH GRADIENT ===
        const tempText = this.add.text(0, 0, '', {
            fontSize: '48px',
            fontFamily: 'Fredoka'
        });
        const ctx = tempText.canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 70);
        gradient.addColorStop(0, '#FFA500'); // orange
        gradient.addColorStop(1, '#FF0000'); // red
        tempText.destroy(); // don't need to display this

        // Main score text
        this.coinText = this.add.text(16, 16, 'SCORE: 0', {
            fontSize: '48px',
            fontFamily: 'Fredoka',
            fill: gradient,
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 2,
                fill: true
            }
        }).setDepth(11);

        // Create level indicator at the bottom
        this.levelIndicator = this.add.text(centerX, gameHeight - 20, 'Level 1', {
            fontFamily: 'Verdana, Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(11);
        this.levelIndicator.setStroke('#000000', 4);
        this.levelIndicator.setShadow(2, 2, "#333333", 2, true, true);
        
        this.platforms = this.physics.add.staticGroup();
        this.defaultPlatformScale = 0.22;
        this.smallPlatformScale = 0.18;

        // Create base platforms first
        for (let i = -4; i <= 4; i++) {
            let ground = this.platforms.create(centerX + i * 130, gameHeight - 32, 'ground');
            ground.setScale(this.defaultPlatformScale).refreshBody();
        }

        this.player = this.physics.add.sprite(100, 500, 'run1').setScale(0.22).setDepth(5);
        this.player.setGravityY(600);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);

        this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.6);
        this.player.body.setOffset(this.player.width * 0.25, this.player.height * 0.3);

        this.createAnimations();

        this.coins = this.physics.add.group();

        this.canDoubleJump = false;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.currentLevel = 1;

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        this.prepareWorld();
    },


    createAnimations: function () {
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'run1' }, { key: 'run2' }, { key: 'run3' }, { key: 'run4' },
                { key: 'run5' }, { key: 'run6' }, { key: 'run7' }, { key: 'run8' }
            ],
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'run1' }],
            frameRate: 1
        });

        this.anims.create({
            key: 'jump',
            frames: [
                { key: 'jump1' }, { key: 'jump2' }, { key: 'jump3' }, { key: 'jump4' },
                { key: 'jump5' }, { key: 'jump6' }, { key: 'jump7' }, { key: 'jump8' },
                { key: 'jump9' }, { key: 'jump10' }
            ],
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'dead',
            frames: [
                { key: 'dead1' }, { key: 'dead2' }, { key: 'dead3' }, { key: 'dead4' },
                { key: 'dead5' }, { key: 'dead6' }, { key: 'dead7' }, { key: 'dead8' },
                { key: 'dead9' }, { key: 'dead10' }
            ],
            frameRate: 12,
            repeat: 0
        });
    },

    prepareWorld: function () {
        this.platforms.clear(true, true);
        this.platforms = this.physics.add.staticGroup();
        
        const centerX = this.cameras.main.centerX;
        const gameHeight = this.sys.game.config.height;
    
        let platformScale = this.defaultPlatformScale;
        let platformKey = 'ground';
    
        if (this.currentLevel >= 3 && this.currentLevel <= 4) {
            platformKey = 'ground2';
        } else if (this.currentLevel >= 5) {
            platformKey = 'ground3';
        }
    
        if (this.currentLevel === 2) {
            platformScale = this.smallPlatformScale;
        }
    
        // Base platforms
        for (let i = -4; i <= 4; i++) {
            let ground = this.platforms.create(centerX + i * 130, gameHeight - 32, platformKey);
            ground.setScale(platformScale).refreshBody();
        }
    
        // Additional platforms based on level
        if (this.currentLevel === 1) {
            this.platforms.create(100, 344, platformKey).setScale(this.defaultPlatformScale).refreshBody();
            this.platforms.create(500, 560, platformKey).setScale(this.defaultPlatformScale).refreshBody();
            this.platforms.create(750, 360, platformKey).setScale(this.defaultPlatformScale).refreshBody();
            this.platforms.create(920, 200, platformKey).setScale(this.defaultPlatformScale).refreshBody();
        } else if (this.currentLevel === 2) {
            this.platforms.create(100, 380, platformKey).setScale(this.defaultPlatformScale).refreshBody();
            this.platforms.create(470, 220, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(400, 460, platformKey).setScale(this.defaultPlatformScale).refreshBody();
            this.platforms.create(740, 590, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(940, 320, platformKey).setScale(this.smallPlatformScale).refreshBody();
        } else if (this.currentLevel >= 3 && this.currentLevel <= 5) {
            this.platforms.create(40, 200, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(170, 200, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(200, 400, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(580, 300, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(430, 600, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(990, 220, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(940, 400, platformKey).setScale(this.smallPlatformScale).refreshBody();
            this.platforms.create(730, 560, platformKey).setScale(this.smallPlatformScale).refreshBody();
        }
        
        if (this.currentLevel > 2) {
            this.player.setPosition(50, 300);
        } else {
            this.player.setPosition(100, 500);
        }
    
        this.physics.add.collider(this.player, this.platforms);
        this.spawnCoins();
        
        // Update level indicator
        this.levelIndicator.setText('Level ' + this.currentLevel);
        
        // Reset input to prevent stuck keys
        this.input.keyboard.resetKeys();
    },

    handlePlayerDeath: function() {
        if (this.isPlayerDead) return;
        this.isPlayerDead = true;

        this.player.setVelocity(0, 0);
        this.player.body.enable = false;
        
        this.coins.children.iterate(coin => {
            coin.body.enable = false;
        });

        this.sfx.lose.play();
        this.player.anims.play('dead');
        
        this.player.once('animationcomplete', () => {
            this.showGameOverScreen();
        });
    },

    spawnCoins: function () {
        this.coins.clear(true, true);
    
        let positions = [];
    
        if (this.currentLevel === 1) {
            positions = [
                { x: 50, y: 290 }, { x: 150, y: 290 },
                { x: 700, y: 300 }, { x: 780, y: 300 },
                { x: 500, y: 500 }, { x: 580, y: 500 },
                { x: 880, y: 140 }, { x: 980, y: 140 },
                { x: 400, y: 680 }, { x: 950, y: 680 },
            ];
        } else if (this.currentLevel === 2) {
            positions = [
                { x: 100, y: 320 }, 
                { x: 430, y: 170 }, { x: 500, y: 170 }, 
                { x: 350, y: 400 }, { x: 420, y: 400 },
                { x: 710, y: 550 }, { x: 790, y: 550 },
                { x: 890, y: 500 }, 
                { x: 970, y: 260 },
                { x: 780, y: 680 },
            ];
        } else if (this.currentLevel >= 3) {
            positions = [
                { x: 50, y: 150 }, { x: 120, y: 150 }, { x: 200, y: 150 },
                { x: 170, y: 350 }, { x: 240, y: 350 },
                { x: 530, y: 250 }, { x: 590, y: 250 },
                { x: 950, y: 160 },
                { x: 990, y: 350 },
                { x: 720, y: 510 },
            ];
        }        
    
        positions.forEach(pos => {
            let startY = pos.y - 300;
            let coin = this.coins.create(pos.x, startY, 'star');
            coin.setScale(0.1);
            coin.body.allowGravity = false;
        
            let bounceDelay = Phaser.Math.Between(0, 600);
        
            this.tweens.add({
                targets: coin,
                y: pos.y -30,
                ease: 'Bounce.easeOut',
                duration: 1000,
                delay: bounceDelay,
                onComplete: () => {
                    this.tweens.add({
                        targets: coin,
                        y: pos.y - 10,
                        duration: Phaser.Math.Between(600, 1000),
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        delay: Phaser.Math.Between(0, 200)
                    });
                }
            });
        });
    
        this.totalCoins = positions.length;
        this.countCoin = 0;
        this.coinText.setText(this.totalCoinsCollected);
    },

    collectCoin: function (player, coin) {
        this.sfx.coin.play();
        this.countCoin++;
        this.totalCoinsCollected++;
        this.coinText.setText('SCORE: ' + this.totalCoinsCollected); // Changed to use SCORE: prefix
        coin.disableBody(true, true);
        this.createCoinParticles(coin.x, coin.y);
    
        if (this.countCoin >= this.totalCoins) {
            this.levelUp();
        }
    },

    createCoinParticles: function (x, y) {
        for (let i = 0; i < 10; i++) {
            let sparkle = this.add.image(x, y, 'star').setScale(0.1);
            this.tweens.add({
                targets: sparkle,
                x: x + Phaser.Math.Between(-30, 30),
                y: y + Phaser.Math.Between(-30, 30),
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => sparkle.destroy()
            });
        }
    },

    levelUp: function () {
    this.sfx.levelup.play();
    
    // Jika sudah mencapai level 6, tampilkan layar mission complete
    if (this.currentLevel >= 5) {
        this.showMissionCompleteScreen();
    } else {
        this.currentLevel++;
        this.prepareWorld();
    }
},

// In the showMissionCompleteScreen function, add this at the beginning:
showMissionCompleteScreen: function() {
    // Stop player movement and animation
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.player.body.enable = false; // Disable physics
    
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.isPlayerDead = true; // Set flag agar player tidak bisa bergerak

    const overlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.6)
        .setDepth(50)
        .setAlpha(0);

    const missionCompleteImage = this.add.image(centerX, centerY - 40, 'missioncomplete')
        .setScale(0.5)
        .setOrigin(0.5)
        .setDepth(51)
        .setAlpha(0);

    const restartButton = this.add.image(centerX, centerY + 160, 'restart')
        .setScale(0.3)
        .setOrigin(0.5)
        .setDepth(51)
        .setAlpha(0)
        .setInteractive();

    const coinsText = this.add.text(centerX, centerY + 10, 
        'Total Coins: ' + this.totalCoinsCollected, {
            fontSize: '24px',
            fill: '#ffffff'
        })
        .setOrigin(0.5)
        .setDepth(51)
        .setAlpha(0);
        
    this.tweens.add({
        targets: coinsText,
        alpha: 1,
        duration: 800,
        delay: 300
    });

    this.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: 500
    });
    
    this.tweens.add({
        targets: missionCompleteImage,
        alpha: 1,
        duration: 800,
        delay: 200
    });
    
    this.tweens.add({
        targets: restartButton,
        alpha: 1,
        duration: 800,
        delay: 400
    });

    restartButton.on('pointerdown', () => {
        restartButton.setTint(0x999999);
    });

    restartButton.on('pointerup', () => {
        restartButton.clearTint();
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.totalCoinsCollected = 0;
        this.currentLevel = 1;
        this.isPlayerDead = false;
        this.player.body.enable = true; // Re-enable physics
        this.scene.restart();
    });

    restartButton.on('pointerout', () => {
        restartButton.clearTint();
    });
},

    showGameOverScreen: function() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
    
        const overlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setDepth(50)
            .setAlpha(0);
    
        const gameOverImage = this.add.image(centerX, centerY - 40, 'gameOver')
            .setScale(0.5)
            .setOrigin(0.5)
            .setDepth(51)
            .setAlpha(0);
    
        const restartButton = this.add.image(centerX, centerY + 110, 'restart')
            .setScale(0.3)
            .setOrigin(0.5)
            .setDepth(51)
            .setAlpha(0)
            .setInteractive();

        const coinsText = this.add.text(centerX, centerY + 50, 
            'Total Coins: ' + this.totalCoinsCollected, {
                fontSize: '24px',
                fill: '#ffffff'
            })
            .setOrigin(0.5)
            .setDepth(51)
            .setAlpha(0);
            
        this.tweens.add({
            targets: coinsText,
            alpha: 1,
            duration: 800,
            delay: 300
        });
    
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 500
        });
        
        this.tweens.add({
            targets: gameOverImage,
            alpha: 1,
            duration: 800,
            delay: 200
        });
        
        this.tweens.add({
            targets: restartButton,
            alpha: 1,
            duration: 800,
            delay: 400
        });
    
        restartButton.on('pointerdown', () => {
            restartButton.setTint(0x999999);
        });
    
        restartButton.on('pointerup', () => {
            restartButton.clearTint();
            if (this.music && this.music.isPlaying) {
                this.music.stop();
            }
            this.totalCoinsCollected = 0;
            this.currentLevel = 1;
            this.isPlayerDead = false;
            this.isGameStarted = false;
            this.scene.restart();
        });
    
        restartButton.on('pointerout', () => {
            restartButton.clearTint();
        });
    },
    
    update: function () {
        if (!this.player || !this.cursors || this.isPlayerDead) return;
    
        if (!this.isGameStarted) {
            this.player.setVelocityX(0);
            return;
        }
    
        const speed = 160;
        const jumpStrength = 450;
    
        this.player.setVelocityX(0);
    
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            if (this.player.body.touching.down) this.player.anims.play('walk', true);
            this.player.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            if (this.player.body.touching.down) this.player.anims.play('walk', true);
            this.player.setFlipX(false);
        } else {
            if (this.player.body.touching.down) this.player.anims.play('idle', true);
        }
    
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (this.player.body.touching.down) {
                this.player.setVelocityY(-jumpStrength);
                this.canDoubleJump = true;
                this.player.anims.play('jump', true);
                this.sfx.jump.play();
            } else if (this.canDoubleJump) {
                this.player.setVelocityY(-jumpStrength);
                this.canDoubleJump = false;
                this.player.anims.play('jump', true);
                this.sfx.jump.play();
            }
        }
    
        if (!this.player.body.touching.down && this.player.body.velocity.y !== 0) {
            this.player.anims.play('jump', true);
        }
    }
});