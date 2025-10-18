"use client";
import React, { useState } from "react";
import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Link2, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import ConfirmModel from "./ConfirmModel";
import { Button } from "./ui/button";
import { useRenameModel } from "@/store/useRenameModel";

interface Props {
  children: React.ReactNode;
  side?: DropdownMenuContentProps["side"];
  sideOffset?: DropdownMenuContentProps["sideOffset"];
  id: string;
  title: string;
}

const Actions = ({ children, side, sideOffset, id, title }: Props) => {
  const supabase = createClient();
  const { onOpen } = useRenameModel();

  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

  const onDelete = async () => {
    try {
      setLoadingDelete(true);
      const { error } = await supabase.from("boards").delete().eq("id", id);
      if (error) {
        toast.error("An error occured in deletion.");
      }
      toast.success("Board deleted successfully!");
    } catch (err) {
      toast.error(`"An error occured in deletion." ${err}`);
    } finally {
      setLoadingDelete(false);
    }
  };

  const onCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/board/${id}`)
      .then(() => {
        toast.success("Link Copied to clipboard!");
      })
      .catch(() => {
        toast.error("Falied to copy link");
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e) => {
          e.stopPropagation();
        }}
        side={side}
        sideOffset={sideOffset}
        className="w-60"
      >
        <DropdownMenuItem className="p-3 cursor-pointer" onClick={onCopyLink}>
          <Link2 className="h-4 w-4 mr-2" /> Copy board link
        </DropdownMenuItem>
        <DropdownMenuItem
          className="p-3 cursor-pointer"
          onClick={() => onOpen(id, title)}
        >
          <PenLine className="h-4 w-4 mr-2" /> Rename
        </DropdownMenuItem>
        <ConfirmModel
          header="Delete Board?"
          description="This will delete the board and all of its content"
          disabled={loadingDelete}
          onConfirm={onDelete}
        >
          <Button
            variant="ghost"
            className="px-3 py-5 cursor-pointer w-full text-sm justify-start font-normal text-red-500 hover:text-red-600 hover:bg-red-100/50"
            // onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </ConfirmModel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Actions;
