var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 500 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);
var terrain;

function preload() {
  this.load.image('player', 'assets/sprites/player.png');
  this.load.image('otherPlayer', 'assets/sprites/enemy.png');
  this.load.image('star', 'assets/sprites/star.png');
  this.load.image('tiles', 'assets/maps/tilesheet.png');//,32,32);
  this.load.tilemapTiledJSON('map', 'assets/maps/map.json')
}

function create() {
  var self = this;
  this.socket = io();

  // add tile map and set collisions
  var map = self.make.tilemap({ key: 'map' });
  var tileset = map.addTilesetImage('tilesheet', 'tiles');
  var sky = map.createStaticLayer('sky', tileset, 0, 0);
  terrain = map.createStaticLayer('terrain', tileset, 0, 0);
  terrain.setCollisionByExclusion([-1]);

  // set bounds for camera and objects
  this.cameras.main.setBounds(0, 0, 32*map.width, 32*map.height);
  this.physics.world.setBounds(0, 0, 32*map.width, 32*map.height);

  this.otherPlayers = this.physics.add.group();

  // upon first connection, create all players
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });

  // upon new player entering
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  // upon disconnecting from game
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  // upon player movement
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  // upon initialization or capture of star
  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.star.setCollideWorldBounds(true);
    self.physics.add.collider(terrain, self.star);

    self.physics.add.overlap(self.player, self.star, function () {
      this.socket.emit('starCollected');
    }, null, self);
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  this.blueScoreText.setPosition(this.cameras.main.scrollX + 16, this.cameras.main.scrollY + 16);
  this.redScoreText.setPosition(this.cameras.main.scrollX + 584, this.cameras.main.scrollY + 16);

  if (this.player) {
    this.player.setVelocityX(0);
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-150);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(150);
    }

    // jump
    if (this.cursors.space.isDown) {
      this.player.setVelocityY(-300);
    }

    this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, rotation: this.player.rotation });
    }
}

function addPlayer(self, playerInfo) {
  self.player = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  if (playerInfo.team === 'blue') {
    self.player.setTint(0x0000ff);
  } else {
    self.player.setTint(0xff0000);
  }

  self.player.setCollideWorldBounds(true);
  self.player.setBounce(0.1);
  self.cameras.main.startFollow(self.player, false, 0.1, 0.1);
  self.physics.add.collider(terrain, self.player);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.physics.add.image(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(50, 50);
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
  self.physics.add.collider(terrain, otherPlayer);
}
