"use client";
import React, { use, useContext } from "react";
import EmptyOrg from "./_components/EmptyOrg";
import { DashboardContext } from "./layout";
import BoardList from "./_components/BoardList";
import useAuth from "@/lib/hooks/useAuth";

interface DashboardProps {
  searchParams: Promise<{
    search?: string;
    favorites?: string;
  }>;
}

const Dashboard = ({ searchParams }: DashboardProps) => {
  const query = use(searchParams);
  const { loading: userLoading } = useAuth();
  const context = useContext(DashboardContext);
  if (!context) return null;

  const { organizations, selectedOrg, loading } = context;

  if (loading || userLoading) {
    return <LoadingComponent />;
  }

  return (
    <div className="flex-1 h-full p-6">
      {!organizations ? (
        <EmptyOrg />
      ) : (
        <BoardList orgId={selectedOrg?.id} query={query} />
      )}
    </div>
  );
};

export default Dashboard;

const LoadingComponent = () => (
  <div className="flex flex-col items-center justify-center h-full">
    <div className="animate-spin rounded-full h-18 w-18 border-b-2 border-blue-600"></div>
    <p className="mt-6 text-gray-600 text-lg">Loading organizations...</p>
  </div>
);
