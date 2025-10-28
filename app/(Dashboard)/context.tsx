"use client";
import { createContext, Dispatch, SetStateAction } from "react";

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
