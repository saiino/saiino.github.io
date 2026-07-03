const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const highscoreEl = document.getElementById("highscore");
const restartBtn = document.getElementById("restart");

const HIGH_SCORE_KEY = "breakout-high-score";
let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
highscoreEl.textContent = highScore;

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 16;
const BRICK_PADDING = 6;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 20;
const ROW_COLORS = ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff", "#c56cf0"];

const paddle = {
  width: 80,
  height: 10,
  x: (canvas.width - 80) / 2,
  speed: 7,
};

const ball = {
  radius: 6,
  x: canvas.width / 2,
  y: canvas.height - 30,
  dx: 3,
  dy: -3,
};

let bricks = [];
let score = 0;
let lives = 3;
let running = false;
let gameOver = false;
let rightPressed = false;
let leftPressed = false;

function createBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    bricks[r] = [];
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks[r][c] = { x: 0, y: 0, alive: true };
    }
  }
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 30;
  ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -3;
  paddle.x = (canvas.width - paddle.width) / 2;
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  createBricks();
  resetBall();
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  restartBtn.classList.add("hidden");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const relativeX = e.clientX - rect.left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddle.x = Math.min(Math.max(relativeX - paddle.width / 2, 0), canvas.width - paddle.width);
  }
});

canvas.addEventListener("click", () => {
  if (!running && !gameOver) {
    running = true;
  }
});

restartBtn.addEventListener("click", () => {
  resetGame();
  running = true;
});

function movePaddle() {
  if (rightPressed) paddle.x = Math.min(paddle.x + paddle.speed, canvas.width - paddle.width);
  if (leftPressed) paddle.x = Math.max(paddle.x - paddle.speed, 0);
}

function collideBricks() {
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const brick = bricks[r][c];
      if (!brick.alive) continue;
      if (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + BRICK_WIDTH &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + BRICK_HEIGHT
      ) {
        brick.alive = false;
        score += 10;
        scoreEl.textContent = score;

        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + BRICK_WIDTH - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + BRICK_HEIGHT - (ball.y - ball.radius);
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          ball.dx *= -1;
        } else {
          ball.dy *= -1;
        }

        if (bricks.every((row) => row.every((b) => !b.alive))) {
          winGame();
        }
        return;
      }
    }
  }
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    highscoreEl.textContent = highScore;
    localStorage.setItem(HIGH_SCORE_KEY, highScore);
  }
}

function winGame() {
  running = false;
  gameOver = true;
  drawMessage("クリア！おめでとう 🎉");
  restartBtn.classList.remove("hidden");
}

function loseLife() {
  lives -= 1;
  livesEl.textContent = lives;
  if (lives <= 0) {
    running = false;
    gameOver = true;
    updateHighScore();
    drawMessage("ゲームオーバー");
    restartBtn.classList.remove("hidden");
  } else {
    running = false;
    resetBall();
  }
}

function drawMessage(text) {
  ctx.fillStyle = "rgba(11, 13, 26, 0.85)";
  ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  ctx.fillStyle = "#f0f0f5";
  ctx.font = "20px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 7);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // bricks
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const brick = bricks[r][c];
      const x = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
      const y = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
      brick.x = x;
      brick.y = y;
      if (brick.alive) {
        ctx.fillStyle = ROW_COLORS[r % ROW_COLORS.length];
        ctx.fillRect(x, y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    }
  }

  // paddle
  ctx.fillStyle = "#f0f0f5";
  ctx.fillRect(paddle.x, canvas.height - paddle.height - 8, paddle.width, paddle.height);

  // ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6b6b";
  ctx.fill();
  ctx.closePath();

  if (!running && !gameOver) {
    drawMessage("クリックしてスタート");
  }
}

function update() {
  if (!running) return;

  movePaddle();

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx *= -1;
  }
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  const paddleY = canvas.height - paddle.height - 8;
  if (
    ball.y + ball.radius > paddleY &&
    ball.y + ball.radius < paddleY + paddle.height &&
    ball.x + ball.radius > paddle.x &&
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.dy > 0
  ) {
    const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.dx = hitPos * 4;
    ball.dy = -Math.abs(ball.dy);
  }

  if (ball.y - ball.radius > canvas.height) {
    loseLife();
    return;
  }

  collideBricks();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetGame();
loop();
