"use client";
import { useEffect, useState } from "react";
import RenameModel from "@/components/RenameModel";

const ModelProvider = () => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return (
    <>
      <RenameModel />
    </>
  );
};

export default ModelProvider;
