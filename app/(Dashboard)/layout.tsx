"use client";
import React, {
  useState,
  createContext,
  Dispatch,
  SetStateAction,
} from "react";
import Sidebar from "./_components/Sidebar";
import OrgSidebar from "./_components/OrgSidebar";
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

export const DashboardContext = createContext<{
  organizations: Organization[];
  selectedOrg: Organization | null;
  loading: boolean;
  setOrganizations: Dispatch<SetStateAction<Organization[]>>;
  setSelectedOrg: Dispatch<SetStateAction<Organization | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
} | null>(null);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { user, loading: userLoading } = useAuth();

  if (userLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="h-full">
      <Sidebar
        setSelectedOrg={setSelectedOrg}
        organizations={organizations}
        selectedOrg={selectedOrg}
      />
      <div className="h-full pl-[60px]">
        <div className="flex h-full gap-x-3">
          <OrgSidebar
            organizations={organizations}
            setOrganizations={setOrganizations}
            selectedOrg={selectedOrg}
            setSelectedOrg={setSelectedOrg}
            loading={loading}
            setLoading={setLoading}
          />

          <div className="flex-1 flex flex-col min-h-screen">
            <Navbar
              organizations={organizations}
              selectedOrg={selectedOrg}
              setSelectedOrg={setSelectedOrg}
              loading={loading}
            />
            <DashboardContext.Provider
              value={{
                organizations,
                selectedOrg,
                loading,
                setOrganizations,
                setSelectedOrg,
                setLoading,
              }}
            >
              {children}
            </DashboardContext.Provider>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;
