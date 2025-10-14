"use client";
import React from "react";
import NewOrgButton from "./NewOrgButton";
import Hint from "@/components/hint";
import { Organization } from "../../layout";
import useAuth from "@/lib/hooks/useAuth";
const Sidebar = ({ selectedOrg }: { selectedOrg: Organization | null }) => {
  const { user } = useAuth();

  return (
    <aside className="fixed z-[1] left-0 bg-blue-950 h-full w-[60px] flex flex-col p-3 gap-y-4 text-white">
      {selectedOrg && (
        <div className="flex flex-col gap-y-3">
          <Hint label={selectedOrg.name.trim()} side="right" align="start">
            <div className="px-2 py-1.5 bg-white/20 hover:bg-white/30 flex items-center justify-center rounded-lg text-white font-medium text-sm transition-colors cursor-pointer">
              {selectedOrg.name.trim().charAt(0).toUpperCase()}
            </div>
          </Hint>
        </div>
      )}
      <NewOrgButton userId={user?.id} isOrgSidebar={false} />
      <div className="flex-1"></div>
    </aside>
  );
};

export default Sidebar;
