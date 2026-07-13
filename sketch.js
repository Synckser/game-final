// GameZ FINALE Coding By Roberto Pires Almeida starts here.
// I had lots of fun doing it and spent countless hours perfecting it.

// Global Variables
var gameCharWorldX;    // Character's world position
var gameCharWorldY;    // Character's world position
var floorPosY;         // Where the ground is
var treesX;            // Where trees go
var treesY;            // How tall trees are
var isLeft;            // Moving left
var isRight;           // Moving right
var isFalling;         // Falling
var isPlummeting;      // Falling into a canyon
var isFlying = false;  // Chick flying?
var wingFlap = 0;      // For wing animation
var collectables;      // Corn to collect
var canyons;           // Death pits
var cloudsX;           // Cloud positions
var cloudsY;           // How high clouds float
var cloudsSize;        // Cloud sizes
var mountainsPosX;     // Where mountains sit
var mountainsSize;     // How big mountains are
var cameraPosX = 0;    // Camera position
var charSpeed;         // Chicken speed
var gravityNormal;     // Regular falling speed
var gravityCanyon;     // Canyon falling speed
var jumpStrength;      // How high chicken jumps
var flowers;           // Just for looks
var isGameOver = false;// Dead chicken?
var sunX;              // Sun's position (x)
var sunY;              // Sun's position (y)
var glowPulse;         // Sun's glow effect
var gameScore = 0;     // How many corns
var flagpole;          // The finish line
var lives;             // Number of tries
var levelComplete = false; // Won the level
var flagpoleReachedTime = 0; // When did I win
var jumpSound;         // Jump noise
var eatSound;          // Eating corn sound
var themeSound;        // Background music
var deadSound;         // Death sound
var flagSound;         // Victory sound
var flyingSound;       // Flying noise
var platforms;         // Stuff to jump on
var enemies;           // Butchers trying to get me
var grassBlades;       // Grass that moves when I walk
var lastCharX;         // Where chicken was before

// --- Setup Functions ---
function preload() {
    soundFormats('mp3','wav');
    jumpSound = loadSound('assets/jump.wav');
    jumpSound.setVolume(0.1);
    eatSound = loadSound('assets/eat.wav');
    eatSound.setVolume(0.2);
    themeSound = loadSound('assets/theme.wav');
    themeSound.setVolume(0.01); // Lowered this cuz my wife complained lol ;)
    deadSound = loadSound('assets/dead.wav');
    deadSound.setVolume(0.3);
    flagSound = loadSound('assets/flag.wav');
    flagSound.setVolume(0.2);
    flyingSound = loadSound('assets/flying.wav');
    flyingSound.setVolume(0.15);
}

function setup() {
    createCanvas(1024, 576); // Perfect size for my laptop
    floorPosY = height * 3 / 4;
    lives = 3; // Three tries, be careful!
    startGame();
    setupTouchControls();
}

function startGame() {
    gameCharWorldX = 30; // Start at the left in world coordinates
    gameCharWorldY = floorPosY;
    cameraPosX = 0;
    lastCharX = gameCharWorldX;

    // Create trees in random positions
    treesX = [-25, 300, 500, 700, 900];
    treesY = treesX.map(() => floorPosY - 100);

    // Add some clouds for scenery
    cloudsX = [100, 300, 500, 700, 900, 200, 600];
    cloudsY = [100, 120, 80, 140, 110, 60, 160];
    cloudsSize = [70, 90, 60, 100, 80, 50, 75];

    // Mountains in background
    mountainsPosX = [200, 400, 600, 800, 1000];
    mountainsSize = 150;

    // Death canyons - don't fall in it 
    canyons = [
        { x_pos: 50, width: 80 },
        { x_pos: 350, width: 120 },
        { x_pos: 600, width: 60 },
        { x_pos: 800, width: 100 },
        { x_pos: 1050, width: 90 },
        { x_pos: 1300, width: 220 } // Last canyon made wider
    ];

    // Make grass that moves when I walk around - took forever to get right!
    makeGrass();

    // Platforms for parkour
    platforms = [];
    platforms.push(createPlatforms(180, floorPosY - 65, 100));
    platforms.push(createPlatforms(400, floorPosY - 50, 150));
    platforms.push(createPlatforms(520, floorPosY - 120, 80));
    platforms.push(createPlatforms(600, floorPosY - 180, 80));
    platforms.push(createPlatforms(600, 160, 80)); // This one was tricky to place
    platforms.push(createPlatforms(820, floorPosY - 120, 80));
    platforms.push(createPlatforms(900, floorPosY - 180, 80));
    platforms.push(createPlatforms(900, 160, 80));
    // Add moving platform over last canyon
    platforms.push(createMovingPlatform(1350, floorPosY - 60, 100, 2));

    // make collectables
    if (collectables === undefined || collectables.length === 0) {
        createCollectables();
    }

    // Physics - tweaked until it felt right
    charSpeed = 6;
    gravityNormal = 3;      
    gravityCanyon = 8;      
    jumpStrength = 180; // Much higher jump

    // Reset all flags
    isLeft = false;
    isRight = false;
    isFalling = false;
    isPlummeting = false;
    isGameOver = false;

    // Pretty flowers
    createFlowers();

    // Finish line
    flagpole = {
        x_pos: 2300,
        isReached: false
    };
    
    // Start music
    if (!themeSound.isPlaying()) {
        themeSound.loop();
    }

    // Enemies butchers hate's chickens
    enemies = [];
    enemies.push(new Enemy(250, floorPosY, 60));   
    enemies.push(new Enemy(500, floorPosY, 60));   // Reduced to avoid walking over canyon
    enemies.push(new Enemy(915, floorPosY, 80));   
    // Move big boss enemy closer to last canyon
    var lastCanyon = canyons[canyons.length - 1];
    enemies.push(new BossEnemy(lastCanyon.x_pos + 550, floorPosY, 100));
}

