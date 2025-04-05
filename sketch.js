// ----------------- global vars & images -----------------
// imgs for spider, cloud, platform, cave, fly, bee
let spiderImg, cloudImg, platformImg, caveImg, flyImg, beeImg;
// sounds for bg, web, fly collected
let bgMusic, webSound, flyCollectedSound;
// objs for spider, obstacles, particles, collectibles, enemies
let spider,
  obstacles = [],
  particles = [],
  collectibles = [],
  enemies = [];
// physics vars: gravity, rope stiffness factor, rest length, anchor, damping
let gravity,
  ropeK = 0.5, // rope stiffness factor
  ropeRestLength, // length rope stays at when slack
  ropeAnchor, // point where web attaches
  damping = 1; // damping for vel
// game state vars: state, countdown secs, countdown start time, cam offsets
let gameState = "start",
  countdown = 3,
  countdownStart,
  cameraOffsetX = 0,
  cameraOffsetY = 0;
// game vars: speed, last obs x, score, fly count
let gameSpeed = 2,
  lastObstacleX = 0,
  score = 0,
  flyScore = 0;
// flag for power up, parallax array, color theme, web power end time
let powerUpActive = false;
let bgParallax = [],
  themeColor,
  webPowerEndTime = 0;
// constant fall limit, array of color themes
const FALL_LIMIT = 1500,
  THEMES = [
    [30, 60, 90],
    [90, 30, 60],
    [60, 90, 30],
  ];

// global for web projectile (holds info for web shot)
let webProjectile = null;

// ----------------- preload -----------------
function preload() {
  // load imgs
  spiderImg = loadImage("spider.png"); // spider pic
  cloudImg = loadImage("cloud.png");   // cloud pic
  platformImg = loadImage("platform.png"); // platform pic
  caveImg = loadImage("cave.jpg");       // cave background
  flyImg = loadImage("fly.png");         // fly pic
  beeImg = loadImage("bee.png");         // bee pic
  // load sounds
  bgMusic = loadSound("bgmusic.mp3");    // background music
  webSound = loadSound("web.mp3");         // web shoot sound
  flyCollectedSound = loadSound("flycollected.mp3"); // fly collect sound
  font = loadFont("font.otf");           // custom font file
}

// --------------------------------------------------------
// spider class - holds pos, vel, size, attached flag, swing direction
class Spider {
  constructor(x, y) {
    this.pos = createVector(x, y); // starting pos
    this.vel = createVector(0, 0);   // starting vel
    this.radius = 15;              // spider size
    this.attached = false;         // not attached initially
    this.swingDirection = 1;       // default swing dir
  }

  update() {
    // add gravity force to vel
    this.vel.add(gravity);
    // if web attached and anchor valid, apply rope physics
    if (this.attached && ropeAnchor) {
      let ropeVec = p5.Vector.sub(ropeAnchor, this.pos); // vector from spider to anchor
      let distance = ropeVec.mag(); // how far out rope is
      if (distance > ropeRestLength) { // if rope stretched
        let force = ropeVec.normalize().mult((distance - ropeRestLength) * ropeK); // calc rope force
        this.vel.add(force); // adjust vel
        this.swingDirection = Math.sign(this.vel.x); // update swing dir based on x vel
      }
    }
    this.vel.mult(damping); // apply damping
    this.pos.add(this.vel); // update pos
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y); // move to spider pos
    scale(this.swingDirection, 1); // flip horizontally if needed
    image(spiderImg, 0, 0, this.radius * 2, this.radius * 2); // draw spider
    pop();
  }
}

// --------------------------------------------------------
// p5 setup: canvas, theme, gravity, spider, parallax, font, bg music
function setup() {
  createCanvas(640, 480); // init canvas
  themeColor = random(THEMES); // pick random theme
  gravity = createVector(0, 0.08); // set gravity
  spider = new Spider(width / 2, height / 2); // spawn spider at center
  initParallax(); // init bg parallax elements
  textFont(font); // use custom font for text
  bgMusic.loop(); // loop bg music
}

