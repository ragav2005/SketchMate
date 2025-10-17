"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
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

  // Organizations effect
  useEffect(() => {
    if (!user?.id) return;

    let channel: ReturnType<typeof supabase.channel> | undefined;

    const orgRealtimeLoad = async () => {
      try {
        setLoading(true);
        // first load
        const { data, error } = await supabase.rpc("get_user_organizations", {
          input_user_id: user.id,
        });
        console.log(data, error);
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

      // real time update
      channel = supabase
        .channel("org-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "organizations" },
          async () => {
            try {
              setLoading(true);
              const { data, error } = await supabase.rpc(
                "get_user_organizations",
                {
                  input_user_id: user.id,
                }
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
  }, [user?.id, supabase, setOrganizations, setSelectedOrg, setLoading]);

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
