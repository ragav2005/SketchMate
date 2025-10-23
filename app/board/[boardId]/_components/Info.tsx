"use client";
import { Board } from "@/app/(Dashboard)/_components/BoardList";
import Actions from "@/components/Actions";
import Hint from "@/components/hint";
import { Button } from "@/components/ui/button";
import { useRenameModel } from "@/store/useRenameModel";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface InfoProps {
  boardId: string;
  board: Board | null;
}

const TabSeparator = () => {
  return <div className="text-neutral-300 px-1.5">|</div>;
};

const Info = ({ board }: InfoProps) => {
  const { onOpen } = useRenameModel();

  return (
    <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md">
      <Hint label="Go Home" side="bottom">
        <Button variant="board" className="cursor-pointer">
          <Link href="/">
            <Image src="/logo.svg" alt="SketchMate" width={120} height={40} />
          </Link>
        </Button>
      </Hint>
      <TabSeparator />
      <Hint label="Edit Title" side="bottom">
        <Button
          variant="board"
          className="text-base font-normal px-2 cursor-pointer"
          onClick={() => board && onOpen(board.id, board.title)}
        >
          {board?.title}
        </Button>
      </Hint>
      <TabSeparator />
      <Actions
        id={board?.id}
        title={board?.title}
        side="bottom"
        sideOffset={15}
      >
        <div>
          <Hint label="Main Menu" side="bottom">
            <Button size="icon" variant="board" className="cursor-pointer">
              <Menu />
            </Button>
          </Hint>
        </div>
      </Actions>
    </div>
  );
};

export default Info;

export function InfoSkeleton() {
  return (
    <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]" />
  );
}
