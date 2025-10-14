"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Organization } from "../../layout";

type Props = {
  org: Organization;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const EditOrgButton = ({ org, open, onOpenChange }: Props) => {
  const supabase = createClient();
  const [name, setName] = useState<string>(org.name);
  const [isLoading, setIsLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: name })
        .eq("id", org.id)
        .select();

      if (error) {
        console.log("Error creating organization:", error);
        toast.error("Failed to create organization");
        return;
      }

      toast.success("Organization updated successfully!");
      setName("");
      setIsOpen(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isControlled && <span onClick={() => setIsOpen(true)}>Delete</span>}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] [&>button]:hover:bg-gray-100 [&>button]:transition-colors [&>button]:rounded-md [&>button]:p-1.5 [&>button]:text-gray-500 [&>button]:hover:text-gray-700 [&>button]:cursor-pointer">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>Update organization</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-md">
                Name
              </label>
              <input
                id="name"
                name="name"
                placeholder="Enter organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-2 border-gray-500/60 py-1.5 px-3 rounded-lg focus:outline-0  transition focus:shadow-lg"
                disabled={isLoading}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditOrgButton;
