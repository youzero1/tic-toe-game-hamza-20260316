"use client";

import { useState, useEffect, useCallback } from "react";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];

interface GameResultRecord {
  id: number;
  winner: string;
  playedAt: string;
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board: Board): {
  winner: Player | null;
  line: number[] | null;
} {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function Home() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameOver, setGameOver] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{
    winner: string | null;
    line: number[] | null;
  }>({ winner: null, line: null });
  const [history, setHistory] = useState<GameResultRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/results");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.results || []);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveResult = useCallback(
    async (winner: string) => {
      setSavingResult(true);
      try {
        await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner }),
        });
        await fetchHistory();
      } catch (e) {
        console.error("Failed to save result", e);
      } finally {
        setSavingResult(false);
      }
    },
    [fetchHistory]
  );

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameOver || board[index]) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const { winner, line } = calculateWinner(newBoard);

      if (winner) {
        setWinnerInfo({ winner, line });
        setGameOver(true);
        saveResult(winner);
        return;
      }

      const isDraw = newBoard.every((cell) => cell !== null);
      if (isDraw) {
        setWinnerInfo({ winner: "Draw", line: null });
        setGameOver(true);
        saveResult("Draw");
        return;
      }

      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    },
    [board, currentPlayer, gameOver, saveResult]
  );

  const handleRestart = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameOver(false);
    setWinnerInfo({ winner: null, line: null });
  }, []);

  const renderStatus = () => {
    if (winnerInfo.winner === "Draw") {
      return (
        <span className="winner-msg" style={{ color: "#6c63ff" }}>
          🤝 It&apos;s a Draw!
        </span>
      );
    }
    if (winnerInfo.winner) {
      return (
        <span className="winner-msg">
          🏆 Player{" "}
          <span
            className={`player-${winnerInfo.winner.toLowerCase()}`}
          >
            {winnerInfo.winner}
          </span>{" "}
          Wins!
        </span>
      );
    }
    return (
      <span>
        Turn:{" "}
        <span className={`player-${currentPlayer.toLowerCase()}`}>
          Player {currentPlayer}
        </span>
      </span>
    );
  };

  return (
    <main>
      <h1 className="title">Tic Tac Toe</h1>

      <div className="game-card">
        <div className="status-bar">{renderStatus()}</div>

        <div className="board">
          {board.map((cell, index) => {
            const isWinningCell = winnerInfo.line?.includes(index) ?? false;
            const cellClass = [
              "cell",
              cell ? "taken" : "",
              gameOver ? "game-over" : "",
              isWinningCell ? "winning" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={index}
                className={cellClass}
                onClick={() => handleCellClick(index)}
                role="button"
                aria-label={`Cell ${index + 1}${
                  cell ? `, marked ${cell}` : ", empty"
                }`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCellClick(index);
                  }
                }}
              >
                {cell && (
                  <span
                    className={`mark mark-${cell.toLowerCase()}`}
                  >
                    {cell}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          className="restart-btn"
          onClick={handleRestart}
          disabled={savingResult}
        >
          {savingResult ? "Saving..." : "🔄 Restart Game"}
        </button>
      </div>

      <div className="history-card">
        <h2>📋 Game History</h2>
        {historyLoading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : history.length === 0 ? (
          <p className="history-empty">No games played yet. Start playing!</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Result</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.winner === "X"
                          ? "badge-x"
                          : item.winner === "O"
                          ? "badge-o"
                          : "badge-draw"
                      }`}
                    >
                      {item.winner === "Draw"
                        ? "🤝 Draw"
                        : `Player ${item.winner} Won`}
                    </span>
                  </td>
                  <td>{formatDate(item.playedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
