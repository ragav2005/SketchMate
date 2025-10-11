"use client";
import React, { useEffect, useState } from "react";
import NewButton from "./NewButton";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

const Sidebar = () => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState(null);

  // user effect
  useEffect(() => {
    const getUser = async () => {
      const user = await supabase.auth.getUser();
      setUser(user.data.user);
      console.log(user.data.user);
    };
    getUser();
  }, [supabase.auth]);

  // realtime test
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        (payload) => {
          console.log(" Organization member change detected!", payload);

          if (user?.id) {
            supabase.rpc("get_user_organizations").then(({ data }) => {
              if (data) {
                console.log("Refreshed organizations:", data);
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(" Subscription status:", status);
      });

    return () => {
      console.log(" Cleaning up subscription...");
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  // user organization effect
  useEffect(() => {
    const getOrganization = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase.rpc("get_user_organizations");

      if (error) {
        console.error("Error fetching organizations:", error);
        return;
      }

      if (data) {
        console.log("Initial organizations load:", data);
        setOrganizations(data);
      }
    };
    getOrganization();
  }, [supabase, user?.id]);

  return (
    <aside className="fixed z-[1] left-0 bg-blue-950 h-full w-[60px] flex flex-col p-3 gap-y-4 text-white">
      <NewButton userId={user?.id} />
      <div className="flex-1"></div>
    </aside>
  );
};

export default Sidebar;
