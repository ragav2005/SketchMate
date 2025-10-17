"use client";
import React from "react";
import Image from "next/image";
import NewOrgButton from "./Sidebar/NewOrgButton";
import useAuth from "@/lib/hooks/useAuth";

const EmptyOrg = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Image
        src="/empty_org.svg"
        alt="No Organization"
        width={300}
        height={300}
      />
      <h2 className="mt-4 text-2xl font-semibold text-gray-700">
        Welcome to SketchMate!
      </h2>
      <p className="mt-2 text-gray-500 text-center">
        You are not part of any organization yet. Create <br />
        or join an organization to get started.
      </p>
      <div className="mt-6">
        <NewOrgButton userId={user?.id} isOrgSidebar={true} />
      </div>
    </div>
  );
};

export default EmptyOrg;
