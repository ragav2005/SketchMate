import { Loader } from "lucide-react";
import { InfoSkeleton } from "./Info";
import { ToolbarSkeleton } from "./Toolbar";
import { ParticipantsSkeleton } from "./Participants";

export const Loading = () => {
  return (
    <main
      className="h-screen w-full relative bg-neutral-100 touch-none
    flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-gray-600 capitalize">
          loading board
        </p>
      </div>
      <InfoSkeleton />
      <ParticipantsSkeleton />
      <ToolbarSkeleton />
    </main>
  );
};
