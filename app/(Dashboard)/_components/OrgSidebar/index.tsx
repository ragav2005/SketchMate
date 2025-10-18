"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect } from "react";
import { Organization } from "../../layout";
import OrgSwitcher from "./OrgSwitcher";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const favorites = searchParams.get("favorites");
  const { user } = useAuth();

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

  // Organizations effect organizations and organization_members
  useEffect(() => {
    if (!user?.id) return;

    // first load
    update_org_rpc();

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
        update_org_rpc
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

  // Listen for changes in organizations
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

  // Listen for member changes
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
          const changedOrgId =
            (payload.new as { organization_id?: string })?.organization_id ||
            (payload.old as { organization_id?: string })?.organization_id;
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

  return (
    <div className="hidden lg:flex flex-col space-y-6 w-[206px] pl-5 pt-5">
      <Link href="/">
        <Image
          src="/logo.svg"
          width={60}
          height={60}
          priority
          alt="SketchMate Logo"
          className="h-auto w-auto hover:scale-[103%] transition"
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
          asChild
          variant={!favorites ? "secondary" : "ghost"}
          size="lg"
          className="font-normal justify-start px-2 w-full"
        >
          <Link href="/">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Team Boards
          </Link>
        </Button>
        <Button
          asChild
          variant={favorites ? "secondary" : "ghost"}
          size="lg"
          className="font-normal justify-start px-2 w-full"
        >
          <Link
            href={{
              pathname: "/",
              query: { favorites: true },
            }}
          >
            <Star className="h-4 w-4 mr-2" />
            Favorite Boards
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default OrgSidebar;
