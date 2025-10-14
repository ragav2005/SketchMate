"use client";
import React, { useState } from "react";
import { Organization } from "../../layout";
import { ChevronsUpDown, EllipsisVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import NewOrgButton from "../Sidebar/NewOrgButton";
import DeleteOrgDialog from "./DeleteOrgDialog";
import EditOrgDialog from "./EditOrgDialog";
import InviteDialog from "./InviteDialog";

//shadcn
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//props
interface OrgSwitcherProps {
  loading: boolean;
  organizations: Organization[];
  selectedOrg: Organization | null;
  setSelectedOrg: React.Dispatch<React.SetStateAction<Organization | null>>;
  user: User | null;
}

//component
const OrgSwitcher = ({
  loading,
  organizations,
  selectedOrg,
  setSelectedOrg,
  user,
}: OrgSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [invitingOrg, setinvitingOrg] = useState<Organization | null>(null);

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          {selectedOrg ? (
            <>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {selectedOrg.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate capitalize">
                  {selectedOrg.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedOrg.member_count}{" "}
                  {selectedOrg.member_count === 1 ? "member" : "members"}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 text-left flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Select organization</p>
              )}
            </div>
          )}

          <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[240px] p-2" align="start">
        <div className="space-y-1">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrg(org)}
              className={cn(
                "w-full flex items-center gap-3 px-1.5 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition group",
                selectedOrg?.id === org.id &&
                  "bg-gray-200/80 border-1 border-gray-300"
              )}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {org.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 text-left min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate capitalize">
                    {org.name}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {org.member_count}
                    {org.member_count === 1 ? " member" : " members"}
                  </p>
                  {org.is_creator && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                      Owner
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <EllipsisVertical color="#5e5c64" className="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  alignOffset={24}
                  side="right"
                  sideOffset={-8}
                  className="w-48 p-1.5"
                >
                  {/* invite user */}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    onSelect={(e) => {
                      e.preventDefault();
                      setinvitingOrg(org);
                    }}
                  >
                    <span>Invite User</span>
                  </DropdownMenuItem>

                  {/* edit org */}
                  {org.created_by === user?.id && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      onSelect={(e) => {
                        e.preventDefault();
                        setEditingOrg(org);
                      }}
                    >
                      <span>Edit</span>
                    </DropdownMenuItem>
                  )}

                  {/* delete org */}
                  {org.created_by === user?.id && (
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      onSelect={(e) => {
                        e.preventDefault();
                        setDeletingOrg(org);
                      }}
                    >
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </button>
          ))}

          {organizations.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
          )}

          <NewOrgButton userId={user?.id} isOrgSidebar={true} />

          {deletingOrg && (
            <DeleteOrgDialog
              org={deletingOrg}
              open={Boolean(deletingOrg)}
              onOpenChange={(open) => {
                if (!open) setDeletingOrg(null);
              }}
            />
          )}
          {editingOrg && (
            <EditOrgDialog
              org={editingOrg}
              open={Boolean(editingOrg)}
              onOpenChange={(open: boolean) => {
                if (!open) setEditingOrg(null);
              }}
            />
          )}

          {invitingOrg && (
            <InviteDialog
              org={invitingOrg}
              open={Boolean(invitingOrg)}
              onOpenChange={(open: boolean) => {
                if (!open) setinvitingOrg(null);
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrgSwitcher;