// --------------------------------------------------------
// p5 draw loop: update game state and draw appropriate screen
function draw() {
  background(themeColor); // fill background
  image(caveImg, 0, 0, width, height); // draw cave bg
  // choose what to do based on game state
  switch (gameState) {
    case "start":
      drawStartScreen(); // show start screen
      break;
    case "countdown":
      handleCountdown(); // run countdown
      break;
    case "playing":
      updateGame(); // main game logic
      break;
    case "gameover":
      showGameOver(); // game over screen
      break;
  }
}

// --------------------------------------------------------
// handleCountdown: show countdown until game starts
function handleCountdown() {
  let elapsed = floor((millis() - countdownStart) / 1000); // secs passed
  let remaining = countdown - elapsed; // secs left
  textSize(100); // large number
  textAlign(CENTER, CENTER); // center align
  fill(255); // white text
  if (remaining > 0) {
    text(remaining, width / 2, height / 2); // show countdown
  } else {
    gameState = "playing"; // switch state
  }
}

// --------------------------------------------------------
// showGameOver: display overlay with stats & restart prompt
function showGameOver() {
  fill(255, 200); // semi-transparent overlay
  rect(0, 0, width, height); // draw overlay
  fill(themeColor); // use theme for text
  textSize(40); // header size
  textAlign(CENTER, CENTER); // center text
  text("Game Over", width / 2, height / 2 - 60); // header
  textSize(30); // score text
  text("Score: " + score, width / 2, height / 2); // show score
  text("Flies: " + flyScore, width / 2, height / 2 + 40); // show fly count
  textSize(20); // prompt text
  text("Click to Restart", width / 2, height / 2 + 120); // restart msg
}

// --------------------------------------------------------
// spawnObstacles: if spider near last obs, add new cloud obstacle
function spawnObstacles() {
  if (spider.pos.x + width - 50 > lastObstacleX) { // check if need new obs
    let spacing = random(200, 500); // gap for next obs
    let cloudY = random(height - 50 / 2, height + 1 / 2); // random Y pos
    obstacles.push({
      x: lastObstacleX + 500, // set obs x pos offset
      y: cloudY, // obs y pos
      w: random(80, 150), // obs width
      h: 20, // obs height
      type: "cloud", // obs type
      baseY: cloudY, // store base Y for wobble calc
      wobbleOffset: random(100000), // random wobble offset
    });
    lastObstacleX += spacing; // bump last obs x pos
  }
}

// removeOldObstacles: remove obstacles offscreen to left
function removeOldObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].x + obstacles[i].w < spider.pos.x - width) {
      obstacles.splice(i, 1); // remove obs
    }
  }
}

// updateGame: main update loop during playing state
function updateGame() {
  updateCamera(); // adjust cam based on spider pos
  updateEntities(); // update spider and remove offscreen obs
  handleCollisions(); // check collisions
  spawnWorldElements(); // add collectibles/enemies
  drawEnvironment(); // draw all world objs
  
  if (webProjectile) { // if web shot exists, update & draw it
    updateWebProjectile();
    drawWebProjectile();
  }
  
  spider.show(); // draw spider on top
  updateUI(); // draw UI overlay (score)
  checkGameOver(); // check if spider fell
  
  if (spider.pos.x > width / 2) {
    score = floor((spider.pos.x - width / 2) / 10); // update score
  }
}

// ----------------- enhanced functions -----------------
// initParallax: create bg ellipses for parallax effect
function initParallax() {
  for (let i = 0; i < 5; i++) {
    bgParallax.push({
      x: random(width), // random x
      y: random(height), // random y
      speed: random(0.1, 0.5), // movement speed factor
      size: random(20, 50), // size of ellipse
    });
  }
}

