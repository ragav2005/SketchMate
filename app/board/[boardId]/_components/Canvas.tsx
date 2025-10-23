"use client";
import { Board } from "@/app/(Dashboard)/_components/BoardList";
import Info from "./Info";
import Participants from "./Participants";
import Toolbar from "./Toolbar";
import { useState } from "react";
import { CanvasMode, CanvasState } from "@/types/canvas";
import { useBoardStore } from "@/store/useBoardStore";
interface Props {
  boardId: string;
  board: Board | null;
}

const Canvas = ({ boardId, board }: Props) => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  const canUndo = useBoardStore((state) => state.undoStack.length > 0);
  const canRedo = useBoardStore((state) => state.redoStack.length > 0);

  return (
    <div className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} board={board} />
      <Participants boardId={boardId} />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        canUndo={canUndo}
        redo={redo}
        canRedo={canRedo}
      />
    </div>
  );
};

export default Canvas;
