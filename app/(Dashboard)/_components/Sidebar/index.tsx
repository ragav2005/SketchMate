"use client";
import React from "react";
import NewOrgButton from "./NewOrgButton";
import Hint from "@/components/hint";
import { Organization } from "../../context";
import useAuth from "@/lib/hooks/useAuth";
import { LogOut } from "lucide-react";

interface Props {
  organizations: Organization[];
  selectedOrg: Organization | null;
  setSelectedOrg: React.Dispatch<React.SetStateAction<Organization | null>>;
}

const Sidebar = ({ setSelectedOrg, organizations, selectedOrg }: Props) => {
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed z-[1] left-0 bg-blue-950 h-full w-[60px] flex flex-col p-3 gap-y-4 text-white">
      {organizations &&
        organizations.map((org) => (
          <div key={org.id} className="flex flex-col gap-y-3">
            <Hint label={org.name.trim()} side="right" align="start">
              <div
                className={`relative px-2 py-1.5 flex items-center justify-center rounded-lg text-white font-semibold text-sm transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                  selectedOrg?.id === org.id
                    ? "bg-blue-400/30 shadow-lg ring-[2px] ring-blue-200/50 ring-opacity-50"
                    : "bg-white/10 hover:bg-white/20 hover:shadow-md"
                }`}
                onClick={() => setSelectedOrg(org)}
              >
                {org.name.trim().charAt(0).toUpperCase()}
              </div>
            </Hint>
          </div>
        ))}
      <NewOrgButton userId={user?.id} isOrgSidebar={false} />

      {user && (
        <div className="absolute bottom-4 left-3 right-3">
          <Hint label="Logout" side="right" align="start">
            <div className="aspect-square cursor-pointer" onClick={signOut}>
              <div className=" group bg-white/10 w-full h-full flex items-center justify-center rounded-md opacity-70 hover:opacity-100 hover:bg-red-500/20 transition">
                <LogOut
                  className="text-white group-hover:text-red-400"
                  height={20}
                  width={20}
                />
              </div>
            </div>
          </Hint>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
