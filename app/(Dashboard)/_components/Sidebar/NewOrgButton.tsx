"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Hint from "@/components/hint";

const NewOrgButton = ({
  userId,
  isOrgSidebar,
}: {
  userId: string | undefined;
  isOrgSidebar: boolean;
}) => {
  const supabase = createClient();
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to create an organization");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("organizations")
        .insert({
          name: name.trim(),
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        console.log("Error creating organization:", error);
        toast.error("Failed to create organization");
        return;
      }

      toast.success("Organization created successfully!");
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setName("");
        }
      }}
    >
      <DialogTrigger asChild>
        {isOrgSidebar ? (
          <div className="w-full flex items-center gap-4 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span>Create organization</span>
          </div>
        ) : (
          <div className="aspect-square cursor-pointer">
            <Hint label="Create new organization" side="right" align="start">
              <div className="bg-white/25 w-full h-full flex items-center justify-center rounded-md opacity-70 hover:opacity-100 transition">
                <Plus className="text-white" />
              </div>
            </Hint>
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] [&>button]:hover:bg-gray-100 [&>button]:transition-colors [&>button]:rounded-md [&>button]:p-1.5 [&>button]:text-gray-500 [&>button]:hover:text-gray-700 [&>button]:cursor-pointer">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Create new organization</DialogTitle>
            <DialogDescription>
              Enter the name for your new organization. Click create when
              you&apos;re done.
            </DialogDescription>
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
              className="border-2 border-gray-500/60 py-1.5 px-3 rounded-lg focus:outline-0 transition focus:shadow-lg"
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
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewOrgButton;
