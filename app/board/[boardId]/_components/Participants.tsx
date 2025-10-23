"use client";
import useAuth from "@/lib/hooks/useAuth";
import UserAvatar from "./UserAvatar";
import { idToColor } from "@/lib/utils";
import { PresentUser } from "./Canvas";

const MAX_SHOWN_USERS = 2;

const Participants = ({ presentUsers }: { presentUsers: PresentUser[] }) => {
  const { user } = useAuth();
  const hasMoreUsers: boolean = presentUsers.length > MAX_SHOWN_USERS;

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
