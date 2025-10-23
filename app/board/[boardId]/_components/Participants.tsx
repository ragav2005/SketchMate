"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loading } from "./loading";
import useAuth from "@/lib/hooks/useAuth";
import UserAvatar from "./UserAvatar";
import { idToColor } from "@/lib/utils";

interface PresentUsers {
  id: string;
  name: string;
  avatar_url: string;
}

const MAX_SHOWN_USERS = 2;

const Participants = ({ boardId }: { boardId: string }) => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [presentUsers, setPresentUsers] = useState<PresentUsers[]>([]);
  const hasMoreUsers: boolean = presentUsers.length > MAX_SHOWN_USERS;

  //presence effect

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const channel = supabase.channel(`board-room:${boardId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // sync - get all present users
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();

      const users = Object.keys(state).map(
        (key) => state[key][0] as unknown as PresentUsers
      );

      setPresentUsers(users);
      setLoading(false);
    });

    // join - new user joined
    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      setPresentUsers((currentUsers) => {
        const newUniqueUsers = (
          newPresences as unknown as PresentUsers[]
        ).filter((u) => !currentUsers.some((cu) => cu.id === u.id));
        return [...currentUsers, ...newUniqueUsers];
      });
    });

    // leave - user left
    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      const leftUserIds = (leftPresences as unknown as PresentUsers[]).map(
        (u) => u.id
      );
      setPresentUsers((currentUsers) =>
        currentUsers.filter((u) => !leftUserIds.includes(u.id))
      );
    });

    // sub - actual join user
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

    // cleanup - actual user leaves
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, supabase, user]);

  if (loading) {
    return <Loading />;
  }

  const currentUserData = presentUsers.find((u) => u.id === user?.id);
  const otherUsers = presentUsers.filter((u) => u.id !== user?.id);
  const orderedUsers = currentUserData
    ? [currentUserData, ...otherUsers]
    : presentUsers;

  return (
    <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md">
      <div className="flex pl-2">
        {orderedUsers.slice(0, MAX_SHOWN_USERS).map((u, index) => (
          <div key={u.id} className={`${index > 0 ? "-ml-2" : ""} relative`}>
            <UserAvatar
              borderColor={idToColor(u.id)}
              name={u.name}
              src={u.avatar_url}
              isCurrentUser={u.id === user?.id}
            />
          </div>
        ))}
        {hasMoreUsers && (
          <div className="-ml-2 relative">
            <UserAvatar
              name={`+ ${orderedUsers.length - MAX_SHOWN_USERS} more`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Participants;

export function ParticipantsSkeleton() {
  return (
    <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md w-[100px]" />
  );
}
