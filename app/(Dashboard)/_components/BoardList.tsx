"use client";
import React, { useCallback, useEffect, useState } from "react";
import EmptySearch from "./EmptySates/EmptySearch";
import EmptyFavorites from "./EmptySates/EmptyFavorites";
import EmptyBoard from "./EmptySates/EmptyBoard";
import useAuth from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import BoardCard from "./BoardCard";
import NewBoardButton from "./EmptySates/NewBoardButton";

interface BoardListProps {
  orgId: string | undefined;
  query: {
    search?: string | undefined;
    favorites?: string | undefined;
  };
}

export interface Board {
  id: string;
  title: string;
  org_id: string;
  author_id: string;
  author_name: string;
  image_url: string;
  created_at: string;
}

const BoardList = ({ orgId, query }: BoardListProps) => {
  const { user } = useAuth();
  const supabase = createClient();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // callback
  const loadBoardsCallback = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("org_id", orgId);

      if (error) {
        console.error("Error loading boards:", error);
        return;
      }

      if (data) {
        setBoards(data);
      }
    } catch (err) {
      console.error("Unexpected error loading boards", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase]);

  // boards effect
  useEffect(() => {
    if (!user?.id || !orgId) return;

    // first load
    loadBoardsCallback();

    // real-time updates
    const channel = supabase
      .channel(`boards:org:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "boards",
          filter: `org_id=eq.${orgId}`,
        },
        () => loadBoardsCallback()
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadBoardsCallback, orgId, supabase, user?.id]);

  // loading
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {query.favorites ? "Favorite Boards" : "Team Boards"}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
          <NewBoardButton
            orgId={orgId}
            authorId={user?.id}
            authorName={
              user?.user_metadata?.full_name || user?.user_metadata?.name
            }
            isList={true}
            disalbed={true}
          />
          {Array.from({ length: 6 }).map((_, index) => (
            <BoardCard.Skeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // empty states
  if (!boards?.length && query.search) {
    return <EmptySearch />;
  }

  if (!boards?.length && query.favorites) {
    return <EmptyFavorites />;
  }

  if (!boards?.length) {
    return <EmptyBoard orgId={orgId} />;
  }

  // main return
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {query.favorites ? "Favorite Boards" : "Team Boards"}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
        <NewBoardButton
          orgId={orgId}
          authorId={user?.id}
          authorName={
            user?.user_metadata?.full_name || user?.user_metadata?.name
          }
          isList={true}
          disalbed={loading}
        />
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} isFavorite={false} />
        ))}
      </div>
    </div>
  );
};

export default BoardList;
