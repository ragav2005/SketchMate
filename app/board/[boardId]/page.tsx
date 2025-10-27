"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Canvas from "./_components/Canvas";
import { createClient } from "@/lib/supabase/client";
import { Board as BoardType } from "@/app/(Dashboard)/_components/BoardList";
import { Loading } from "./_components/loading";
import { toast } from "sonner";
import useAuth from "@/lib/hooks/useAuth";

const Board = () => {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;
  const { user, loading: authLoading } = useAuth();

  const supabase = createClient();
  const [board, setBoard] = useState<BoardType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

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
        toast.error("Board not found or you don't have access");
        router.push("/");
        return;
      }

      if (data) {
        setBoard(data);
      }
    } catch (err) {
      console.error("Unexpected error loading boards", err);
      toast.error("Failed to load board");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [boardId, supabase, router]);

  // auth check effect
  useEffect(() => {
    if (authLoading || !user?.id || !board?.org_id) return;

    const checkAuthorization = async () => {
      try {
        setIsVerifying(true);
        const { data: member, error } = await supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", board.org_id)
          .eq("user_id", user.id)
          .single();

        if (error || !member) {
          setIsAuthorized(false);
          console.error("User is not authorized to access this board");
          toast.error("You don't have access to this board");
          router.push("/");
          return;
        }
        setIsAuthorized(true);
      } catch (err) {
        console.error("Error checking authorization:", err);
        toast.error("Failed to verify access");
        router.push("/");
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuthorization();
  }, [board?.org_id, user?.id, authLoading, supabase, router, board]);

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

  if (isLoading || authLoading) {
    return <Loading />;
  }

  if (isVerifying || isAuthorized === null) {
    return <Loading />;
  }

  if (isAuthorized === false) {
    return;
  }

  return (
    <div>
      <Canvas boardId={boardId} board={board} />
    </div>
  );
};

export default Board;
