"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
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
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
  setSelectedOrg: React.Dispatch<React.SetStateAction<Organization | null>>;
}

const OrgSidebar = ({
  organizations,
  setOrganizations,
  selectedOrg,
  setSelectedOrg,
}: OrgSidebarProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const favorites = searchParams.get("favorites");
  const { user } = useAuth();

  // Organizations effect
  useEffect(() => {
    if (!user?.id) return;

    let channel: ReturnType<typeof supabase.channel> | undefined;

    const orgRealtimeLoad = async () => {
      try {
        setLoading(true);
        // first load
        const { data, error } = await supabase.rpc("get_user_organizations");

        if (error) {
          console.error("Error loading organizations:", error);
          return;
        }

        if (data) {
          setOrganizations(data);
          setSelectedOrg(data[0]);
        }
      } catch (error) {
        console.error("Unexpected error loading organizations:", error);
      } finally {
        setLoading(false);
      }

      // real time updates
      channel = supabase
        .channel("org-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "organizations" },
          async () => {
            try {
              setLoading(true);
              const { data, error } = await supabase.rpc(
                "get_user_organizations"
              );

              if (error) {
                console.error("Error refreshing organizations:", error);
                return;
              }

              if (data) {
                setOrganizations(data);
                setSelectedOrg(data[0]);
              }
            } catch (error) {
              console.error(
                "Unexpected error refreshing organizations:",
                error
              );
            } finally {
              setLoading(false);
            }
          }
        )
        .subscribe();
    };

    orgRealtimeLoad();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, setOrganizations, setSelectedOrg]);

  return (
    <div className="hidden lg:flex flex-col space-y-6 w-[206px] pl-5 pt-5">
      <Link href="/">
        <Image
          src="/logo.svg"
          width={60}
          height={60}
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
