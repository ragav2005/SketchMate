"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Canvas from "./_components/Canvas";
import { createClient } from "@/lib/supabase/client";
import { Board as BoardType } from "@/app/(Dashboard)/_components/BoardList";
import { Loading } from "./_components/loading";
import { toast } from "sonner";

const Board = () => {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

  const supabase = createClient();
  const [board, setBoard] = useState<BoardType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getBoardCallback = useCallback(async () => {
    try {
      setIsLoading(true);

      //get board
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single();

      if (error) {
        console.error("Error loading boards:", error);
        return;
      }

      if (data) {
        setBoard(data);
      }
    } catch (err) {
      console.error("Unexpected error loading boards", err);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, supabase]);

  // realtime effect
  useEffect(() => {
    //first load
    getBoardCallback();

    //realtime
    const channel = supabase
      .channel(`board-changes:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "boards",
          filter: `id=eq.${boardId}`,
        },
        (payload) => {
          console.log(payload);
          setBoard(payload.new as BoardType);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "boards",
          filter: `id=eq.${boardId}`,
        },
        () => {
          console.log(`Board deleted - id:${boardId}`);
          toast.error("Board Deleted");
          setBoard(null);
          router.push("/");
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [boardId, getBoardCallback, router, supabase]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <Canvas boardId={boardId} board={board} />
    </div>
  );
};

export default Board;
