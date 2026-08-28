import { useEffect, useState } from "react";
import { bundledLanguages, codeToHtml } from "shiki";

interface Props {
  children: string;
  lang: any;
}

export const isSupported = (lang: string): boolean => {
  return lang in bundledLanguages;
};

export function CodeBlock({ children, lang }: Props) {
  const [out, setOut] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      const html = await codeToHtml(children, {
        lang,
        theme: "github-dark",
      });

      if (!cancelled) {
        setOut(html);
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [children, lang]);

  return (
    <div
      className="
      mb-4
      w-full
      min-w-0
      max-w-full
      rounded-sm
      border
      border-black/85
      overflow-x-auto
      [&_.shiki]:max-w-full
      [&_.shiki]:overflow-x-auto
      [&_.shiki]:p-2
    "
      dangerouslySetInnerHTML={{
        __html: out,
      }}
    />
  );
}
