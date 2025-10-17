import React, { useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  orgId: string | undefined;
  authorId: string | undefined;
  authorName: string | undefined;
}

const images = [
  "/placeholders/1.svg",
  "/placeholders/2.svg",
  "/placeholders/3.svg",
  "/placeholders/4.svg",
  "/placeholders/5.svg",
  "/placeholders/6.svg",
  "/placeholders/7.svg",
  "/placeholders/8.svg",
  "/placeholders/9.svg",
  "/placeholders/10.svg",
];

const NewBoardButton = ({ orgId, authorId, authorName }: Props) => {
  const supabase = createClient();
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorId) {
      toast.error("You must be logged in to create an board");
      return;
    }

    setIsLoading(true);
    try {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      const { error } = await supabase
        .from("boards")
        .insert({
          title: title.trim(),
          org_id: orgId,
          author_id: authorId,
          author_name: authorName,
          image_url: randomImage,
        })
        .select()
        .single();
      if (error) {
        console.log("Error creating board:", error);
        toast.error("Failed to create board");
        return;
      }

      toast.success("Board created successfully!");
      setTitle("");
      setIsOpen(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setTitle("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button size="lg" className="cursor-pointer">
            Create new board
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] [&>button]:hover:bg-gray-100 [&>button]:transition-colors [&>button]:rounded-md [&>button]:p-1.5 [&>button]:text-gray-500 [&>button]:hover:text-gray-700 [&>button]:cursor-pointer">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>Create new board</DialogTitle>
              <DialogDescription>
                Enter the name for your new board. Click create when you&apos;re
                done.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-md">
                Name
              </label>
              <input
                id="name"
                name="name"
                placeholder="Enter board name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-2 border-gray-500/60 py-1.5 px-3 rounded-lg focus:outline-0"
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
    </div>
  );
};

export default NewBoardButton;
