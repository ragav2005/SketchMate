import React from "react";
import { LucideIcon } from "lucide-react";
import Hint from "@/components/hint";
import { Button } from "@/components/ui/button";

interface Props {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

const ToolButton = ({
  label,
  icon: Icon,
  onClick,
  isActive,
  isDisabled,
}: Props) => {
  return (
    <Hint label={label} side="right">
      <Button
        disabled={isDisabled}
        onClick={onClick}
        size="icon"
        variant={isActive ? "boardActive" : "board"}
        className="cursor-pointer"
      >
        <Icon />
      </Button>
    </Hint>
  );
};

export default ToolButton;
