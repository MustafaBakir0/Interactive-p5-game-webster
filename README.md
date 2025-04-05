
# Introduction and Concept

Welcome to **Webster**! This game comes from an inspiration of a very dear friend, a pet actually.  
You know what they say: _"Do not kill that spider in the corner of your room, it probably thinks you are its roommate."_  
I saw a spider in the corner of a room we do not usually enter in my house, and I called it **Webster**.

This project is a labor of love that brings together some really fun game design.  
The game uses solid physics to simulate gravity and rope mechanics, making our little spider swing through a cave that’s so high it even has clouds!  
I broke the project into clear, modular functions so every bit of the physics—from gravity pulling our spider down to the rope tension that keeps it swinging—is handled cleanly.  
This means the spider feels natural and responsive, just like it’s really hanging from a web in a bustling cave (maybe IRL a cave of clouds doesn’t exist but it's oki).

On the design side, Webster is all about variety and challenge.  
The game dynamically spawns clouds, flies, and even bees as you progress, keeping the environment fresh and unpredictable.  
Randomized placements of these elements mean every playthrough feels unique, and the parallax background adds a nice touch of depth.  
Inspired by classic spider lore and a bit of Spiderman magic, the game makes sure you’re always on your toes—eating flies for points and avoiding bees like your life depends on it (well, Webster’s life does).

Enjoy swinging with Webster!
https://editor.p5js.org/mb9457/sketches/tAD9-naTT

---

## Sketch!

---

## Code Highlights

```js
// --- Physics-related vars & functions ---
let gravity, ropeK = 0.5, ropeRestLength, ropeAnchor, damping = 1;
function setup() {
  createCanvas(640, 480);
  gravity = createVector(0, 0.08);
}
class Spider {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.radius = 15;
    this.attached = false;
  }
  update() {
    this.vel.add(gravity);
    if (this.attached && ropeAnchor) {
      let ropeVec = p5.Vector.sub(ropeAnchor, this.pos);
      let distance = ropeVec.mag();
      if (distance > ropeRestLength) {
        let force = ropeVec.normalize().mult((distance - ropeRestLength) * ropeK);
        this.vel.add(force);
      }
    }
    this.vel.mult(damping);
    this.pos.add(this.vel);
  }
}
```

This snippet centralizes all physics computations. Gravity is set as a constant downward acceleration in `setup()` and then applied every frame in the `Spider` class’s `update()` method.  
When attached to a rope, a corrective force is calculated if the rope exceeds its rest length, which simulates tension; damping is applied to slow velocity over time.

---

```js
// --- Spawning Elements Functions ---
function spawnObstacles() {
  if (spider.pos.x + width - 50 > lastObstacleX) {
    let spacing = random(200, 500);
    let cloudY = random(height - 50 / 2, height + 1 / 2);
    obstacles.push({
      x: lastObstacleX + 500,
      y: cloudY,
      w: random(80, 150),
      h: 20,
      type: "cloud",
      baseY: cloudY,
      wobbleOffset: random(100000)
    });
    lastObstacleX += spacing;
  }
}

function spawnWorldElements() {
  spawnObstacles();
  if (frameCount % 60 === 0 && random() < 0.6) {
    collectibles.push({
      x: spider.pos.x + random(width, width + 600),
      y: random(50, height + 500),
      type: random() < 0.7 ? "fly" : "webPower"
    });
  }
  if (frameCount % 100 === 0 && random() < 0.7) {
    enemies.push({
      x: spider.pos.x + random(width, width + 600),
      y: random(100, height + 500),
      speed: random(2, 4)
    });
  }
}
```

This snippet groups all spawning logic for environment elements.  
The `spawnObstacles()` function checks the spider's x position and adds a new cloud with random properties.  
Then `spawnWorldElements()` adds collectibles and enemies based on frame counts and random chance.
