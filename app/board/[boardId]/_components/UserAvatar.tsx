import Hint from "@/components/hint";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  src?: string;
  name: string;
  borderColor?: string;
  isCurrentUser?: boolean;
}
const UserAvatar = ({ src, name, borderColor, isCurrentUser }: Props) => {
  const fallback: string =
    name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "T";

  return (
    <Hint
      label={isCurrentUser ? `${name} (You)` : name || "TeamMate"}
      side="bottom"
      sideOffset={-2}
    >
      <Avatar className="h-8 w-8 border-2" style={{ borderColor }}>
        <AvatarImage src={src} />
        <AvatarFallback className="text-xs font-semibold">
          {fallback}
        </AvatarFallback>
      </Avatar>
    </Hint>
  );
};

export default UserAvatar;