// updateCamera: smoothly follow spider using lerp on offsets
function updateCamera() {
  cameraOffsetX = lerp(cameraOffsetX, width / 2 - spider.pos.x, 0.1);
  cameraOffsetY = lerp(cameraOffsetY, height / 2 - spider.pos.y, 0.1);
  push();
  translate(cameraOffsetX, cameraOffsetY); // shift world coords
}

// spawnWorldElements: call spawnObstacles and add collectibles/enemies periodically
function spawnWorldElements() {
  spawnObstacles(); // check/add new obstacles
  
  // add collectible every 60 frames with chance
  if (frameCount % 60 === 0 && random() < 0.6) {
    collectibles.push({
      x: spider.pos.x + random(width, width + 600), // spawn ahead of spider
      y: random(50, height + 500), // random y pos
      type: random() < 0.7 ? "fly" : "webPower" // type; bee-like collectible now
    });
  }
  // add enemy every 100 frames with chance
  if (frameCount % 100 === 0 && random() < 0.7) {
    enemies.push({
      x: spider.pos.x + random(width, width + 600), // spawn ahead
      y: random(100, height + 500), // random y
      speed: random(2, 4) // enemy speed
    });
  }
}

// drawEnvironment: render parallax bg, obstacles, collectibles, enemies, particles, web line if attached
function drawEnvironment() {
  // draw bg ellipses for parallax
  bgParallax.forEach((p) => {
    fill(255, 50); // light fill for bg
    ellipse(
      p.x - cameraOffsetX * p.speed,
      p.y - cameraOffsetY * p.speed,
      p.size
    );
  });
  // draw obstacles (clouds)
  obstacles.forEach((obs) => {
    if (obs.type === "cloud") {
      let wobble = 5 * sin((frameCount + obs.wobbleOffset) * 0.1); // calc wobble
      image(cloudImg, obs.x, obs.baseY + wobble, obs.w, obs.h); // draw cloud
    }
  });
  // draw collectibles; if type "fly" show fly img, else show bee img
  collectibles.forEach((c) => {
    let yOff = sin(frameCount * 0.1) * 10; // slight bobbing effect
    image(c.type === "fly" ? flyImg : beeImg, c.x, c.y + yOff, 30, 30);
  });
  // draw enemies; move them leftwards
  enemies.forEach((e) => {
    image(beeImg, e.x, e.y, 40, 40);
    e.x -= e.speed; // update enemy pos
  });
  // if spider attached to web, draw rope line and add particles
  if (spider.attached) {
    drawWebLine();
    if (frameCount % 5 === 0) {
      particles.push({
        x: spider.pos.x,
        y: spider.pos.y,
        life: 30, // particle life
      });
    }
  }
  // draw particles, reduce life, remove dead ones
  particles.forEach((p) => {
    p.life--;
    fill(255, p.life * 8);
    ellipse(p.x, p.y, 5);
  });
  particles = particles.filter((p) => p.life > 0);
}

// handleCollectibles: check if spider touches collectible; if fly, add score; if bee (webPower), game over now
function handleCollectibles() {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    let c = collectibles[i];
    if (dist(spider.pos.x, spider.pos.y, c.x, c.y) < 30) {
      collectibles.splice(i, 1); // remove collectible hit
      if (c.type === "fly") {
        flyScore++; // bump fly count
        flyCollectedSound.play(); // play sound
      } else if (c.type === "webPower") {
        // change: collecting bee ends game
        gameState = "gameover";
        playSound(80);
      }
    }
  }
}

// handleEnemies: if spider collides with enemy bee, end game; remove enemies offscreen
function handleEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (dist(spider.pos.x, spider.pos.y, e.x, e.y) < 40) {
      gameState = "gameover"; // collision with enemy, game over
      playSound(80); // play sound
    }
    if (e.x < spider.pos.x - width) enemies.splice(i, 1); // remove if offscreen
  }
}