// Create corn to collect
function createCollectables() {
    collectables = [];
    
    // Between canyons
    addCollectable(180, floorPosY - 40);
    addCollectable(280, floorPosY - 40);
    addCollectable(520, floorPosY - 40);
    addCollectable(720, floorPosY - 40);
    addCollectable(950, floorPosY - 40);
    addCollectable(1220, floorPosY - 40);
    
    // More corn everywhere
    addCollectable(150, floorPosY - 30);
    addCollectable(320, floorPosY - 50);
    addCollectable(480, floorPosY - 35);
    addCollectable(680, floorPosY - 45);
    addCollectable(880, floorPosY - 40);
    addCollectable(1180, floorPosY - 35);
    addCollectable(1480, floorPosY - 40);
    addCollectable(1580, floorPosY - 30);
    addCollectable(1680, floorPosY - 45);
    addCollectable(1780, floorPosY - 35);
    addCollectable(1880, floorPosY - 40);
    addCollectable(1980, floorPosY - 30);
    addCollectable(2080, floorPosY - 45);
    addCollectable(2180, floorPosY - 40);

    // Hard to reach corn
    addCollectable(600, 120); // This one took forever to position right
    addCollectable(900, 80);  // Almost impossible to get!
}

// Helper to add one corn
var addCollectable = (x, y) => {
    collectables.push({
        x_pos: x,
        y_pos: y,
        size: 50,
        isFound: false
    });
};

// Create random flowers
var createFlowers = () => {
    flowers = [];
    for (var i = 0; i < 40; i++) {
        flowers.push({
            x: random(width * 3),
            y: floorPosY + random(10, 60),
            petal: color(random(200, 255), random(100, 255), random(100, 255)),
            center: color(255, 220, 60)
        });
    }
}

// Make grass everywhere except over death holes
function makeGrass() {
    grassBlades = [];
    // Goes way left and right so there's always grass
    for (var x = -500; x < 2500; x += 8) {
        // Don't put grass over canyons - that would be weird
        var overCanyon = false;
        for (var c = 0; c < canyons.length; c++) {
            if (x >= canyons[c].x_pos && x <= canyons[c].x_pos + canyons[c].width) {
                overCanyon = true;
                break;
            }
        }
        
        // Only make grass if there's ground
        if (overCanyon == false) {
            for (var i = 0; i < 3; i++) {
                grassBlades.push({
                    x: x + random(-3, 3),
                    height: random(8, 16),
                    bend: 0,       // How much it's bent
                    grass_color: color(30 + random(20, 40), 140 + random(-20, 30), 40 + random(-10, 20))
                });
            }
        }
    }
}

// Check if player died
function checkPlayerDie() {
    if (gameCharWorldY > height + 50) {
        lives -= 1;
        if (deadSound && deadSound.isLoaded()) deadSound.play();
        
        if (lives > 0) {
            startGame(); 
        } else {
            isGameOver = true; // Game over !!!!
        }
    }
}

// Main drawing loop
function draw() {
    var touchRestartEl = document.getElementById('touch-restart');
    if (touchRestartEl) {
        touchRestartEl.style.display = (isGameOver || levelComplete) ? 'block' : 'none';
    }

    if (isGameOver) {
        displayGameOver();
        return;
    }

    if (flagpole.isReached && frameCount > flagpoleReachedTime + 120) {
        displayLevelComplete();
        return;
    }

    // Chick flying mechanic
    if (isFlying) {
        // Flap wings
        wingFlap += 0.3 + random(0.05, 0.15);
        // Move up gently, but not forever
        if (gameCharWorldY > 80) {
            gameCharWorldY -= 6;
        }
        // Drift left/right if holding keys
        if (isLeft) gameCharWorldX -= 5;
        if (isRight) gameCharWorldX += 5;
    } else {
        // Apply gravity
        handleGravity();
    }

    // Make camera follow player with boundary
    cameraPosX = max(-300, gameCharWorldX - width / 2);

    // Basic background stuff
    drawBackground();
    drawScoreBoard();
    drawLives();
    drawFlowers();

    // Update grass based on character movement
    moveGrass();

    // Move everything relative to camera
    push();
    translate(-cameraPosX, 0);

    // Background elements
    drawClouds();
    drawMountains();
    drawSun();
    drawTrees();
    drawGrass();

    // Draw all platforms
    for (var i = 0; i < platforms.length; i++) {
        if (platforms[i].update) platforms[i].update(); // Only for moving platforms
        platforms[i].draw();
    }

    // Game elements
    renderFlagpole();
    drawCanyonsAndCollectables();

    // Move character based on keys (not while flying)
    if (!isFlying) moveCharacter();
    
    // Check if dead
    if (isPlummeting) {
        checkPlayerDie();
    }

    // Draw character
    drawGameChar();

    // Enemy stuff
    for(var i = 0; i < enemies.length; i++) {
        if (enemies[i] instanceof BossEnemy) {
            enemies[i].draw(gameCharWorldX);
        } else {
            enemies[i].draw();
        }
        var isContact = enemies[i].checkContact(gameCharWorldX, gameCharWorldY);
        if (isContact) {
            lives -= 1;
            if (deadSound && deadSound.isLoaded()) deadSound.play();
            if (lives > 0) {
                startGame(); // Restart game
            } else {
                isGameOver = true; // Only game over if no lives left
            }
            break;
        }
    }

    pop();

    // Check if reached flagpole
    if (!flagpole.isReached) {
        checkFlagpole();
    }
}

