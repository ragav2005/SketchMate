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
  isFavorite: boolean;
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
      const { data: boardsData, error: boardsError } = await supabase
        .from("boards")
        .select("*")
        .eq("org_id", orgId);

      if (boardsError) {
        console.error("Error loading boards:", boardsError);
        return;
      }

      // fetch user favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("user_favorites")
        .select("board_id")
        .eq("user_id", user?.id);

      if (favoritesError) {
        console.error("Error loading favorites:", favoritesError);
        return;
      }

      const favoriteIds = new Set(
        favoritesData?.map((fav) => fav.board_id) || []
      );

      if (boardsData) {
        const boardsWithFavorites = boardsData.map((board) => ({
          ...board,
          isFavorite: favoriteIds.has(board.id),
        }));
        setBoards(boardsWithFavorites);
      }
    } catch (err) {
      console.error("Unexpected error loading boards", err);
    } finally {
      setLoading(false);
    }
  }, [orgId, supabase, user?.id]);

  // favorite callback
  const toggleFavorite = useCallback(
    async (boardId: string, currentOrgId: string, isFavorite: boolean) => {
      try {
        setBoards((prev) =>
          prev.map((board) =>
            board.id === boardId ? { ...board, isFavorite: !isFavorite } : board
          )
        );

        if (isFavorite) {
          // unfavorite
          const { error } = await supabase
            .from("user_favorites")
            .delete()
            .eq("board_id", boardId)
            .eq("user_id", user?.id);

          if (error) {
            console.error("Error unfavoriting board:", error);

            setBoards((prev) =>
              prev.map((board) =>
                board.id === boardId
                  ? { ...board, isFavorite: !isFavorite }
                  : board
              )
            );
          }
        } else {
          // favorite
          const { error } = await supabase.from("user_favorites").insert({
            board_id: boardId,
            org_id: currentOrgId,
            user_id: user?.id,
          });

          if (error) {
            console.error("Error favoriting board:", error);

            setBoards((prev) =>
              prev.map((board) =>
                board.id === boardId
                  ? { ...board, isFavorite: !isFavorite }
                  : board
              )
            );
          }
        }
      } catch (err) {
        console.error("Unexpected error toggling favorite:", err);
      }
    },
    [supabase, user?.id]
  );

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
          event: "INSERT",
          schema: "public",
          table: "boards",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          const newBoard = payload.new as Board;
          setBoards((prev) => [newBoard, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "boards",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          const updatedBoard = payload.new as Board;
          setBoards((prev) =>
            prev.map((board) =>
              board.id === updatedBoard.id ? updatedBoard : board
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "boards",
        },
        (payload) => {
          const deletedBoardId = payload.old?.id;

          if (deletedBoardId) {
            setBoards((prev) =>
              prev.filter((board) => board.id !== deletedBoardId)
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadBoardsCallback, orgId, supabase, user?.id]);

  // favorites effect
  useEffect(() => {
    if (!user?.id) return;

    const favoritesChannel = supabase
      .channel(`user-favorites:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_favorites",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const favoritedBoardId = (payload.new as { board_id?: string })
            ?.board_id;
          setBoards((prev) =>
            prev.map((board) =>
              board.id === favoritedBoardId
                ? { ...board, isFavorite: true }
                : board
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_favorites",
        },
        async () => {
          const { data: favoritesData } = await supabase
            .from("user_favorites")
            .select("board_id")
            .eq("user_id", user?.id);

          const currentFavoriteIds = new Set(
            favoritesData?.map((fav) => fav.board_id) || []
          );

          setBoards((prev) =>
            prev.map((board) => ({
              ...board,
              isFavorite: currentFavoriteIds.has(board.id),
            }))
          );
        }
      )
      .subscribe();

    return () => {
      if (favoritesChannel) supabase.removeChannel(favoritesChannel);
    };
  }, [supabase, user?.id]);

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
          <BoardCard
            key={board.id}
            board={board}
            isFavorite={board.isFavorite}
            onToggleFavorite={() =>
              toggleFavorite(board.id, board.org_id, board.isFavorite)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default BoardList;