// activateWebPower: boost rope stiffness for short time; (unused now since bee causes game over)
function activateWebPower() {
  powerUpActive = true;
  webPowerEndTime = millis() + 5000; // lasts 5 sec
  ropeK *= 1.5; // increase rope stiffness
  setTimeout(() => {
    powerUpActive = false;
    ropeK /= 1.5; // reset stiffness
  }, 5000);
}

// ----------------- UI functions -----------------
// drawStartScreen: show start screen with title and instructions
function drawStartScreen() {
  textSize(40); // header size
  fill(255); // white text
  textAlign(CENTER, CENTER); // center align
  text("Webster!", width / 2, height / 2 - 60); // title
  textSize(20); // smaller for prompt
  text("Click to Start", width / 2, height / 2 + 20);
  text("Aim with your mouse\nUse SPACE to shoot your web\nCollect flies for points\nAvoid bees!", width / 2, height / 2 + 80);
}

// drawUI: show score and fly count in top left corner
function drawUI() {
  push();
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("Score: " + score, 15, 15);
  text("Flies: " + flyScore, 15, 40);
  pop();
}

// ----------------- input handling -----------------
// mousePressed: if on start screen, start countdown; if gameover, reset game
function mousePressed() {
  if (gameState === "start") {
    gameState = "countdown";
    countdownStart = millis(); // record start time
  } else if (gameState === "gameover") {
    resetGame(); // restart game
  }
}

// keyPressed: on SPACE, if spider not attached and no web shot, try to shoot web
function keyPressed() {
  if (gameState !== "playing") return;
  if (key === " " && !spider.attached && !webProjectile) {
    let anchor = getCloudAnchor(); // get target from cloud under mouse
    if (anchor) {
      webSound.play(); // play web shoot sound
      webProjectile = {
        pos: spider.pos.copy(), // start at spider pos
        target: anchor.copy(),  // target pos
        speed: 15               // set speed
      };
    }
  }
}

// keyReleased: on releasing SPACE, cancel web shot if active or detach if attached
function keyReleased() {
  if (key === " ") {
    if (webProjectile) {
      webProjectile = null; // cancel shot
    }
    if (spider.attached) {
      spider.attached = false; // detach spider from web
      ropeAnchor = null;
    }
  }
}

// ----------------- helper functions -----------------
// getCloudAnchor: return world coords vector if mouse over a cloud, accounting for wobble
function getCloudAnchor() {
  let worldMouseX = mouseX - cameraOffsetX; // convert mouse x
  let worldMouseY = mouseY - cameraOffsetY; // convert mouse y
  for (let obs of obstacles) {
    if (obs.type === "cloud") {
      let wobble = 5 * sin((frameCount + obs.wobbleOffset) * 0.1); // calc wobble
      let left = obs.x - 20;
      let right = obs.x + obs.w + 20;
      let top = obs.baseY + wobble - 20;
      let bottom = obs.baseY + obs.h + wobble + 20;
      if (worldMouseX >= left && worldMouseX <= right && worldMouseY >= top && worldMouseY <= bottom) {
        return createVector(worldMouseX, obs.baseY + obs.h / 2 + wobble);
      }
    }
  }
  return null;
}

// playSound: create a short oscillator sound at given freq
function playSound(freq) {
  let osc = new p5.Oscillator();
  osc.setType("sine");
  osc.freq(freq);
  osc.amp(0.1);
  osc.start();
  osc.stop(0.1);
}

// resetGame: re-init all game vars for new game
function resetGame() {
  spider = new Spider(width / 2, height / 2); // reset spider
  obstacles = [];
  collectibles = [];
  enemies = [];
  particles = [];
  webProjectile = null;
  gameSpeed = 2;
  lastObstacleX = 0;
  score = 0;
  flyScore = 0;
  themeColor = random(THEMES); // new random theme
  gameState = "countdown";
  countdownStart = millis(); // restart countdown
}

