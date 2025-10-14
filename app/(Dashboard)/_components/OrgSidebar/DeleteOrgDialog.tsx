import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Organization } from "../../layout";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Props = {
  org: Organization;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DeleteOrgDialog = ({ org, open, onOpenChange }: Props) => {
  const supabase = createClient();
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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", org.id);

      if (error) {
        toast.error("An error occured in deletion.");
      } else {
        toast.success("Organization deleted successfully.");
      }
    } catch (err) {
      console.log(err);
      toast.error("An error occured in deletion.");
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <>
      {!isControlled && <span onClick={() => setIsOpen(true)}>Delete</span>}

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                This action <strong>cannot be undone</strong>. This will
                permanently delete the organization named
                <strong className="capitalize"> {org.name}</strong>.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="cursor-pointer"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteOrgDialog;
