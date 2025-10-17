import useAuth from "@/lib/hooks/useAuth";
import Image from "next/image";
import React from "react";
import NewBoardButton from "./NewBoardButton";

const EmptyBoard = ({ orgId }: { orgId: string | undefined }) => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative h-[120px] w-[120px] sm:h-[150px] sm:w-[150px] md:h-[180px] md:w-[180px]">
        <Image
          src="/board.svg"
          alt="Empty Board"
          fill
          priority
          className="object-contain"
        />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 mt-6">
        Create your first board!
      </h2>
      <p className="text-muted-foreground text-sm mt-2 text-center">
        Start by creating a board for you organization
      </p>
      <div className="mt-6">
        <NewBoardButton
          orgId={orgId}
          authorId={user?.id}
          authorName={
            user?.user_metadata?.full_name || user?.user_metadata?.name
          }
        />
      </div>
    </div>
  );
};

export default EmptyBoard;
