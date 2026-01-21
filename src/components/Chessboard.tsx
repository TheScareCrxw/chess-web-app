"use client";
import { useState, useEffect, useRef } from "react";
import classes from "./Chessboard.module.css";
import { Board, ChessPiece } from "@/utils/board";
import {
 IconChess,
 IconChessBishopFilled,
 IconChessFilled,
 IconChessKingFilled,
 IconChessKnightFilled,
 IconChessQueenFilled,
 IconChessRookFilled,
} from "@tabler/icons-react";

interface ChessboardProps {
  ws?: WebSocket | null;
  capturedPieces: {
    white: ChessPiece[],
    black: ChessPiece[]
  };
  setCapturedPieces: React.Dispatch<React.SetStateAction<{
    white: ChessPiece[],
    black: ChessPiece[]
  }>>;
}

export function Chessboard({ ws, capturedPieces, setCapturedPieces }: ChessboardProps) {
 const [currentBoard, setCurrentBoard] = useState(new Board());
 const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
 const [possibleMoves, setPossibleMoves] = useState<{row: number, col: number}[]>([]);
 const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
 const [assignedPlayer, setAssignedPlayer] = useState<'white' | 'black' | 'spectator' | null>(null);
 const [connected, setConnected] = useState(false);
 const wsRef = useRef<WebSocket | null>(null);
 const prevBoardRef = useRef<(ChessPiece | null)[][] | null>(null);

 // Detect captured pieces when board changes
 useEffect(() => {
  if (prevBoardRef.current && currentBoard.fields) {
   // Count pieces on old and new boards
   const countPieces = (board: (ChessPiece | null)[][]) => {
    const counts: Record<string, number> = {};
    for (let row = 0; row < 8; row++) {
     for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
       const key = `${piece.player}_${piece.kind}`;
       counts[key] = (counts[key] || 0) + 1;
      }
     }
    }
    return counts;
   };

   const oldCounts = countPieces(prevBoardRef.current);
   const newCounts = countPieces(currentBoard.fields);

   let hasNewCaptures = false;
   const newBlackCaptured = [...capturedPieces.black];
   const newWhiteCaptured = [...capturedPieces.white];

   // Check for decreased piece counts
   for (const key in oldCounts) {
    const oldCount = oldCounts[key];
    const newCount = newCounts[key] || 0;

    if (newCount < oldCount) {
     // Pieces were captured
     const [player, kind] = key.split('_');
     const capturedCount = oldCount - newCount;

     for (let i = 0; i < capturedCount; i++) {
      hasNewCaptures = true;
      if (player === 'white') {
       newBlackCaptured.push({ player: 'white', kind: kind as any });
      } else {
       newWhiteCaptured.push({ player: 'black', kind: kind as any });
      }
     }
    }
   }

   // Only update if there are new captures
   if (hasNewCaptures) {
    setCapturedPieces({
     white: newWhiteCaptured,
     black: newBlackCaptured
    });
   }
  }

  // Update the ref with current board
  prevBoardRef.current = currentBoard.fields.map(row => row.map(piece => piece ? { ...piece } : null));
 }, [currentBoard.fields]); // Only depend on board changes, not capturedPieces

 useEffect(() => {
  if (ws) {
   wsRef.current = ws;
   setConnected(true);

   // Add message handler for game state updates
   const handleMessage = (event: MessageEvent) => {
    try {
     const data = JSON.parse(event.data);

     if (data.type === 'assigned') {
      setAssignedPlayer(data.player);
      if (data.gameState) {
       const newBoard = new Board();
       newBoard.fields = data.gameState.board;
       setCurrentBoard(newBoard);
       setCurrentPlayer(data.gameState.currentPlayer);
      }
     } else if (data.type === 'gameState') {
      const newBoard = new Board();
      newBoard.fields = data.board;
      setCurrentBoard(newBoard);
      setCurrentPlayer(data.currentPlayer);
      setSelectedSquare(null);
      setPossibleMoves([]);
     } else if (data.type === 'gameReset') {
      const newBoard = new Board();
      newBoard.fields = data.gameState.board;
      setCurrentBoard(newBoard);
      setCurrentPlayer(data.gameState.currentPlayer);
      setSelectedSquare(null);
      setPossibleMoves([]);
     }
    } catch (error) {
     // Ignore parsing errors
    }
   };

   ws.addEventListener('message', handleMessage);
   ws.addEventListener('close', () => {
    setConnected(false);
    setAssignedPlayer(null);
   });

   return () => {
    ws.removeEventListener('message', handleMessage);
    ws.removeEventListener('close', () => {
     setConnected(false);
     setAssignedPlayer(null);
    });
   };
  } else {
   setConnected(false);
   setAssignedPlayer(null);
  }
 }, [ws]);

 // Convert display coordinates back to server coordinates for black player
 const toServerCoords = (row: number, col: number) => {
  if (assignedPlayer !== 'black') return { row, col };
  return {
   row: 7 - row,
   col: 7 - col
  };
 };

 // Get display board for the player (rotate 180° for black)
 const getDisplayBoard = (board: Board) => {
  if (assignedPlayer !== 'black') return board.fields;

  // Black: rotate board 180 degrees
  return board.fields
   .slice()
   .reverse()
   .map(row => row.slice().reverse());
 };

 const handleSquareClick = (row: number, col: number) => {
  if (!connected || assignedPlayer === 'spectator' || assignedPlayer !== currentPlayer) {
   return;
  }

  const coords = toServerCoords(row, col);
  const piece = currentBoard.getPiece(coords.row, coords.col);

  if (selectedSquare) {
   // Send move to server
   if (wsRef.current && assignedPlayer === currentPlayer) {
    wsRef.current.send(JSON.stringify({
     type: 'move',
     fromRow: selectedSquare.row,
     fromCol: selectedSquare.col,
     toRow: coords.row,
     toCol: coords.col
    }));
   }
   setSelectedSquare(null);
   setPossibleMoves([]);
  } else if (piece && piece.player === assignedPlayer && !currentBoard.isCheckmate(assignedPlayer)) {
   // Select the piece
   setSelectedSquare({ row: coords.row, col: coords.col });
   setPossibleMoves(currentBoard.getValidMoves(coords.row, coords.col));
  }
 };

 return (
  <>
   <div style={{ textAlign: 'center', marginBottom: '10px' }}>
    <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
    <div>You are: {assignedPlayer ? assignedPlayer.toUpperCase() : 'Waiting...'}</div>
    <div>Turn: {currentPlayer ? currentPlayer.toUpperCase() : 'Waiting...'}</div>
   </div>


   <div className={classes.gameContainer}>
    <div className={classes.chessboardWrapper}>
     <div className={classes.chessboard}>
      {getDisplayBoard(currentBoard).map((boardRow, rowIndex) => {
       // Display board is already rotated for black, so we can render it directly
       const isEven = rowIndex % 2 === 0;
       let light = !isEven;
       return boardRow.map((field, columnIndex) => {
        light = !light;

        // For highlighting, we need to convert display coordinates to server coordinates
        const serverCoords = toServerCoords(rowIndex, columnIndex);
        const isSelected = selectedSquare && selectedSquare.row === serverCoords.row && selectedSquare.col === serverCoords.col;
        const isPossibleMove = possibleMoves.some(move => move.row === serverCoords.row && move.col === serverCoords.col);
        const isCurrentPlayerPiece = field && field.player === currentPlayer;

        return (
         <div
          className={
           classes.field + " " + (light ? classes.light : classes.dark) +
           (isSelected ? " " + classes.selected : "") +
           (isPossibleMove ? " " + classes.possibleMove : "") +
           (isCurrentPlayerPiece ? " " + classes.currentPlayerPiece : "")
          }
          key={`${rowIndex}_${columnIndex}`}
          onClick={() => handleSquareClick(rowIndex, columnIndex)}
         >
          {field && (
           <div
            className={
             classes.chesspiece +
             " " +
             (field.player === "black" ? classes.darkPlayer : classes.lightPlayer)
            }
           >
            {field.kind === "pawn" && <IconChessFilled />}
            {field.kind === "rook" && <IconChessRookFilled />}
            {field.kind === "knight" && <IconChessKnightFilled />}
            {field.kind === "bishop" && <IconChessBishopFilled />}
            {field.kind === "queen" && <IconChessQueenFilled />}
            {field.kind === "king" && <IconChessKingFilled />}
           </div>
          )}
         </div>
        );
       });
      })}
     </div>
    </div>
   </div>
  </>
 );
}
