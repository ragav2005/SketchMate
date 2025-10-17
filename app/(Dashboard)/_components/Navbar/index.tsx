import React, { useState } from "react";
import Image from "next/image";
import SearchInput from "./SearchInput";
import useAuth from "@/lib/hooks/useAuth";
import OrgSwitcher from "../OrgSidebar/OrgSwitcher";
import { Organization } from "../../layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import InviteDialog from "../OrgSidebar/InviteDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  organizations: Organization[];
  loading: boolean;
  selectedOrg: Organization | null;
  setSelectedOrg: React.Dispatch<React.SetStateAction<Organization | null>>;
}
const Navbar = ({
  organizations,
  loading,
  selectedOrg,
  setSelectedOrg,
}: Props) => {
  const { user } = useAuth();
  const [invitingOrg, setinvitingOrg] = useState<Organization | null>(null);
  const [imageError, setImageError] = useState(false);
  const fullName = user?.user_metadata?.full_name || "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-x-4 p-5">
      <div className="hidden lg:flex lg:flex-1">
        <SearchInput />
      </div>
      <div className="block lg:hidden flex-1 max-w-[376px] mr-auto">
        {/* Organization switcher */}
        <OrgSwitcher
          loading={loading}
          organizations={organizations}
          selectedOrg={selectedOrg}
          setSelectedOrg={setSelectedOrg}
          user={user}
        />
      </div>
      {selectedOrg && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setinvitingOrg(selectedOrg);
          }}
        >
          <Plus className=" h-4 w-4" />
          Invite Members
        </Button>
      )}
      <Avatar>
        {!imageError && avatarUrl && (
          <Image
            src={avatarUrl}
            alt={fullName}
            width={32}
            height={32}
            className="aspect-square size-full rounded-full"
            unoptimized
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={() => {
              console.log("Avatar failed to load:", avatarUrl);
              setImageError(true);
            }}
          />
        )}
        {(imageError || !avatarUrl) && (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>
      {invitingOrg && (
        <InviteDialog
          org={selectedOrg}
          open={Boolean(selectedOrg)}
          onOpenChange={(open: boolean) => {
            if (!open) setinvitingOrg(null);
          }}
        />
      )}
    </div>
  );
};

export default Navbar;
