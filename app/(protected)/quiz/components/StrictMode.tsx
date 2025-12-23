import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import React from "react";

const StrictMode = ({
  isStrictMode,
  setIsStrictMode,
}: {
  isStrictMode: boolean;
  setIsStrictMode: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div>
      <div className="flex items-center space-x-2">
        <Switch
          id="strict-mode"
          checked={isStrictMode}
          onCheckedChange={(checked) => {
            setIsStrictMode(checked);
          }}
        />
        <Label htmlFor="strict-mode">Enable Strict Mode</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        {isStrictMode
          ? "User will be disquired if they try to exit the fullscreen mode or change the tab!"
          : "User can exit the fullscreen mode & also change the tab!"}
      </p>
    </div>
  );
};

export default StrictMode;
