var game = new Phaser.Game(16*32, 600, Phaser.AUTO, document.getElementById('game'));
game.state.add('Game',Game);
game.state.start('Game');
var Game = {};

Game.init = function() {
    game.stage.disableVisibilityChange= true;
};

Game.preload = function() {
    game.load.tilemap('map', 'assets/map/test_map.json', null, Phaser.Tilemap.TILED_JSON);
    //game.load.spritesheet('tileset', 'assets/map/tilesheet.png',32,32);
    //game.load.image('sprite','assets/sprites/sprite.png');
};

Game.create = function() {
    var map = game.add.tilemap('map');
    map.addTilesetImage('tilesheet', 'tileset');
    var layer;
    for(var i = 0; i < map.layers.length; i++) {
        layer = map.createLayer(i);
    }
    layer.inputEnabled = true;
};