// Game over screen
function displayGameOver() {
    background(0, 0, 0, 200);
    
    fill(255, 0, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("Game Over!", width / 2, height / 2 - 40);
    
    fill(255);
    textSize(32);
    text("Press R to Restart", width / 2, height / 2 + 30);
    
    textSize(28);
    fill(255, 255, 0);
    text("Score: " + gameScore, width / 2, height / 2 + 80);
}

// Level complete screen
function displayLevelComplete() {
    levelComplete = true;
    
    background(0, 0, 100, 150);
    
    fill(0, 255, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("Level Complete!", width / 2, height / 2 - 40);
    
    fill(255);
    textSize(32);
    text("Press R to Play Again", width / 2, height / 2 + 30);
    
    textSize(28);
    fill(255, 255, 0);
    text("Score: " + gameScore, width / 2, height / 2 + 80);
}

// Gravity and falling physics
function handleGravity() {
    if (isPlummeting) {
        // Falling in canyon - faster gravity
        gameCharWorldY += gravityCanyon;
        isFalling = true;
    } else {
        // Check if on platform
        var isContact = false;
        for(var i = 0; i < platforms.length; i++) {
            if (platforms[i].checkContact(gameCharWorldX, gameCharWorldY)) {
                isContact = true;
                break;
            }
        }
        
        if (isContact == false) {
            // Not on platform, check if on ground
            if (gameCharWorldY < floorPosY) {
                gameCharWorldY += gravityNormal;
                isFalling = true;
            } else {
                gameCharWorldY = floorPosY;
                isFalling = false;
            }
        } else {
            // On platform, stop falling
            isFalling = false;
        }
    }
}

// Draw sky and ground
function drawBackground() {
    background(64, 224, 208); // Blue-turquoise sky (Turkish blue)
    // Draw green grass with gradient
    noStroke();
    for (var y = floorPosY; y < height; y++) {
        var t = (y - floorPosY) / (height - floorPosY);
        var r = 30 + t * 40;
        var g = 120 + t * 80;
        var b = 30 + t * 25;
        fill(r, g, b);
        rect(0, y, width, 1);
    }
    // Draw grass blades, skip first and last canyon
    var bladeColor = color(40, 160, 50);
    var bladeHeight = 14;
    var firstCanyon = canyons[0];
    var lastCanyon = canyons[canyons.length - 1];
    for (var y = floorPosY; y < height; y += 7) {
        for (var x = 0; x < width; x += 6) {
            var worldX = x + cameraPosX;
            var overFirst = worldX >= firstCanyon.x_pos && worldX <= firstCanyon.x_pos + firstCanyon.width;
            var overLast = worldX >= lastCanyon.x_pos && worldX <= lastCanyon.x_pos + lastCanyon.width;
            if (!overFirst && !overLast) {
                stroke(bladeColor);
                line(x, y + 2, x, y - bladeHeight);
            }
        }
    }
    noStroke();
}

// Show score in top left
function drawScoreBoard() {
    push();
    noStroke();
    fill(0, 0, 0, 120);
    rect(14, 14, 80, 26, 8);
    
    fill(255, 255, 0);
    textSize(14);
    textAlign(LEFT, TOP);
    text("Score: " + gameScore, 24, 20);
    pop();
}

// Draw life counters as little chicks
function drawLives() {
    push();
    for (var i = 0; i < lives; i++) {
        // Chick face for each life
        fill(255, 230, 50);
        ellipse(width - 30 - (i * 30), 28, 20, 20);
        
        fill(255, 150, 0);
        triangle(
            width - 35 - (i * 30), 28,
            width - 25 - (i * 30), 28,
            width - 30 - (i * 30), 32
        );
        
        fill(0);
        ellipse(width - 33 - (i * 30), 25, 3, 3);
        ellipse(width - 27 - (i * 30), 25, 3, 3);
    }
    pop();
}

// Make grass bend when I walk through it
function moveGrass() {
    var charMoved = false;
    if (abs(gameCharWorldX - lastCharX) > 3) {
        charMoved = true;
    }
    for (var i = 0; i < grassBlades.length; i++) {
        var grass = grassBlades[i];
        var dist = abs(grass.x - gameCharWorldX);
        // Only bend if chick moved and is close to blade
        if (charMoved && dist < 25 && gameCharWorldY >= floorPosY - 5) {
            if (gameCharWorldX > lastCharX) {
                grass.bend = 4;
            } else {
                grass.bend = -4;
            }
        } else {
            // Instantly snap back to straight
            grass.bend = 0;
        }
    }
    lastCharX = gameCharWorldX;
}

// Draw the grass
function drawGrass() {
    strokeWeight(1.5);
    for (var i = 0; i < grassBlades.length; i++) {
        var grass = grassBlades[i];
        // Only draw grass I can see
        if (grass.x > cameraPosX - 50 && grass.x < cameraPosX + width + 50) {
            stroke(grass.grass_color);
            var bottom_x = grass.x;
            var bottom_y = floorPosY + 2;
            var top_x = bottom_x + grass.bend;
            var top_y = bottom_y - grass.height;
            line(bottom_x, bottom_y, top_x, top_y);
        }
    }
    noStroke();
}

// Draw sky and ground
function drawBackground() {
    background(64, 224, 208); // Blue turquoise
    // Green grass gradient
    noStroke();
    for (var y = floorPosY; y < height; y++) {
        var t = (y - floorPosY) / (height - floorPosY);
        var r = 30 + t * 40;
        var g = 120 + t * 80;
        var b = 30 + t * 25;
        fill(r, g, b);
        rect(0, y, width, 1);
    }
    // Draw grass blades, skip first and last canyon
    var bladeColor = color(40, 160, 50);
    var bladeHeight = 14;
    var firstCanyon = canyons[0];
    var lastCanyon = canyons[canyons.length - 1];
    for (var y = floorPosY; y < height; y += 7) {
        for (var x = 0; x < width; x += 6) {
            var worldX = x + cameraPosX;
            var overFirst = worldX >= firstCanyon.x_pos && worldX <= firstCanyon.x_pos + firstCanyon.width;
            var overLast = worldX >= lastCanyon.x_pos && worldX <= lastCanyon.x_pos + lastCanyon.width;
            if (!overFirst && !overLast) {
                stroke(bladeColor);
                line(x, y + 2, x, y - bladeHeight);
            }
        }
    }
    noStroke();
}

// Draw decorative flowers
function drawFlowers() {
    for (var i = 0; i < flowers.length; i++) {
        var f = flowers[i];
        
        fill(f.petal);
        ellipse(f.x - cameraPosX, f.y, 6, 12);
        ellipse(f.x - cameraPosX, f.y, 12, 6);
        
        push();
        translate(f.x - cameraPosX, f.y);
        rotate(PI / 4);
        ellipse(0, 0, 6, 12);
        ellipse(0, 0, 12, 6);
        pop();
        
        fill(f.center);
        ellipse(f.x - cameraPosX, f.y, 5, 5);
    }
}

// parallax clouds at different heights
function drawClouds() {
    // Cover game world
    for (var gx = -500; gx < 4000; gx += 120) {
        // Vary heights for each cloud
        for (var i = 0; i < 3; i++) {
            var gy = 60 + i * 60 + ((gx / 120 + i) % 2) * 30; // Stagger heights
            var size = 80 - i * 15;
            fill(255, 255, 255, 160 - i * 40);
            noStroke();
            ellipse(gx - cameraPosX, gy, size, size * 0.7);
            ellipse(gx + 30 - cameraPosX, gy + 10, size * 0.6, size * 0.4);
            ellipse(gx - 30 - cameraPosX, gy + 8, size * 0.5, size * 0.3);
        }
    }
}

// Draw mountains
function drawMountains() {
    for (var i = 0; i < mountainsPosX.length; i++) {
        var x = mountainsPosX[i];
        var mSize = mountainsSize;
        
        // Main mountain shape
        fill(194, 178, 128);
        triangle(
            x, floorPosY, 
            x + mSize, floorPosY - mSize, 
            x + mSize * 2, floorPosY
        );

        // Left shadow
        fill(169, 147, 117);
        triangle(
            x, floorPosY, 
            x + mSize, floorPosY - mSize, 
            x + mSize, floorPosY
        );

        // Right highlight
        fill(216, 191, 160);
        triangle(
            x + mSize, floorPosY - mSize, 
            x + mSize * 2, floorPosY, 
            x + mSize, floorPosY
        );
    }
}

// Draw sun with cool glow effect
function drawSun() {
    var sunX = cameraPosX + 500;  // Fixed relative to camera like clouds
    var sunY = 100;
    var glowPulse = 20 + 10 * sin(frameCount * 0.03);

    noStroke();
    
    // Sun core
    fill(255, 255, 0);
    ellipse(sunX, sunY, 80, 80);

    // Glow layers
    fill(
        255, 
        255, 
        100, 
        80
    );
    ellipse(sunX, sunY, 130 + glowPulse, 130 + glowPulse);
    
    fill(255, 255, 100, 40);
    ellipse(sunX, sunY, 200 + glowPulse * 2, 200 + glowPulse * 2);
    
    fill(255, 255, 100, 20);
    ellipse(sunX, sunY, 300 + glowPulse * 3, 300 + glowPulse * 3);

    // Sun rays
    stroke(255, 255, 0, 120);
    strokeWeight(2);
    
    for (var angle = 0; angle < 360; angle += 30) {
        var rayLen = 90 + 10 * sin(frameCount * 0.05 + angle);
        var x1 = sunX + cos(radians(angle)) * 50;
        var y1 = sunY + sin(radians(angle)) * 50;
        var x2 = sunX + cos(radians(angle)) * rayLen;
        var y2 = sunY + sin(radians(angle)) * rayLen;
        line(x1, y1, x2, y2);
    }
    
    noStroke();
}

// Draw trees in background
function drawTrees() {
    for (var i = 0; i < treesX.length; i++) {
        var x = treesX[i];
        var y = treesY[i];
        
        // Tree trunk
        fill(101, 67, 33);
        rect(x + 12.5, y, 25, 100);

        // Tree leaves lots of overlapping circles
        fill(0, 128, 0);
        ellipse(x + 25, y - 20, 120, 80);
        ellipse(x - 5, y - 60, 100, 70);
        ellipse(x + 55, y - 60, 100, 70);
        ellipse(x + 25, y - 90, 110, 80);

        // Shadow leaves
        fill(0, 100, 0, 150);
        ellipse(x + 25, y - 90, 90, 60);
        
        fill(0, 100, 0);
        ellipse(x + 25, y - 20, 100, 60);
        ellipse(x - 5, y - 60, 80, 50);
        ellipse(x + 55, y - 60, 80, 50);
        ellipse(x + 25, y - 90, 90, 60);
    }
}

// Draw flagpole with animation
function renderFlagpole() {
    var poleHeight = 100;
    var poleX = flagpole.x_pos;
    var poleY = floorPosY;
    
    // Draw pole
    push();
    stroke(180);
    strokeWeight(6);
    line(poleX, poleY - poleHeight, poleX, poleY);
    noStroke();
    pop();

    // Flag position with animation
    var flagOffset = flagpole.isReached ? poleHeight - 30 : 0;
    var windEffect = sin(frameCount * 0.05) * 10;
    
    // Set flag color - red normally, green when reached
    noStroke();
    fill(flagpole.isReached ? color(0, 200, 0) : color(255, 0, 0));
    
    // Triangular flag with wind effect
    triangle(
        poleX, poleY - poleHeight + flagOffset,
        poleX, poleY - poleHeight + flagOffset + 30,
        poleX + 40 + windEffect, poleY - poleHeight + flagOffset + 15
    );
}

// Draw canyons and collectable corn
function drawCanyonsAndCollectables() {
    for (var i = 0; i < canyons.length; i++) {
        drawCanyon(canyons[i]);
        checkCanyon(canyons[i]);
    }

    for (var i = 0; i < collectables.length; i++) {
        drawCollectable(collectables[i]);
        checkCollectable(collectables[i]);
    }
}

// Draw corn (collectable item)
function drawCollectable(t_collectable) {
    if (!t_collectable.isFound) {
        // Draw corn cob
        fill(255, 223, 0);
        rect(t_collectable.x_pos, t_collectable.y_pos, 14, 40, 5);
        
        // Draw details (kernels)
        fill(255, 255, 102);
        ellipse(t_collectable.x_pos + 7, t_collectable.y_pos + 5, 4, 4);
        ellipse(t_collectable.x_pos + 7, t_collectable.y_pos + 15, 4, 4);
        ellipse(t_collectable.x_pos + 7, t_collectable.y_pos + 25, 4, 4);
        ellipse(t_collectable.x_pos + 7, t_collectable.y_pos + 35, 4, 4);
        
        // Draw corn leaves
        fill(34, 139, 34);
        triangle(
            t_collectable.x_pos, t_collectable.y_pos, 
            t_collectable.x_pos - 6, t_collectable.y_pos + 10, 
            t_collectable.x_pos, t_collectable.y_pos + 20
        );
        triangle(
            t_collectable.x_pos + 14, t_collectable.y_pos, 
            t_collectable.x_pos + 20, t_collectable.y_pos + 10, 
            t_collectable.x_pos + 14, t_collectable.y_pos + 20
        );
        triangle(
            t_collectable.x_pos, t_collectable.y_pos + 40, 
            t_collectable.x_pos - 6, t_collectable.y_pos + 30, 
            t_collectable.x_pos, t_collectable.y_pos + 20
        );
        triangle(
            t_collectable.x_pos + 14, t_collectable.y_pos + 40, 
            t_collectable.x_pos + 20, t_collectable.y_pos + 30, 
            t_collectable.x_pos + 14, t_collectable.y_pos + 20
        );
        
        // Glow effect
        fill(255, 223, 0, 100);
        ellipse(t_collectable.x_pos + 7, t_collectable.y_pos + 20, 40, 40);
        ellipse(t_collectable.x_pos + 7, t_collectable.y_pos + 20, 60, 60);
    }
}

// Check if player collected corn
function checkCollectable(t_collectable) {
    if (!t_collectable.isFound && 
        dist(gameCharWorldX, gameCharWorldY, 
             t_collectable.x_pos + 7, t_collectable.y_pos + 20) < 50) {
        t_collectable.isFound = true;
        gameScore += 1;
        eatSound.play();
    }
}

// Draw canyon
function drawCanyon(t_canyon) {
    noStroke();
    
    // Canyon base (black hole)
    fill(0, 0, 0);
    rect(t_canyon.x_pos, floorPosY, t_canyon.width, height - floorPosY);
    // Spikes at bottom - don't fall!
    fill(255, 90, 10);
    var numSpikes = Math.floor(t_canyon.width / 20);
    var spikeWidth = t_canyon.width / numSpikes;
    for (var i = 0; i < numSpikes; i++) {
        var spikeX = t_canyon.x_pos + (i * spikeWidth);
        var spikeCenter = spikeX + spikeWidth / 2;
        triangle(
            spikeX, height, 
            spikeCenter, height - 36, 
            spikeX + spikeWidth, height
        );
    }
}

// Check if player fell into canyon
function checkCanyon(t_canyon) {
    if (gameCharWorldX > t_canyon.x_pos && 
        gameCharWorldX < t_canyon.x_pos + t_canyon.width && 
        gameCharWorldY >= floorPosY) {
        isPlummeting = true;
    }
}

// Check if reached flagpole
function checkFlagpole() {
    if (abs(gameCharWorldX - flagpole.x_pos) < 20) {
        flagpole.isReached = true;
        flagpoleReachedTime = frameCount;
        
        // Stop theme music and play victory sound
        themeSound.stop();
        flagSound.play();
        
        // Stop player movement
        isLeft = false;
        isRight = false;
        isFalling = false;
        isPlummeting = false;
    }
}

// Handle character movement
function moveCharacter() {
    if (!isPlummeting) {
        if (isLeft) {
            gameCharWorldX -= charSpeed;
            // Prevent moving before world start
            if (gameCharWorldX < -200) {
                gameCharWorldX = -200;
            }
        }
        if (isRight) {
            gameCharWorldX += charSpeed;
            // Prevent moving past flagpole (world end)
            if (gameCharWorldX > flagpole.x_pos + 100) {
                gameCharWorldX = flagpole.x_pos + 100;
            }
        }
    }
}

// Draw character in correct pose
function drawGameChar() {
    // Character drawing now uses screen coordinates
    var gameChar_screen_x = gameCharWorldX;
    var gameChar_screen_y = gameCharWorldY;

    if (isFlying) {
        drawCharFlying(gameChar_screen_x, gameChar_screen_y);
    } else if (isLeft && isFalling) {
        drawCharJumpingLeft(gameChar_screen_x, gameChar_screen_y);
    } else if (isRight && isFalling) {
        drawCharJumpingRight(gameChar_screen_x, gameChar_screen_y);
    } else if (isLeft) {
        drawCharWalkingLeft(gameChar_screen_x, gameChar_screen_y);
    } else if (isRight) {
        drawCharWalkingRight(gameChar_screen_x, gameChar_screen_y);
    } else if (isFalling || isPlummeting) {
        drawCharJumpingFront(gameChar_screen_x, gameChar_screen_y);
    } else {
        drawCharStanding(gameChar_screen_x, gameChar_screen_y);
    }
}

// Chick flying with flapping wings
function drawCharFlying(x, y) {
    fill(255, 230, 50);
    ellipse(x, y - 38, 28, 36); // Body
    ellipse(x, y - 54, 20, 20); // Head

    fill(255, 150, 0);
    triangle(x - 4, y - 46, x + 4, y - 46, x, y - 40); // Beak

    fill(0);
    ellipse(x - 5, y - 58, 3, 3);
    ellipse(x + 5, y - 58, 3, 3);

    // Flapping wings
    var flap = 18 + sin(wingFlap) * 12;
    var flap2 = 18 + cos(wingFlap) * 12;
    fill(255, 230, 50);
    push();
    translate(x - 14, y - 32);
    rotate(radians(-flap));
    ellipse(0, 0, 8, 22);
    pop();
    push();
    translate(x + 14, y - 32);
    rotate(radians(flap2));
    ellipse(0, 0, 8, 22);
    pop();

    // Little feet
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x - 5, y - 14, x - 5, y);
    line(x + 5, y - 14, x + 5, y);
    noStroke();
}

// Character jumping left
function drawCharJumpingLeft(x, y) {
    fill(255, 230, 50);
    ellipse(x + 8, y - 32, 28, 36);
    ellipse(x - 6, y - 40, 20, 20);
    
    fill(255, 150, 0);
    triangle(
        x - 15, y - 40,
        x - 22, y - 37,
        x - 15, y - 34
    );
    
    fill(0);
    ellipse(x - 10, y - 43, 3, 3);
    
    fill(255, 230, 50);
    ellipse(x - 10, y - 25, 10, 18);
    ellipse(x + 5, y - 30, 8, 14);
    
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x - 5, y - 18, x - 7, y - 10);
    line(x + 5, y - 18, x + 2, y - 10);
    noStroke();
}

