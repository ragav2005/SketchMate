"use client";
import { Board } from "@/app/(Dashboard)/_components/BoardList";
import Info from "./Info";
import Participants from "./Participants";
import Toolbar from "./Toolbar";
interface Props {
  boardId: string;
  board: Board | null;
}

const Canvas = ({ boardId, board }: Props) => {
  return (
    <div className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} board={board} />
      <Participants boardId={boardId} />
      <Toolbar />
    </div>
  );
};

export default Canvas;
