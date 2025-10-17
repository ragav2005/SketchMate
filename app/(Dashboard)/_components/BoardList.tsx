import React from "react";
import EmptySearch from "./EmptySates/EmptySearch";
import EmptyFavorites from "./EmptySates/EmptyFavorites";
import EmptyBoard from "./EmptySates/EmptyBoard";

interface BoardListProps {
  orgId: string | undefined;
  query: {
    search?: string | undefined;
    favorites?: string | undefined;
  };
}

const BoardList = ({ orgId, query }: BoardListProps) => {
  const data: string[] = [];

  if (!data?.length && query.search) {
    return <EmptySearch />;
  }

  if (!data?.length && query.favorites) {
    return <EmptyFavorites />;
  }

  if (!data?.length) {
    return <EmptyBoard orgId={orgId} />;
  }

  return <div>BoardList {orgId}</div>;
};

export default BoardList;