// Character jumping right
function drawCharJumpingRight(x, y) {
    fill(255, 230, 50);
    ellipse(x - 8, y - 32, 28, 36);
    ellipse(x + 6, y - 40, 20, 20);
    
    fill(255, 150, 0);
    triangle(
        x + 15, y - 40,
        x + 22, y - 37,
        x + 15, y - 34
    );
    
    fill(0);
    ellipse(x + 10, y - 43, 3, 3);
    
    fill(255, 230, 50);
    ellipse(x + 10, y - 25, 10, 18);
    ellipse(x - 5, y - 30, 8, 14);
    
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x + 5, y - 18, x + 7, y - 10);
    line(x - 5, y - 18, x - 2, y - 10);
    noStroke();
}

// Character walking left
function drawCharWalkingLeft(x, y) {
    fill(255, 230, 50);
    ellipse(x - 4, y - 32, 28, 36);
    ellipse(x - 14, y - 40, 20, 20);
    
    fill(255, 150, 0);
    triangle(
        x - 23, y - 40,
        x - 30, y - 37,
        x - 23, y - 34
    );
    
    fill(0);
    ellipse(x - 18, y - 43, 3, 3);
    
    fill(255, 230, 50);
    ellipse(x - 16, y - 25, 10, 18);
    ellipse(x - 1, y - 30, 8, 14);
    
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x - 6, y - 14, x - 10, y);
    line(x + 4, y - 16, x + 8, y);
    noStroke();
}

