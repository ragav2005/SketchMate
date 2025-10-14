"use client";
import React, { useState } from "react";
import Sidebar from "./_components/Sidebar";
import OrgSidebar from "./_components/OrgSidebar/page";
import Navbar from "./_components/Navbar";
import useAuth from "@/lib/hooks/useAuth";
import AuthLoading from "@/components/AuthLoading";

export interface Organization {
  id: string;
  name: string;
  is_creator: boolean;
  created_by: string;
  member_count: number;
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="h-full">
      <Sidebar selectedOrg={selectedOrg} />
      <div className="h-full pl-[60px]">
        <div className="flex h-full gap-x-3">
          <OrgSidebar
            organizations={organizations}
            setOrganizations={setOrganizations}
            selectedOrg={selectedOrg}
            setSelectedOrg={setSelectedOrg}
          />
          <div className="h-full flex-1">
            <Navbar />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;
