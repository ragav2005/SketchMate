"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef } from "react";
import { Organization } from "../../context";
import OrgSwitcher from "./OrgSwitcher";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Star } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import useAuth from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface OrgSidebarProps {
  organizations: Organization[];
  selectedOrg: Organization | null;
  loading: boolean;
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  setSelectedOrg: React.Dispatch<React.SetStateAction<Organization | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const OrgSidebar = ({
  organizations,
  setOrganizations,
  loading,
  selectedOrg,
  setSelectedOrg,
  setLoading,
}: OrgSidebarProps) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const favorites = searchParams.get("favorites") === "true";
  const { user } = useAuth();

  const memberOrgMapRef = useRef<Record<string, string>>({});

  // callback func
  const update_org_rpc = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_user_organizations", {
        input_user_id: user?.id,
      });

      if (error) {
        console.error("Error refreshing organizations:", error);
        return;
      }

      if (data) {
        setOrganizations(data);
        setSelectedOrg(data[0]);
      }
    } catch (error) {
      console.error("Unexpected error refreshing organizations:", error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setOrganizations, setSelectedOrg, supabase, user?.id]);

  // organizations effect organizations and organization_members
  useEffect(() => {
    if (!user?.id) return;

    // first load
    update_org_rpc();

    // leave lookup
    const populateMapFromOrganizations = async () => {
      try {
        const { data: memberData, error } = await supabase
          .from("organization_members")
          .select("id, organization_id")
          .eq("user_id", user.id);

        if (!error && memberData) {
          memberData.forEach((member) => {
            memberOrgMapRef.current[member.id] = member.organization_id;
          });
        }
      } catch (e) {
        console.error("Error pre-populating member map:", e);
      }
    };

    populateMapFromOrganizations();

    const channel = supabase
      .channel(`org-changes:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization_members",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const newData = payload.new as {
              id?: string;
              organization_id?: string;
            };
            if (newData.id && newData.organization_id) {
              memberOrgMapRef.current[newData.id] = newData.organization_id;
            }
          }

          if (payload.old) {
            const oldData = payload.old as { id?: string };
            if (oldData.id) {
              const changedOrgId = memberOrgMapRef.current[oldData.id];
              if (changedOrgId) {
                delete memberOrgMapRef.current[oldData.id];
              }
            }
          }

          update_org_rpc();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organizations",
          filter: `created_by=eq.${user.id}`,
        },
        update_org_rpc
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, update_org_rpc, user?.id]);

  //  organizations change effect
  useEffect(() => {
    if (!user?.id || organizations.length === 0) return;

    const orgIds = organizations.map((org) => org.id);

    const allOrgChannel = supabase
      .channel(`orgs:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organizations",
        },
        (payload) => {
          const changedOrgId =
            (payload.new as { id?: string })?.id ||
            (payload.old as { id?: string })?.id;
          if (changedOrgId && orgIds.includes(changedOrgId)) {
            update_org_rpc();
          }
        }
      )
      .subscribe();

    return () => {
      if (allOrgChannel) supabase.removeChannel(allOrgChannel);
    };
  }, [supabase, update_org_rpc, user?.id, organizations]);

  // member changes effect
  useEffect(() => {
    if (!user?.id || organizations.length === 0) return;

    const orgIds = organizations.map((org) => org.id);

    const memberChannel = supabase
      .channel(`org-members:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization_members",
        },
        (payload) => {
          if (payload.new && Object.keys(payload.new).length > 0) {
            const newData = payload.new as {
              id?: string;
              organization_id?: string;
            };
            if (newData.id && newData.organization_id) {
              memberOrgMapRef.current[newData.id] = newData.organization_id;
            }
          }

          let changedOrgId: string | undefined;

          if (payload.new && Object.keys(payload.new).length > 0) {
            changedOrgId = (payload.new as { organization_id?: string })
              ?.organization_id;
          } else if (payload.old) {
            const oldData = payload.old as { id?: string };
            if (oldData.id) {
              changedOrgId = memberOrgMapRef.current[oldData.id];
              delete memberOrgMapRef.current[oldData.id];
            }
          }

          if (changedOrgId && orgIds.includes(changedOrgId)) {
            update_org_rpc();
          }
        }
      )
      .subscribe();

    return () => {
      if (memberChannel) supabase.removeChannel(memberChannel);
    };
  }, [supabase, update_org_rpc, user?.id, organizations]);

  const handleTeamBoardsClick = () => {
    router.push("/");
  };

  const handleFavoriteBoardsClick = () => {
    router.push("/?favorites=true");
  };

  return (
    <div className="hidden lg:flex flex-col space-y-6 w-[230px] pl-5 pt-5">
      <Link href="/">
        <Image
          src="/logo.svg"
          width={60}
          height={60}
          priority
          alt="SketchMate Logo"
          className="h-auto w-auto hover:scale-[103%] transition-transform duration-200"
        />
      </Link>

      {/* Organization switcher */}
      <OrgSwitcher
        loading={loading}
        organizations={organizations}
        selectedOrg={selectedOrg}
        setSelectedOrg={setSelectedOrg}
        user={user}
      />

      <div className="space-y-1 w-full">
        <Button
          onClick={handleTeamBoardsClick}
          variant={!favorites ? "secondary" : "ghost"}
          size="lg"
          className="font-normal justify-start px-2 w-full cursor-pointer"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Team Boards
        </Button>
        <Button
          onClick={handleFavoriteBoardsClick}
          variant={favorites ? "secondary" : "ghost"}
          size="lg"
          className="font-normal justify-start px-2 w-full cursor-pointer"
        >
          <Star className="h-4 w-4 mr-2" />
          Favorite Boards
        </Button>
      </div>
    </div>
  );
};

export default OrgSidebar;
