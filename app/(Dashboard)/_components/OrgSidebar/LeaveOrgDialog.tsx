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
import { Organization } from "../../context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import useAuth from "@/lib/hooks/useAuth";

type Props = {
  org: Organization;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const LeaveOrgDialog = ({ org, open, onOpenChange }: Props) => {
  const { user } = useAuth();
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

  const handleLeave = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", org.id)
        .eq("user_id", user.id);
      if (error) {
        toast.error("An error occured while leaving.");
      } else {
        toast.success("Left the organization successfully.");
      }
    } catch (err) {
      console.log(err);
      toast.error("An error occured while leaving.");
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
                This action <strong>cannot be undone</strong>. You will leave
                the organization named
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
            <AlertDialogAction onClick={handleLeave} className="cursor-pointer">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeaveOrgDialog;