// Character walking right
function drawCharWalkingRight(x, y) {
    fill(255, 230, 50);
    ellipse(x - 8, y - 32, 28, 36);
    ellipse(x + 2, y - 40, 20, 20);
    
    fill(255, 150, 0);
    triangle(
        x + 11, y - 40,
        x + 18, y - 37,
        x + 11, y - 34
    );
    
    fill(0);
    ellipse(x + 6, y - 43, 3, 3);
    
    fill(255, 230, 50);
    ellipse(x + 4, y - 25, 10, 18);
    ellipse(x - 11, y - 30, 8, 14);
    
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x - 6, y - 14, x - 2, y);
    line(x - 16, y - 16, x - 20, y);
    noStroke();
}

// Character jumping front
function drawCharJumpingFront(x, y) {
    fill(255, 230, 50);
    ellipse(x, y - 38, 28, 36);
    ellipse(x, y - 54, 20, 20);
    
    fill(255, 150, 0);
    triangle(
        x - 4, y - 46,
        x + 4, y - 46,
        x, y - 40
    );
    
    fill(0);
    ellipse(x - 5, y - 58, 3, 3);
    ellipse(x + 5, y - 58, 3, 3);
    
    fill(255, 230, 50);
    ellipse(x - 16, y - 46, 8, 18);
    ellipse(x + 16, y - 46, 8, 18);
    
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x - 5, y - 22, x - 9, y - 10);
    line(x + 5, y - 22, x + 9, y - 10);
    noStroke();
}

