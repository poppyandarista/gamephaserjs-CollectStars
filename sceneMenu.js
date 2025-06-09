var sceneMenu = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
        Phaser.Scene.call(this, { key: 'sceneMenu' });
    },

    init() { },

    preload() {
        this.load.image('bg_start', 'assets/BGmenu.png');
        this.load.image('btn_play', 'assets/play.png');
        this.load.image('title_game', 'assets/Coin Hunter (1).png');
        this.load.audio('snd_ambience', 'assets/music_play.mp3');
        this.load.audio('snd_touch', 'assets/touch.mp3');
        this.load.image("ground", "assets/platforms.2.png");
        this.load.image("ground2", "assets/platforms.4.png");
        this.load.image("ground3", "assets/platforms.3.png");

        for (let i = 1; i <= 8; i++) {
            this.load.image(`run_girl${i}`, `assets/Run(${i}).png`);
        }
    },

    create: function () {
        var btnClicked = false;

        // Background music - store as scene property
        if (!this.snd_ambience) {
            this.snd_ambience = this.sound.add('snd_ambience');
            this.snd_ambience.loop = true;
            this.snd_ambience.setVolume(0.35);
            this.snd_ambience.play();
        }

        this.snd_touch = this.sound.add('snd_touch');

        // Tambah background
        this.add.image(1024 / 2, 768 / 2, 'bg_start');

        // Animasi untuk girl
        this.anims.create({
            key: 'girl_run',
            frames: [
                { key: 'run_girl1' }, { key: 'run_girl2' },
                { key: 'run_girl3' }, { key: 'run_girl4' },
                { key: 'run_girl5' }, { key: 'run_girl6' },
                { key: 'run_girl7' }, { key: 'run_girl8' }
            ],
            frameRate: 10,
            repeat: -1
        });

        // Tambah sprite girl di tengah layar
        this.girl = this.add.sprite(512, 645, 'run_girl1').setScale(0.25);
        this.girl.play('girl_run');
        this.girl.setDepth(5); 

        // Barisan bawah (beberapa ground2 berjajar)
        this.add.image(100, 740, 'ground2').setScale(0.2);
        this.add.image(300, 740, 'ground2').setScale(0.2);
        this.add.image(500, 740, 'ground2').setScale(0.2);
        this.add.image(700, 740, 'ground2').setScale(0.2);
        this.add.image(900, 740, 'ground2').setScale(0.2);
        this.add.image(1100, 740, 'ground2').setScale(0.2);

        // Kiri atas (platforms.3)
        this.add.image(10, 230, 'ground3').setScale(0.2);  // kiri atas
        this.add.image(160, 420, 'ground').setScale(0.2);  // bawahnya kiri

        // Kanan atas (platforms.4)
        this.add.image(1000, 340, 'ground').setScale(0.2);  // kanan atas
        this.add.image(880, 480, 'ground3').setScale(0.2);  // bawahnya kanan

        // Tambah tombol Play
        var btnPlay = this.add.image(1024 / 2, 768 / 2 + 65, 'btn_play');
        btnPlay.setDepth(10);
        btnPlay.setScale(0.005); // Ukuran tombol diperkecil 50%

        this.titleGame = this.add.image(1024 / 2, 768 / 2 - 150, 'title_game');
        this.titleGame.setDepth(15);
        this.titleGame.setScale(0.0002); // Ukuran judul diperkecil 60%
        this.titleGame.y -= 384;

        // Animasi masuk title game
        this.tweens.add({
            targets: this.titleGame,
            ease: 'Bounce.easeOut',
            duration: 750,
            delay: 250,
            y: 200
        });

        // Animasi tombol Play
        btnPlay.setScale(0);
        this.tweens.add({
            targets: btnPlay,
            ease: 'Back',
            duration: 500,
            delay: 750,
            scaleX: 0.2,
            scaleY: 0.2
        });

        this.titleGame.setScale(0);
        this.tweens.add({
            targets: this.titleGame,
            ease: 'Elastic',
            duration: 750,
            delay: 500,
            scaleX: 0.4,
            scaleY: 0.4
        });

        // Interaksi tombol Play
        this.input.on('gameobjectover', function (pointer, gameObject) {
            if (btnClicked) return;
            if (gameObject === btnPlay) {
                btnPlay.setTint(0x616161);
            }
        }, this);

        this.input.on('gameobjectout', function (pointer, gameObject) {
            if (btnClicked) return;
            if (gameObject === btnPlay) {
                btnPlay.setTint(0xffffff);
            }
        }, this);

        this.input.on('gameobjectdown', function (pointer, gameObject) {
            if (gameObject === btnPlay) {
                btnPlay.setTint(0x616161);
                btnClicked = true;
            }
        }, this);

        this.input.on('gameobjectup', function (pointer, gameObject) {
    if (gameObject === btnPlay) {
        btnPlay.setTint(0xffffff);
        this.snd_touch.play();
        // Langsung mulai scenePlay tanpa transisi
        this.scene.start('scenePlay');
    }
}, this);

        this.input.on('pointerup', function (pointer) {
            btnClicked = false;
        }, this);

        btnPlay.setInteractive();
    },

    update() { },
    shutdown: function() {
        // Hentikan suara saat scene dihancurkan
        if (this.snd_ambience && this.snd_ambience.isPlaying) {
            this.snd_ambience.stop();
        }
        
        // Hentikan juga sound effect jika perlu
        if (this.snd_touch && this.snd_touch.isPlaying) {
            this.snd_touch.stop();
        }
    }
});
