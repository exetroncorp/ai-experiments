/** @jsxImportSource https://esm.sh/react */
import React, { useEffect, useRef, useState, useCallback } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const SNAKE_SPEED = 150;

function App() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const gameLoopRef = useRef(null);
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 15, y: 15 });
  const directionRef = useRef({ x: 1, y: 0 });

  function getRandomPosition() {
    return {
      x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
    };
  }

  function drawSnake(ctx) {
    ctx.fillStyle = "green";
    snakeRef.current.forEach((segment) => {
      ctx.fillRect(
        segment.x * GRID_SIZE,
        segment.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
      );
    });
  }

  function drawFood(ctx) {
    ctx.fillStyle = "red";
    ctx.fillRect(
      foodRef.current.x * GRID_SIZE,
      foodRef.current.y * GRID_SIZE,
      GRID_SIZE,
      GRID_SIZE
    );
  }

  function moveSnake() {
    const head = { ...snakeRef.current[0] };
    head.x += directionRef.current.x;
    head.y += directionRef.current.y;

    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= CANVAS_SIZE / GRID_SIZE ||
      head.y >= CANVAS_SIZE / GRID_SIZE ||
      snakeRef.current.some((segment) => segment.x === head.x && segment.y === head.y)
    ) {
      setGameOver(true);
      setIsPlaying(false);
      clearInterval(gameLoopRef.current);
      return;
    }

    snakeRef.current.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      setScore((prevScore) => prevScore + 1);
      foodRef.current = getRandomPosition();
    } else {
      snakeRef.current.pop();
    }
  }

  function updateGame() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawSnake(ctx);
    drawFood(ctx);
    moveSnake();
  }

  const handleKeyPress = useCallback((e) => {
    if (!isPlaying) return;

    switch (e.key) {
      case "ArrowUp":
        if (directionRef.current.y === 0) directionRef.current = { x: 0, y: -1 };
        break;
      case "ArrowDown":
        if (directionRef.current.y === 0) directionRef.current = { x: 0, y: 1 };
        break;
      case "ArrowLeft":
        if (directionRef.current.x === 0) directionRef.current = { x: -1, y: 0 };
        break;
      case "ArrowRight":
        if (directionRef.current.x === 0) directionRef.current = { x: 1, y: 0 };
        break;
    }
  }, [isPlaying]);

  function startGame() {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = { x: 1, y: 0 };
    foodRef.current = getRandomPosition();
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawSnake(ctx);
    drawFood(ctx);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (isPlaying) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(updateGame, SNAKE_SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying]);

  function handleStartClick() {
    startGame();
  }

  return (
    <div className="game-container">
      <h1>Snake Game</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="game-canvas"
      />
      <p>Score: {score}</p>
      {gameOver && <p className="game-over">Game Over!</p>}
      {!isPlaying && (
        <button onClick={handleStartClick} className="start-button">
          {gameOver ? "Restart Game" : "Start Game"}
        </button>
      )}
      <p className="instructions">
        Use arrow keys to control the snake. Eat the red food to grow and score points!
      </p>
      <a href={import.meta.url.replace("esm.town", "val.town")} target="_top" className="source-link">View Source</a>
    </div>
  );
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}

if (typeof document !== "undefined") {
  client();
}

export default async function server(request: Request): Promise<Response> {
  return new Response(
    `
    <html>
      <head>
        <title>Snake Game</title>
        <style>${css}</style>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `,
    {
      headers: {
        "content-type": "text/html",
      },
    }
  );
}

const css = `
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
}

.game-container {
  text-align: center;
}

.game-canvas {
  border: 2px solid #333;
}

.game-over {
  color: red;
  font-weight: bold;
}

.instructions {
  margin-top: 20px;
  font-style: italic;
}

.source-link {
  display: inline-block;
  margin-top: 20px;
  color: #0066cc;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}

.start-button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.start-button:hover {
  background-color: #45a049;
}
`;
