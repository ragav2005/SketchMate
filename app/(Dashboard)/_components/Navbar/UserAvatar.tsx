import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Hint from "@/components/hint";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, X } from "lucide-react";
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

interface Props {
  user: User;
}

const UserAvatar = ({ user }: Props) => {
  const supabase = createClient();
  const fullName = user?.user_metadata?.full_name || "";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const [name, setName] = useState<string>(fullName);
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);

  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // name save handler
  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
        full_name: name.trim(),
      },
    });

    if (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    } else {
      toast.success("Profile updated successfully!");
      setOpen(false);
    }

    setLoading(false);
  };

  // avatar selection & staging handler
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // upload handler
  const handleAvatarUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !user) return;

    const file = fileInputRef.current.files[0];
    setUploading(true);

    try {
      if (avatarUrl) {
        const oldFileName = avatarUrl.split("/").pop();
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage
            .from("user_avatars")
            .remove([oldFileName]);
          if (deleteError) {
            console.error("Error deleting old avatar:", deleteError);
          }
        }
      }

      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("user_avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        toast.error("Failed to upload avatar. Please try again.");
        console.error("Upload error:", uploadError);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("user_avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        toast.error("Failed to update profile. Please try again.");
        console.error("Update error:", updateError);
      } else {
        toast.success("Avatar updated successfully!");
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };
  // avatar remove handler
  const handleAvatarRemove = async () => {
    if (!user || !avatarUrl) return;

    setUploading(true);

    try {
      const fileName = avatarUrl.split("/").pop();

      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from("user_avatars")
          .remove([fileName]);

        if (deleteError) {
          console.error("Error deleting avatar file:", deleteError);
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: null,
        },
      });

      if (error) {
        toast.error("Failed to remove avatar. Please try again.");
        console.error("Remove error:", error);
      } else {
        toast.success("Avatar removed successfully!");
        setImageError(false);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="cursor-pointer">
        <div>
          <Hint label={fullName}>
            <Avatar>
              {!imageError && avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={32}
                  height={32}
                  className="aspect-square size-full rounded-full"
                  unoptimized
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    console.log("Avatar failed to load:", avatarUrl);
                    setImageError(true);
                  }}
                />
              )}
              {(imageError || !avatarUrl) && (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
          </Hint>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] [&>button]:hover:bg-gray-100 [&>button]:transition-colors [&>button]:rounded-md [&>button]:p-1.5 [&>button]:text-gray-500 [&>button]:hover:text-gray-700 [&>button]:cursor-pointer">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        {/* avatar section */}
        <div className="space-y-4 py-4 border-b">
          <div className="space-y-3">
            <label className="text-sm font-medium">Profile Picture</label>

            <div className="flex flex-col items-center gap-4">
              <div className="relative h-32 w-32">
                <div className="h-full w-full rounded-full border-4 border-blue-200 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-lg">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Avatar preview"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                      unoptimized
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Avatar className="w-30 h-30">
                      {!imageError && avatarUrl && (
                        <Image
                          src={avatarUrl}
                          alt={fullName}
                          width={128}
                          height={128}
                          className="aspect-square size-full rounded-full"
                          unoptimized
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          onError={() => {
                            console.log("Avatar failed to load:", avatarUrl);
                            setImageError(true);
                          }}
                        />
                      )}
                      {(imageError || !avatarUrl) && (
                        <AvatarFallback className="w-30 h-30 text-4xl bg-gray-200">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                </div>
                {previewUrl && (
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 gap-2 cursor-pointer"
                >
                  <Upload size={16} />
                  Choose Image
                </Button>

                {previewUrl && (
                  <Button
                    type="button"
                    onClick={handleAvatarUpload}
                    disabled={uploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                )}

                {avatarUrl && !previewUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleAvatarRemove}
                    disabled={uploading}
                    className="flex-1 gap-2 cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* name section */}
        <div className="grid gap-3">
          <label htmlFor="name-1">Name</label>
          <Input
            id="name-1"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading || uploading}>
            {loading ? "Saving" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserAvatar;
