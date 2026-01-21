"use client";
import styles from "./ControlPanel.module.css";
import { ChessPiece } from "../utils/board";
import {
 IconChess,
 IconChessBishopFilled,
 IconChessFilled,
 IconChessKingFilled,
 IconChessKnightFilled,
 IconChessQueenFilled,
 IconChessRookFilled,
} from "@tabler/icons-react";

interface ControlPanelProps {
  onReset: () => void;
  capturedPieces: {
    white: ChessPiece[],
    black: ChessPiece[]
  };
}

export function ControlPanel({ onReset, capturedPieces }: ControlPanelProps) {

  return (
    <div className={styles.panelContainer}>
      <h3 className={styles.panelTitle}>Game Controls</h3>

      {/* Captured Pieces Display */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#333' }}>
          Black Captured:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginBottom: '15px' }}>
          {capturedPieces.black.map((piece, index) => (
            <div key={index} style={{ fontSize: '18px', opacity: 0.8 }}>
              {piece.kind === "pawn" && <IconChessFilled />}
              {piece.kind === "rook" && <IconChessRookFilled />}
              {piece.kind === "knight" && <IconChessKnightFilled />}
              {piece.kind === "bishop" && <IconChessBishopFilled />}
              {piece.kind === "queen" && <IconChessQueenFilled />}
              {piece.kind === "king" && <IconChessKingFilled />}
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#333' }}>
          White Captured:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
          {capturedPieces.white.map((piece, index) => (
            <div key={index} style={{ fontSize: '18px', opacity: 0.8 }}>
              {piece.kind === "pawn" && <IconChessFilled />}
              {piece.kind === "rook" && <IconChessRookFilled />}
              {piece.kind === "knight" && <IconChessKnightFilled />}
              {piece.kind === "bishop" && <IconChessBishopFilled />}
              {piece.kind === "queen" && <IconChessQueenFilled />}
              {piece.kind === "king" && <IconChessKingFilled />}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className={styles.controlButton}
      >
        Reset Game
      </button>

      <div className={styles.instructionsBox}>
        <div className={styles.instructionsTitle}>Controls:</div>
        <div className={styles.instructionItem}>• Reset Game - Start new game</div>
      </div>
    </div>
  );
}
