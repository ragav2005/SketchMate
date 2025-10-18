"use client";

import { FormEventHandler, useEffect, useState } from "react";
import { useRenameModel } from "@/store/useRenameModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const RenameModel = () => {
  const supabase = createClient();
  const { isOpen, onClose, initialValues } = useRenameModel();
  const [title, setTitle] = useState<string>(initialValues.title);
  const [loadingRename, setLoadingRename] = useState<boolean>(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    try {
      setLoadingRename(true);
      const { error } = await supabase
        .from("boards")
        .update({ title: title })
        .eq("id", initialValues.id)
        .select();
      if (error) {
        toast.error("An error occured in renaming.");
      }
      toast.success("Board renamed successfully!");
      onClose();
    } catch (err) {
      toast.error(`"An error occured in renaming." ${err}`);
    } finally {
      setLoadingRename(false);
    }
  };

  useEffect(() => {
    setTitle(initialValues.title);
  }, [initialValues.title]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] [&_[data-slot='dialog-close']]:hover:bg-gray-100 [&_[data-slot='dialog-close']]:transition-colors [&_[data-slot='dialog-close']]:rounded-md [&_[data-slot='dialog-close']]:border-none [&_[data-slot='dialog-close']]:p-1.5 [&_[data-slot='dialog-close']]:text-gray-500 [&_[data-slot='dialog-close']]:hover:text-gray-700 [&_[data-slot='dialog-close']]:outline-none [&_[data-slot='dialog-close']]:cursor-pointer [&_[data-slot='dialog-close']]:focus:ring-0 [&_[data-slot='dialog-close']]:focus:ring-offset-0">
        <DialogHeader>
          <DialogTitle>Edit board title</DialogTitle>
        </DialogHeader>
        <DialogDescription>Enter a new title for the board</DialogDescription>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            disabled={loadingRename}
            required
            maxLength={60}
            value={title}
            placeholder="Board title"
            onChange={(e) => setTitle(e.target.value)}
          />
          <DialogFooter className="flex items-center gap-6">
            <Button
              variant="outline"
              type="button"
              className="cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loadingRename}
              className="cursor-pointer"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameModel;
