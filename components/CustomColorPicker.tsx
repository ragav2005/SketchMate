"use client";
import { forwardRef, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { cn, colorToCss } from "@/lib/utils";
import { useForwardedRef } from "@/lib/hooks/useForwardedRef";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Color } from "@/types/canvas";
import { Pipette } from "lucide-react";

const hexToColor = (hex: string): Color => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
};

interface ColorPickerProps {
  value: Color;
  onChange: (value: Color) => void;
  onBlur?: () => void;
  lastUsedColor: Color;
  className?: string;
  disabled?: boolean;
  name?: string;
}

const CustomColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      disabled,
      value,
      lastUsedColor,
      onChange,
      onBlur,
      name,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);

    const parsedValue = useMemo(() => {
      return value ? colorToCss(value) : colorToCss(lastUsedColor);
    }, [value, lastUsedColor]);

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn(
              "flex items-center justify-center cursor-pointer",
              className
            )}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size="icon"
            variant="outline"
          >
            <Pipette />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          sideOffset={-1000}
          className="w-full mb-16"
        >
          <DebouncedPicker color={parsedValue} onChange={onChange} />
          <Input
            className="mt-2"
            maxLength={7}
            onChange={(e) => {
              const color = hexToColor(e?.currentTarget?.value);
              onChange(color);
            }}
            ref={ref}
            value={parsedValue}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

const DebouncedPicker = ({
  color,
  onChange,
}: {
  color: string;
  onChange: (value: Color) => void;
}) => {
  const [value, setValue] = useState(color);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleColorChange = (newValue: string) => {
    setValue(newValue);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      const colorObj = hexToColor(newValue);
      onChange(colorObj);
    }, 200);

    setDebounceTimer(timer);
  };

  return <HexColorPicker color={value} onChange={handleColorChange} />;
};

CustomColorPicker.displayName = "ColorPicker";

export { CustomColorPicker };