// Character standing
function drawCharStanding(x, y) {
    fill(255, 230, 50);
    ellipse(x, y - 32, 28, 36);
    ellipse(x, y - 48, 20, 20);
    
    fill(255, 150, 0);
    triangle(x - 4, y - 40, x + 4, y - 40, x, y - 34);
    
    fill(0);
    ellipse(x - 5, y - 52, 3, 3);
    ellipse(x + 5, y - 52, 3, 3);
    
    fill(255, 230, 50);
    ellipse(x - 14, y - 32, 8, 16);
    ellipse(x + 14, y - 32, 8, 16);
    
    stroke(255, 150, 0);
    strokeWeight(2);
    line(x - 5, y - 14, x - 5, y);
    line(x + 5, y - 14, x + 5, y);
    noStroke();
}

// Complete game restart
function restartGame() {
    gameScore = 0;  // Reset score
    
    // Reset all collectables
    if (collectables && collectables.length > 0) {
        for (var i = 0; i < collectables.length; i++) {
            collectables[i].isFound = false;
        }
    }
    
    // Reset clouds to initial positions
    cloudsX = [100, 300, 500, 700, 900, 200, 600];
    cloudsY = [100, 120, 80, 140, 110, 60, 160];
    cloudsSize = [70, 90, 60, 100, 80, 50, 75];
    
    startGame();
}

