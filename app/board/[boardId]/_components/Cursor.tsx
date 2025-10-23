"use client";
import { MousePointer2 } from "lucide-react";
import { memo } from "react";

interface Props {
  x: number;
  y: number;
  name: string;
  color: string;
}

export const Cursor = memo(({ x, y, name, color }: Props) => {
  return (
    <foreignObject
      style={{
        transform: `translateX(${x}px) translateY(${y}px)`,
      }}
      height={50}
      width={name.length * 10 + 32}
      className="relative drop-shadow-md"
    >
      <MousePointer2
        className="h-5 w-5"
        style={{
          fill: color,
          color: color,
        }}
      />
      <div
        className="absolute left-5 px-2 py-0.5 rounded-md text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </foreignObject>
  );
});

Cursor.displayName = "Cursor";
