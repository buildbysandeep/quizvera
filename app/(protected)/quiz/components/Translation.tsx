import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useEffect } from "react";

const Translation = ({
  translation,
  setTranslation,
}: {
  translation: { enable: boolean; sourceLanguage: string; targetLanguage: string };
  setTranslation: React.Dispatch<
    React.SetStateAction<{
      enable: boolean;
      sourceLanguage: string;
      targetLanguage: string;
    }>
  >;
}) => {
  const [isApiUp, setIsApiUp] = React.useState(false);
  const [enable, setEnable] = React.useState(translation.enable || false);
  const [languagesData, setLanguagesData] = React.useState<{ code: string; name: string; targets: string[] }[]>([]);

  // useEffect(() => {
  //   const getData = async () => {
  //     try {
  //       const res = await fetch(`${process.env.NEXT_PUBLIC_TRANSLATION_API}/languages`);
  //       if (res.ok) {
  //         setIsApiUp(true);
  //         const data = await res.json();
  //         setLanguagesData(data);
  //       }
  //     } catch {}
  //   };
  //   getData();
  // }, []);

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <Switch
          id="translation"
          checked={enable}
          onCheckedChange={(checked) => {
            setEnable(checked);
            setTranslation((prev) => ({ ...prev, enable: checked }));
          }}
          // disabled={!isApiUp}
        />
        <Label htmlFor="translation">Enable Translation</Label>
      </div>
      <p className="text-sm text-muted-foreground">Translate the quiz into another language</p>

      {/* <div className={`flex items-center space-x-2 mt-2 h-0 overflow-hidden ${enable ? "h-auto" : ""} `}>
        <Select
          defaultValue={translation.sourceLanguage}
          onValueChange={(value) => setTranslation((prev) => ({ ...prev, sourceLanguage: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source Language" />
          </SelectTrigger>
          <SelectContent>
            {languagesData.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          // disabled={Boolean(translation.targetLanguage)}
          defaultValue={translation.targetLanguage}
          onValueChange={(value) => setTranslation((prev) => ({ ...prev, targetLanguage: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Target Language" />
          </SelectTrigger>
          <SelectContent>
            {languagesData.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div> */}
    </div>
  );
};

export default Translation;