// Shared actions - called by both keyboard handlers and touch controls

function doJump() {
    if (!isFalling && !isPlummeting && !isFlying) {
        isFalling = true;
        gameCharWorldY -= jumpStrength;
        jumpSound.play();
    }
}

function startFlying() {
    if (!isPlummeting && !isFlying) {
        isFlying = true;
        wingFlap = random(0, 100); // Randomize flap start
        if (flyingSound && flyingSound.isLoaded() && !flyingSound.isPlaying()) {
            flyingSound.loop();
        }
    }
}

function stopFlying() {
    isFlying = false;
    if (flyingSound && flyingSound.isPlaying()) {
        flyingSound.stop();
    }
}

function startSpeedBoost() {
    charSpeed = 15; // Speed boost!
}

function stopSpeedBoost() {
    charSpeed = 10; // Normal speed
}

function doRestart() {
    lives = 3;
    isGameOver = false;
    levelComplete = false;
    restartGame();
}

function setupTouchControls() {
    var isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    document.getElementById('touch-controls').classList.add('active');

    function bindHold(id, onStart, onEnd) {
        var el = document.getElementById(id);
        el.addEventListener('touchstart', function(e) { e.preventDefault(); onStart(); }, { passive: false });
        el.addEventListener('touchend', function(e) { e.preventDefault(); onEnd(); }, { passive: false });
    }

    bindHold('btn-left', function() { isLeft = true; }, function() { isLeft = false; });
    bindHold('btn-right', function() { isRight = true; }, function() { isRight = false; });
    bindHold('btn-jump', doJump, function() {});
    bindHold('btn-fly', startFlying, stopFlying);
    bindHold('btn-speed', startSpeedBoost, stopSpeedBoost);

    document.getElementById('touch-restart').addEventListener('touchstart', function(e) {
        e.preventDefault();
        doRestart();
    }, { passive: false });
}

// Handle key presses
function keyPressed() {
    if ((isGameOver || levelComplete) && (key == 'r' || key == 'R')) {
        doRestart();
        return;
    }

    if (isGameOver || levelComplete || isPlummeting) return;

    if (keyCode === LEFT_ARROW) isLeft = true;
    else if (keyCode === RIGHT_ARROW) isRight = true;
    else if (keyCode === UP_ARROW || key === 'w' || key === 'W' || keyCode === 32) {
        doJump();
    } else if (key === 's' || key === 'S') {
        startSpeedBoost();
    } else if (key === 'f' || key === 'F') {
        startFlying();
    }
}

// Handle key releases
function keyReleased() {
    if (isGameOver || levelComplete) return;

    if (keyCode === LEFT_ARROW) isLeft = false;
    else if (keyCode === RIGHT_ARROW) isRight = false;
    else if (key === 's' || key === 'S') {
        stopSpeedBoost();
    } else if (key === 'f' || key === 'F') {
        stopFlying();
    }
}

// Create platform objects
function createPlatforms(x, y, length)
{ 
    var p = {
        x: x,
        y: y,
        length: length,
        
        // Draw platform
        draw: function() {
            fill(180, 180, 200); // Metal-looking
            rect(this.x, this.y, this.length, 20);
        },
        
        // Check if character is on this platform
        checkContact: function(gc_x, gc_y) {
            if (gc_x > this.x && gc_x < this.x + this.length) {
                var d = gc_y - this.y;
                if (d >= 0 && d < 20) {
                   return true;
                }
            
            }
            return false; 
        }
    };
    return p;
}

// Create moving platform
function createMovingPlatform(x, y, length, speed) {
    var p = {
        x: x,
        y: y,
        length: length,
        speed: speed,
        direction: 1,
        draw: function() {
            fill(180, 180, 200);
            rect(this.x, this.y, this.length, 20);
        },
        update: function() {
            this.x += this.speed * this.direction;
            if (this.x < 1300 || this.x > 1450) this.direction *= -1;
        },
        checkContact: function(gc_x, gc_y) {
            if (gc_x > this.x && gc_x < this.x + this.length) {
                var d = gc_y - this.y;
                if (d >= 0 && d < 20) return true;
            }
            return false;
        }
    };
    return p;
}

