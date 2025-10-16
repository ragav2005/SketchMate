"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Organization } from "../../layout";
import { DialogDescription } from "@radix-ui/react-dialog";

type Props = {
  org: Organization | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const InviteDialog = ({ org, open, onOpenChange }: Props) => {
  const [mail, setMail] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
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

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (isOpen && !inviteToken) {
      generateInviteLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inviteToken]);

  const generateInviteLink = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/invites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org?.id,
          maxUses: null,
          expiresInDays: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to generate invite link");
        return;
      }

      const token = data.invite.token;
      setInviteToken(token);
      setInviteLink(`${window.location.origin}/invite/${token}`);
    } catch (error) {
      console.error("Error generating invite:", error);
      toast.error("Failed to generate invite link");
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  };

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invitation link copied to clipboard");
    } catch {
      toast.error("Failed to copy the link");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mail.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!inviteLink) {
      toast.error("Invite link not generated yet");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/invites/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mail,
          inviteLink,
          organizationName: org?.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send invite email");
        return;
      }

      toast.success(`Invitation sent to ${mail}`);
      setMail("");
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <span onClick={() => setIsOpen(true)}>Invite User</span>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] [&>button]:hover:bg-gray-100 [&>button]:transition-colors [&>button]:rounded-md [&>button]:p-1.5 [&>button]:text-gray-500 [&>button]:hover:text-gray-700 [&>button]:cursor-pointer">
          <form className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>{`Invite member to ${org?.name
                .trim()
                .replace(/\b\w/g, (l) => l.toUpperCase())}`}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mr-6">
                Copy the invitation link below, or enter an email address to
                send the invite directly to the recipient.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-md border border-gray-200 dark:border-gray-700 bg-muted/50 p-2 overflow-x-auto">
                <p className="text-xs font-mono text-gray-700 dark:text-gray-200 truncate whitespace-nowrap max-w-[300px]  ">
                  {inviteLink ||
                    (isGenerating ? "Generating link..." : "Click to generate")}
                </p>
              </div>
              <Button
                variant="ghost"
                className="px-3 py-2 text-sm"
                onClick={handleCopy}
                disabled={!inviteLink || isGenerating}
              >
                Copy
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-md">
                Email address
              </label>
              <input
                id="name"
                name="name"
                placeholder="Enter recipient's email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
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
                onClick={handleSubmit}
              >
                {isLoading ? "Inviting..." : "Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InviteDialog;
