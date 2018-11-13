if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../serviceWorker.js').then(function () {
    return navigator.serviceWorker.ready;
  }).then(function () {
  }).catch(function () {
  });
}

function resizeCanvasToDisplaySize (canvas) {
  // look up the size the canvas is being displayed
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  // If it's resolution does not match change it
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

const canvas = document.getElementById('breakout-game');
resizeCanvasToDisplaySize(canvas);
const ctx = canvas.getContext('2d');

const newGame = 'New Game';
const fontSize = Math.floor(canvas.width / 10);
const newGameTextX = (canvas.width - fontSize * newGame.length / 2 - 20) / 2;
const newGameTextY = (canvas.height + fontSize) / 2;

const brickRowCount = 10;
const brickColumnCount = 4;
const brickOffsetTop = 30;
const brickOffsetLeft = 20;
const brickWidth = Math.floor((canvas.width - brickOffsetLeft) / (brickRowCount * 1.25));
const brickPadding = 0.25 * brickWidth;
const brickHeight = ((canvas.height - brickOffsetTop - 2 * brickPadding * brickColumnCount)
  / (3 * brickColumnCount));
const ballRadius = (brickWidth + brickHeight) / 9;
let score = 0;
let lives = 3;
let state = 0;

const paddleHeight = canvas.height / 30;
const paddleWidth = canvas.width / 5;

const initialBallSpeedX = Math.floor(canvas.width / 100);
const initialBallSpeedY = -Math.floor(canvas.height / 100);

let ballSpeedX = initialBallSpeedX;
let ballSpeedY = initialBallSpeedY;
let ballX = canvas.width / 2;
let ballY = canvas.height - paddleHeight;
let paddleX = (canvas.width - paddleWidth) / 2;

let requestID;

const bricks = [];

function initBriks () {
  for (let col = 0; col < brickColumnCount; col++) {
    bricks[col] = [];
    for (let row = 0; row < brickRowCount; row++) {
      bricks[col][row] = { x: 0, y: 0, status: 1 };
    }
  }
}

document.addEventListener('mousedown', mouseDownHandler, false);
document.addEventListener('mousemove', mouseMoveHandler, false);
document.addEventListener('touchmove', touchMoveHandler, false);

function mouseDownHandler (e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  const relativeY = e.clientY - canvas.offsetTop;
  if (relativeX > newGameTextX && relativeX < (canvas.width + fontSize * newGame.length / 2) / 2) {
    if (relativeY > (canvas.height - fontSize) / 2 && relativeY < newGameTextY)
      if (state === 0) {
        startNewGame();
      }
  }
}

function mouseMoveHandler (e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function touchMoveHandler (e) {
  const touch = e.touches[0];
  if (e.target === canvas) {
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }
}

function collisionDetection () {
  for (let col = 0; col < brickColumnCount; col++) {
    for (let row = 0; row < brickRowCount; row++) {
      const brick = bricks[col][row];
      if (brick.status === 1) {
        if (ballX > brick.x && ballX < brick.x + brickWidth &&
          ballY > brick.y && ballY < brick.y + brickHeight) {
          ballSpeedY = -ballSpeedY;
          brick.status = 0;
          score += 10;
          if (score === brickRowCount * brickColumnCount * 10) {
            score *= score;
            gameEnd();
          }
        }
      }
    }
  }
}

function drawBall () {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}
function drawPaddle () {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}
function drawBricks () {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = (r * (brickWidth + brickPadding)) + brickOffsetLeft;
        const brickY = (c * (brickHeight + brickPadding)) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = '#0095DD';
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}
function drawScore () {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095DD';
  ctx.fillText('Score: ' + score, 8, 20);
}
function drawLives () {
  ctx.font = '16px Arial';
  ctx.fillStyle = '#0095DD';
  ctx.fillText('Lives: ' + lives, canvas.width - 65, 20);
}

function draw () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  resizeCanvasToDisplaySize(canvas);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();

  if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
    ballSpeedX = -ballSpeedX;
  }
  if (ballY + ballSpeedY < ballRadius) {
    ballSpeedY = -ballSpeedY;
  } else if (ballY + ballSpeedY > canvas.height - ballRadius) {
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      ballSpeedY = -ballSpeedY;
    } else {
      lives--;
      if (!lives) {
        resetBall();
        gameEnd();
        return;
      } else {
        resetBall();
      }
    }
  }

  ballX += ballSpeedX;
  ballY += ballSpeedY;
  return requestAnimationFrame(draw);
}

function gameEnd () {
  state = 0;
  cancelAnimationFrame(requestID);
  displayScore();
}

function displayScore () {
  const scoreText = `Score: ${score}`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0095DD';
  ctx.font = `${fontSize / 2}px Arial`;
  ctx.fillText(scoreText, fontSize / 4, fontSize / 2);
  newGameTextDraw();
}

function newGameTextDraw () {
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = '#0095DD';
  ctx.fillText(newGame, newGameTextX, newGameTextY);
}

function startNewGame () {
  state = 1;
  score = 0;
  lives = 3;
  initBriks();
  requestID = draw();
}

function resetBall () {
  ballX = canvas.width / 2;
  ballY = canvas.height - paddleHeight;
  ballSpeedX = initialBallSpeedX;
  ballSpeedY = initialBallSpeedY;
  paddleX = (canvas.width - paddleWidth) / 2;
}

newGameTextDraw();
