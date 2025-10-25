"use client";
import { Board } from "@/app/(Dashboard)/_components/BoardList";
import Info from "./Info";
import Participants from "./Participants";
import Toolbar from "./Toolbar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CanvasMode,
  CanvasState,
  Cursor,
  ClientLayer,
  DBLayer,
  LayerType,
  Point,
  Color,
} from "@/types/canvas";
import { useBoardStore } from "@/store/useBoardStore";
import CursorsPresence from "./CursorPresence";
import { RealtimeChannel } from "@supabase/supabase-js";
import useAuth from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { pointerEventToCanvasPoint } from "@/lib/utils";
import { toast } from "sonner";
import LayerPreview from "./LayerPreview";
import { dbLayersToClientLayers, layerTypeToString } from "@/lib/layer-utils";

interface Props {
  boardId: string;
  board: Board | null;
}

export interface PresentUser {
  id: string;
  name: string;
  avatar_url: string;
}

const MAX_LAYERS = 100;

const Canvas = ({ boardId, board }: Props) => {
  const { user } = useAuth();
  const supabase = createClient();

  // realtime states
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [presentUsers, setPresentUsers] = useState<PresentUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [layers, setLayers] = useState<ClientLayer[]>([]);
  // canvas states
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  // const addAction = useBoardStore((state) => state.addAction);
  const canUndo = useBoardStore((state) => state.undoStack.length > 0);
  const canRedo = useBoardStore((state) => state.redoStack.length > 0);
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  const getLayers = useCallback(async () => {
    if (!user) return;

    try {
      const { data: dbLayers, error } = await supabase
        .from("layers")
        .select("*")
        .eq("board_id", boardId);

      if (error) {
        console.log("Error loading Layers", error);
        return;
      }
      if (dbLayers) {
        const clientLayers = dbLayersToClientLayers(dbLayers);
        setLayers(clientLayers);
      }
    } catch (err) {
      console.log("Error loading Layers", err);
    }
  }, [boardId, supabase, user]);

  // layers realtime effect
  useEffect(() => {
    if (!user) return;

    getLayers();

    const channel = supabase
      .channel("custom-update-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "layers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.new?.board_id === boardId) {
            const newLayer = dbLayersToClientLayers([
              payload.new as DBLayer,
            ])[0];
            setLayers((prev) => {
              if (prev.some((l) => l.id === newLayer.id)) {
                return prev;
              }
              return [...prev, newLayer];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "layers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.new?.board_id === boardId) {
            const updatedLayer = dbLayersToClientLayers([
              payload.new as DBLayer,
            ])[0];
            setLayers((prev) =>
              prev.map((l) => (l.id === updatedLayer.id ? updatedLayer : l))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "layers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.old?.board_id === boardId) {
            setLayers((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [getLayers, supabase, user, boardId]);

  // cursors and live avatar effect
  useEffect(() => {
    if (!user) return;

    // channel setup
    const channel = supabase.channel(`board-room:${boardId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    channelRef.current = channel;

    //present users sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users = Object.keys(state).map(
        (key) => state[key][0] as unknown as PresentUser
      );
      setPresentUsers(users);
    });

    //  user join logic
    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      setPresentUsers((currentUsers) => {
        const newUniqueUsers = (
          newPresences as unknown as PresentUser[]
        ).filter((u) => !currentUsers.some((cu) => cu.id === u.id));
        return [...currentUsers, ...newUniqueUsers];
      });
    });

    // cursor broadcast
    channel.on("broadcast", { event: "cursor-pos" }, (data) => {
      const { userId, x, y, name } = data.payload;

      if (userId && userId !== user.id) {
        setCursors((currentCursors) => ({
          ...currentCursors,
          [userId]: {
            userId: userId,
            x: x,
            y: y,
            name: name,
          },
        }));
      }
    });

    // user leave logic for both
    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      const leftUserIds = (leftPresences as unknown as PresentUser[]).map(
        (u) => u.id
      );

      setPresentUsers((currentUsers) =>
        currentUsers.filter((u) => !leftUserIds.includes(u.id))
      );

      setCursors((currentCursors) => {
        const newCursors = { ...currentCursors };
        for (const id of leftUserIds) {
          delete newCursors[id];
        }
        return newCursors;
      });
    });

    // sub - actual user joins
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url:
            user.user_metadata?.avatar_url || user.user_metadata?.picture,
        });
      }
    });

    // hide cursor in sudden situations
    const handleVisibilityChange = () => {
      if (document.hidden && channel) {
        channel.send({
          type: "broadcast",
          event: "cursor-pos",
          payload: {
            userId: user.id,
            x: null,
            y: null,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Teammate",
          },
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // cleanup - actual user leaves
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [boardId, supabase, user]);

  // insert layer
  const inserLayer = useCallback(
    async (
      layerType:
        | LayerType.Ellipse
        | LayerType.Note
        | LayerType.Rectangle
        | LayerType.Text,
      position: Point
    ) => {
      if (!user) return;

      if (layers.length >= MAX_LAYERS) {
        toast.error(
          `Maximum layers (${MAX_LAYERS}) reached. Delete some layers first.`
        );
        return;
      }

      try {
        const { error } = await supabase
          .from("layers")
          .insert([
            {
              board_id: boardId,
              author_id: user.id,
              author_type: "user" as const,
              layer_type: layerTypeToString(layerType),
              x: position.x,
              y: position.y,
              height: 100,
              width: 100,
              fill: lastUsedColor,
            },
          ])
          .select();

        if (error) {
          toast.error("Failed to insert layer.");
          return;
        }
        setCanvasState({ mode: CanvasMode.None });
      } catch (err) {
        toast.error(`Failed to insert layer : ${err}`);
      }
    },
    [user, layers.length, supabase, boardId, lastUsedColor]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  // cursor move event handler
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (channelRef.current && user) {
        const current = pointerEventToCanvasPoint(e, camera);
        channelRef.current.send({
          type: "broadcast",
          event: "cursor-pos",
          payload: {
            userId: user.id,
            x: current.x,
            y: current.y,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "Teammate",
          },
        });
      }
    },
    [camera, user]
  );

  const onPointerLeave = useCallback(() => {
    if (channelRef.current && user) {
      channelRef.current.send({
        type: "broadcast",
        event: "cursor-pos",
        payload: {
          userId: user.id,
          x: null,
          y: null,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "Teammate",
        },
      });
    }
  }, [user]);

  const onPointerup = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);
      console.log({ point, mode: canvasState.mode });

      if (canvasState.mode === CanvasMode.Inserting) {
        inserLayer(canvasState.layerType, point);
      } else {
        setCanvasState({ mode: CanvasMode.None });
      }
    },
    [camera, canvasState, inserLayer]
  );

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info board={board} />
      <Participants presentUsers={presentUsers} />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        canUndo={canUndo}
        redo={redo}
        canRedo={canRedo}
      />
      <svg
        className="h-[100vh] w-[100vw]"
        onPointerMove={onPointerMove}
        onWheel={onWheel}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerup}
      >
        <g style={{ transform: `translate(${camera.x}px, ${camera.y}px)` }}>
          {layers.map((layer) => (
            <LayerPreview
              key={layer.id}
              layer={layer}
              onLayerPointerDown={() => {}}
              selectionColor={"#000"}
            />
          ))}
          <CursorsPresence cursors={cursors} currentUserId={user?.id} />
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