// Butchers these guys want chicken dinner!!!!!
function Enemy(x, y, range) {
    this.x = x;           // Starting x
    this.y = y;           // Y position
    this.range = range;   // How far they patrol
    this.currentX = x;    // Current position
    this.inc = 1;         // Direction (1=right, -1=left)

    // Update enemy position
    this.update = function() {
        this.currentX += this.inc;
        if (this.currentX >= this.x + this.range) {
            this.currentX = this.x + this.range; // Clamp
            this.inc *= -1;
        }
        else if (this.currentX <= this.x) {
            this.currentX = this.x; // Clamp
            this.inc *= -1;
        }
    };

    // Draw the butcher enemy
    this.draw = function() {
        this.update();
        
        fill(139, 69, 19); // Apron
        rect(this.currentX - 15, this.y - 40, 30, 35);
        
        fill(255, 220, 177); // Head
        ellipse(this.currentX, this.y - 50, 20, 20);
        
        fill(0); // Eyes
        ellipse(this.currentX - 4, this.y - 52, 2, 2);
        ellipse(this.currentX + 4, this.y - 52, 2, 2);
        
        stroke(0); // Evil smile
        strokeWeight(1);
        arc(this.currentX, this.y - 48, 8, 4, 0, PI);
        noStroke();
        
        fill(255, 255, 255); // Chef hat
        rect(this.currentX - 10, this.y - 65, 20, 12);
        rect(this.currentX - 8, this.y - 60, 16, 4);
        
        fill(255, 220, 177); // Arms
        ellipse(this.currentX - 18, this.y - 30, 8, 20);
        ellipse(this.currentX + 18, this.y - 30, 8, 20);
        
        fill(192, 192, 192); // Knife blade
        rect(this.currentX + 20, this.y - 40, 3, 15);
        
        fill(139, 69, 19); // Knife handle
        rect(this.currentX + 20, this.y - 25, 3, 8);
        
        fill(255, 0, 0); // Blood drops
        ellipse(this.currentX + 21, this.y - 35, 2, 3);
        ellipse(this.currentX + 22, this.y - 30, 1, 2);
        
        fill(0, 0, 139); // Pants
        rect(this.currentX - 8, this.y - 5, 6, 15);
        rect(this.currentX + 2, this.y - 5, 6, 15);
        
        fill(0); // Shoes
        ellipse(this.currentX - 5, this.y + 12, 8, 4);
        ellipse(this.currentX + 5, this.y + 12, 8, 4);
    };

    // Check if enemy caught the player
    this.checkContact = function(gc_x, gc_y) {
        var d = dist(gc_x, gc_y, this.currentX, this.y);
        if (d < 30) { // 30 is a good collision distance
            return true;
        }
        return false;
    };
}

// Big Boss Enemy that chases the player
function BossEnemy(x, y, range) {
    this.x = x;
    this.y = y;
    this.range = range;
    this.currentX = x;
    this.inc = 2; // Faster movement

    // Update boss position to chase player
    this.update = function(playerX) {
        // Boss cannot walk over canyons
        var bossWidth = 30; // half width of boss sprite
        var nextX = this.currentX;
        if (playerX > this.currentX) {
            nextX += this.inc;
        } else if (playerX < this.currentX) {
            nextX -= this.inc;
        }
        // Check if any part of boss would be over a canyon
        var overCanyon = false;
        for (var i = 0; i < canyons.length; i++) {
            var c = canyons[i];
            if ((nextX - bossWidth) < c.x_pos + c.width && (nextX + bossWidth) > c.x_pos) {
                overCanyon = true;
                break;
            }
        }
        if (!overCanyon) {
            this.currentX = nextX;
        }
    };

    // Ibiza Boss Draw
    this.draw = function(playerX) {
        this.update(playerX);
    // All black clothes: jacket, t-shirt, sleeves
    fill(0);
    rect(this.currentX - 30, this.y - 80, 60, 70, 12); // jacket
    rect(this.currentX - 22, this.y - 60, 44, 32, 8); // t-shirt
    // Write 'IBIZA' on t-shirt
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("IBIZA", this.currentX, this.y - 44);
    // Big gold chain necklace (draw as chain)
    noStroke();
    var chainRadius = 22;
    var chainY = this.y - 75;
    var chainW = 44;
    var chainH = 28;
    var chainLinks = 9;
    for (var i = 0; i < chainLinks; i++) {
        var angle = PI * (i / (chainLinks - 1));
        var cx = this.currentX + cos(angle) * (chainW / 2);
        var cy = chainY + sin(angle) * (chainH / 2);
        fill(255, 215, 0);
        ellipse(cx, cy, 10, 10);
        fill(255, 235, 80, 120);
        ellipse(cx, cy, 14, 14);
    }
        // Head
        fill(255, 220, 177);
        ellipse(this.currentX, this.y - 100, 40, 40);
    // Slightly bigger bobby hair
    fill(40, 40, 40);
    ellipse(this.currentX, this.y - 110, 34, 20); // center hair bigger
    ellipse(this.currentX - 14, this.y - 102, 13, 22); // left hair bigger
    ellipse(this.currentX + 14, this.y - 102, 13, 22); // right hair bigger
        // Sunglasses
        fill(0);
        rect(this.currentX - 14, this.y - 108, 12, 10, 3);
        rect(this.currentX + 2, this.y - 108, 12, 10, 3);
        fill(80);
        rect(this.currentX - 14, this.y - 108, 12, 10, 3);
        rect(this.currentX + 2, this.y - 108, 12, 10, 3);
        stroke(0);
        strokeWeight(2);
        line(this.currentX - 2, this.y - 103, this.currentX + 2, this.y - 103);
        noStroke();
        // Beard
        fill(40, 20, 10);
        arc(this.currentX, this.y - 90, 24, 18, 0, PI, CHORD);
        // Smile
        stroke(0);
        strokeWeight(2);
        arc(this.currentX, this.y - 92, 16, 8, 0, PI);
        noStroke();
        // Arms
        fill(255, 220, 177);
        ellipse(this.currentX - 40, this.y - 60, 16, 40);
        ellipse(this.currentX + 40, this.y - 60, 16, 40);
    // Legs (black pants)
    fill(0);
    rect(this.currentX - 15, this.y - 10, 12, 30, 4);
    rect(this.currentX + 3, this.y - 10, 12, 30, 4);
    ellipse(this.currentX - 10, this.y + 20, 12, 6);
    ellipse(this.currentX + 10, this.y + 20, 12, 6);
    };

    // Check if boss caught the player
    this.checkContact = function(gc_x, gc_y) {
        var d = dist(gc_x, gc_y, this.currentX, this.y);
        if (d < 50) { // Boss has bigger collision
            return true;
        }
        return false;
    };
}

// Mobile browsers block audio until a user gesture - unlock it on first touch
document.addEventListener('touchstart', function unlockAudio() {
    if (typeof getAudioContext === 'function' && getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}, { once: true });

//Coding By Roberto Pires Almeida ends here.
