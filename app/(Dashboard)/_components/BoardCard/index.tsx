import React from "react";
import Link from "next/link";
import Image from "next/image";
import Overlay from "./Overlay";
import useAuth from "@/lib/hooks/useAuth";
import Footer from "./Footer";
import Actions from "@/components/Actions";
import { Board } from "../BoardList";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
const BoardCard = ({
  board,
  isFavorite,
}: {
  board: Board;
  isFavorite: boolean;
}) => {
  const { user } = useAuth();
  const authorLabel = user?.id === board.author_id ? "You" : board.author_name;
  const createdAtlabel = formatDistanceToNow(board.created_at, {
    addSuffix: true,
  });
  return (
    <Link href={`/board/${board.id}`}>
      <div className="group aspect-[100/127] border rounded-lg flex flex-col justify-between overflow-hidden">
        <div className="relative flex-1 bg-amber-50">
          <Image
            src={board.image_url}
            alt={board.title}
            fill
            priority
            className="object-fit"
          />
          <Overlay />
          <Actions
            id={board.id}
            title={board.title}
            side="right"
            sideOffset={12}
          >
            <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-3 py-2 outline-none">
              <MoreHorizontal className="text-white opacity-75 hover:opacity-100 transition-opacity" />
            </button>
          </Actions>
        </div>
        <Footer
          isFavorite={isFavorite}
          title={board.title}
          authorLabel={authorLabel}
          createdAtLabel={createdAtlabel}
          onClick={() => {}}
          disabled={false}
        />
      </div>
    </Link>
  );
};

export default BoardCard;

BoardCard.Skeleton = function BoardCardSkeleton() {
  return (
    <div className="group aspect-[100/127] border rounded-lg flex flex-col justify-between overflow-hidden">
      <div className="relative flex-1 bg-amber-50">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="relative bg-white p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};