// getCloudAnchorIfMouseOver: helper for extra margin hitbox check on cloud obs
function getCloudAnchorIfMouseOver(mx, my) {
  for (let obs of obstacles) {
    if (obs.type === "cloud") {
      let wobble = 5 * sin((frameCount + obs.wobbleOffset) * 0.02);
      let cloudTop = obs.baseY + wobble;
      let boxLeft = obs.x - 5;
      let boxRight = obs.x + obs.w + 5;
      let boxTop = cloudTop - 5;
      let boxBottom = cloudTop + obs.h + 5;
      if (mx >= boxLeft && mx <= boxRight && my >= boxTop && my <= boxBottom) {
        return createVector(mx, my);
      }
    }
  }
  return null;
}

// drawWebLine: draw wobbly rope line between spider and rope anchor
function drawWebLine() {
  let powerMod = powerUpActive ? 2 : 1; // if power up, amplify wobble
  for (let i = 0; i <= 10; i++) {
    strokeWeight(map(i, 0, 10, 4, 1)); // decreasing stroke weight
    stroke(255, 255, 50, map(i, 0, 10, 200, 50)); // fading yellow stroke
    let px = lerp(spider.pos.x, ropeAnchor.x, i / 10); // interpolate x
    let py = lerp(spider.pos.y, ropeAnchor.y, i / 10); // interpolate y
    point(px + random(-1, 1) * powerMod, py + random(-1, 1) * powerMod); // draw wobbly point
  }
}

// updateWebProjectile: move web shot toward target; if close, attach rope to target
function updateWebProjectile() {
  if (webProjectile) {
    let dir = p5.Vector.sub(webProjectile.target, webProjectile.pos); // dir from shot to target
    let distance = dir.mag(); // dist to target
    if (distance < webProjectile.speed) { // if close enough
      ropeAnchor = webProjectile.target.copy(); // set rope anchor at target
      ropeRestLength = p5.Vector.dist(spider.pos, ropeAnchor); // set rest length
      spider.attached = true; // attach spider
      webProjectile = null; // remove shot
    } else {
      dir.normalize();
      dir.mult(webProjectile.speed); // calculate step
      webProjectile.pos.add(dir); // move shot
    }
  }
}

// drawWebProjectile: draw line from spider to web shot and red tip at shot
function drawWebProjectile() {
  if (webProjectile) {
    stroke(255);
    strokeWeight(3);
    line(spider.pos.x, spider.pos.y, webProjectile.pos.x, webProjectile.pos.y);
    fill(255, 0, 0);
    noStroke();
    ellipse(webProjectile.pos.x, webProjectile.pos.y, 8, 8);
  }
}

// handleCollisions: central collision handling calling sub-collision funcs
function handleCollisions() {
  handleObstacleCollisions();
  handleCollectibles();
  handleEnemies();
}

// updateEntities: update spider pos & remove obs offscreen
function updateEntities() {
  spider.update();
  removeOldObstacles();
}

// handleObstacleCollisions: if spider hits cloud from top while falling, snap spider onto cloud
function handleObstacleCollisions() {
  for (let obs of obstacles) {
    let wobble = 5 * sin((frameCount + obs.wobbleOffset) * 0.1); // calc wobble
    let platformTop = obs.baseY + wobble; // effective cloud top
    let obsLeft = obs.x;
    let obsRight = obs.x + obs.w;
    if (spider.pos.x + spider.radius > obsLeft && spider.pos.x - spider.radius < obsRight) {
      if (spider.vel.y >= 0 && spider.pos.y + spider.radius >= platformTop && spider.pos.y < platformTop) {
        spider.pos.y = platformTop - spider.radius; // snap spider to cloud top
        spider.vel.y = 0; // cancel falling vel
      }
    }
  }
}

// updateUI: restore coordinate system then draw UI overlay
function updateUI() {
  pop();
  drawUI();
}

// checkGameOver: if spider falls below fall limit, set game over state and play sound
function checkGameOver() {
  if (spider.pos.y > FALL_LIMIT) {
    gameState = "gameover";
    playSound(80);
  }
}
