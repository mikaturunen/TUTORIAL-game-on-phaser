// phaserCreate the game object itself
var game = new Phaser.Game(
    800, 600,                       // 800 x 600 rebackgroundolution.
    Phaser.AUTO,                    // Allow Phaser to determine Canvas or WebGL
    "barkanoid",                    // The HTML element ID we will connect Phaser to.
    {                               // Functions (callbacks) for Phaser to call in
        preload: phaserPreload,     // in different states of its execution
        create: phaserCreate,
        update: phaserUpdate
    }
);

// Commonly it's not a good idea to pollute the JS global namespace but as it's
// just an example we try keeping it as simple as possible and just introduce
// the variables here

// Few game related variables that we'll leave undefined
var ball;
var paddle;
var tiles;
var livesText;
var introText;
var background;

var ballOnPaddle = true;
var lives = 3;
var score = 0;

var defaultTextOptions = {
    font: "20px Arial",
    align: "left",
    fill: "#ffffff"
};

var boldTextOptions = {
    font: "40px Arial",
    fill: "#ffffff",
    align: "center"
};

/**
 * Preload callback. Used to load all assets into Phaser.
 */
function phaserPreload() {
    // Loading the background abackground an image
    game.load.image("background", "/assets/background.jpg");
    // Loading the tiles
    game.load.image("tile0", "/assets/tile0.png");
    game.load.image("tile1", "/assets/tile1.png");
    game.load.image("tile2", "/assets/tile2.png");
    game.load.image("tile3", "/assets/tile3.png");
    game.load.image("tile4", "/assets/tile4.png");
    game.load.image("tile5", "/assets/tile5.png");
    // Loading the paddle and the ball
    game.load.image("paddle", "/assets/paddle.png");
    game.load.image("ball", "/assets/ball.png");
}

/**
 * Create callback. Used to create all game related objects, set states and other pre-game running
 * details.
 */
function phaserCreate() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // All walls collide except the bottom
    game.physics.arcade.checkCollision.down = false;
    // Using the in-game name to fetch the loaded asset for the Background object
    background = game.add.tileSprite(0, 0, 800, 600, "background");

    // Creating a tile group
    tiles = game.add.group();
    tiles.enableBody = true;
    tiles.physicsdBodyType = Phaser.Physics.ARCADE;
    // Creating N tiles into the tile group
    for (var y = 0; y < 4; y++) {
        for (var x = 0; x < 15; x++) {
            // Randomizing the tile sprite we load for the tile
            var randomTileNumber = Math.floor(Math.random() * 6);
            var tile = tiles.create(120 + (x * 36), 100 + (y * 52), "tile" + randomTileNumber);
            tile.body.bounce.set(1);
            tile.body.immovable = true;
        }
    }

    // Setup the player -- paddle
    paddle = game.add.sprite(game.world.centerX, 500, "paddle");
    paddle.anchor.setTo(0.5, 0.5);
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.body.collideWorldBounds = true;
    paddle.body.bounce.set(1);
    paddle.body.immovable = true;

    // phaserCreate the ball
    ball = game.add.sprite(game.world.centerX, paddle.y - 16, "ball");
    ball.anchor.set(0.5);
    ball.checkWorldBounds = true;
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);
    // When it goes out of bounds we'll call the function 'death'
    ball.events.onOutOfBounds.add(helpers.death, this);

    // Setup score text
    scoreText = game.add.text(32, 550, "score: 0", defaultTextOptions);
    livesText = game.add.text(680, 550, "lives: 3", defaultTextOptions);
    introText = game.add.text(game.world.centerX, 400, "- click to start -", boldTextOptions);
    introText.anchor.setTo(0.5, 0.5);
    game.input.onDown.add(helpers.release, this);
}

/**
 * Phaser Engines update loop that gets called every phaserUpdate.
 */
function phaserUpdate () {
    paddle.x = game.input.x;

    // Making sure the player does not move out of bounds
    if (paddle.x < 24) {
        paddle.x = 24;
    } else if (paddle.x > game.width - 24) {
        paddle.x = game.width - 24;
    }

    if (ballOnPaddle) {
        // Setting the ball on the paddle when player has it
        ball.body.x = paddle.x;
    } else {
        // Check collisions
        game.physics.arcade.collide(ball, paddle, helpers.ballCollideWithPaddle, null, this);
        game.physics.arcade.collide(ball, tiles, helpers.ballCollideWithTile, null, this);
    }
}

/**
 * Set of helper functions.
 */
var helpers = {
    /**
     * Releases ball from the paddle.
     */
    release: function() {
        if (ballOnPaddle) {
            ballOnPaddle = false;
            ball.body.velocity.y = -300;
            ball.body.velocity.x = -75;
            introText.visible = false;
        }
    },

    /**
     * Ball went out of bounds.
     */
    death: function() {
        lives--;
        livesText.text = "lives: " + lives;

        if (lives === 0) {
            helpers.gameOver();
        } else {
            ballOnPaddle = true;
            ball.reset(paddle.body.x + 16, paddle.y - 16);
        }
    },

    /**
     * Game over, all lives lost.
     */
    gameOver: function() {
        ball.body.velocity.setTo(0, 0);
        introText.text = "Game Over!";
        introText.visible = true;
    },

    /**
     * Callback for when ball collides with Tiles.
     */
    ballCollideWithTile: function(ball, tile) {
        tile.kill();

        score += 10;
        scoreText.text = "score: " + score;

        //  Are they any tiles left?
        if (tiles.countLiving() <= 0) {
            //  New level start
            score += 1000;
            scoreText.text = "score: " + score;
            introText.text = "- Next Level -";

            //  Attach ball to the players paddle
            ballOnPaddle = true;
            ball.body.velocity.set(0);
            ball.x = paddle.x + 16;
            ball.y = paddle.y - 16;

            // Tell tiles to revive
            tiles.callAll("revive");
        }

    },

    /**
     * Callback for when ball collides with the players paddle.
     */
     ballCollideWithPaddle: function(ball, paddle) {
         var diff = 0;

         // Super simplistic bounce physics for the ball movement
         if (ball.x < paddle.x) {
             //  Ball is on the left-hand side
             diff = paddle.x - ball.x;
             ball.body.velocity.x = (-10 * diff);
         } else if (ball.x > paddle.x) {
             //  Ball is on the right-hand side
             diff = ball.x -paddle.x;
             ball.body.velocity.x = (10 * diff);
         } else {
             //  Ball is perfectly in the middle
             //  Add a little random X to stop it bouncing straight up!
             ball.body.velocity.x = 2 + Math.random() * 8;
         }
     }
};
