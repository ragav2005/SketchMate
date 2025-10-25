"use client";

import { memo } from "react";
import { idToColor } from "@/lib/utils";
import { Cursor } from "./Cursor";
interface CursorData {
  userId: string;
  x: number | null;
  y: number | null;
  name: string;
}

interface Props {
  cursors: Record<string, CursorData>;
  currentUserId?: string;
}

const CursorsPresence = memo(({ cursors, currentUserId }: Props) => {
  const cursorValues = Object.values(cursors);

  return (
    <>
      {cursorValues.map(({ userId, x, y, name }) => {
        if (x === null || y === null) {
          return null;
        }

        if (currentUserId && userId === currentUserId) {
          return null;
        }

        return (
          <Cursor
            key={userId}
            x={x}
            y={y}
            name={name}
            color={idToColor(userId)}
          />
        );
      })}
    </>
  );
});

CursorsPresence.displayName = "CursorsPresence";
export default CursorsPresence;
