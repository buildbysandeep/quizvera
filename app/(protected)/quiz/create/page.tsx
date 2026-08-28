"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data";
import { error, success, uploadImageAPI } from "@/lib/utils";
import { useGroups } from "@/hooks/useGroups";
import { createQuizDB } from "@/lib/actions/quiz.actions";
import { useSession } from "next-auth/react";
import { IQuiz } from "@/types";
import ImageUplaod from "@/app/(protected)/quiz/components/ImageUplaod";
import AddQuizInput from "@/app/(protected)/quiz/components/AddQuizInput";
import Translation from "../components/Translation";
import StrictMode from "../components/StrictMode";

const Page = ({ searchParams }: { searchParams: { group: string } }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { groups, setGroups } = useDataStore();

  const { groups: data, isLoading: isGroupsLoading, error: fetchingError } = useGroups();
  const group = useMemo(() => data.find((group) => group.id === searchParams.group), [data]);

  const [images, setImages] = React.useState<{ key: string; publicId?: string; file?: File; url: string }[]>([]);
  const [quizName, setQuizName] = React.useState("");
  const [inputs, setInputs] = React.useState<string[]>([]);
  const [formStatus, setFormStatus] = React.useState("");

  const [isStrictMode, setIsStrictMode] = React.useState(false);
  const [translation, setTranslation] = React.useState({
    enable: false,
    sourceLanguage: "",
    targetLanguage: "",
  });

  const uploadImage = async (file: File, key: string) => {
    const res = await uploadImageAPI(file);
    if (!res.ok) {
      error(res.error, 1000);
      setFormStatus("");
      return;
    }
    const { public_id, secure_url } = res.data;
    return { key, publicId: public_id, url: secure_url };
  };

  const submitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus("loading...");
    // Get form data
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    if (!values.title) {
      setFormStatus("");
      return error("Quiz title is required", 1000);
    }

    if (!values.duration || Number(values.duration) < 1) {
      setFormStatus("");
      return error("Valid duration is required", 1000);
    }

    if (!values.maxMarks || Number(values.maxMarks) < 1) {
      setFormStatus("");
      return error("Valid max marks is required", 1000);
    }

    // upload images
    let uploadedImages: { key: string; publicId: string; url: string }[] = [];
    if (images.length > 0) {
      setFormStatus("uploading...");
      for (const image of images) {
        const obj = await uploadImage(image.file!, image.key);
        if (obj) uploadedImages.push(obj);
      }
    }

    setFormStatus("creating...");
    const res = await createQuizDB(values, {
      author: session?.user?.name!,
      groupId: group?.id!,
      userInputs: inputs,
      images: uploadedImages,
      isStrictMode,
      translation,
    });
    if (!res.ok) {
      error(res.error!, 1000);
      setFormStatus("");
      return;
    }

    // update group
    const updatedGroups = groups.map((group) => {
      if (group.id === searchParams.group) {
        const newQuiz: IQuiz = { ...res.data, questions: [] } as IQuiz;
        return { ...group, quizzes: group.quizzes ? [...group.quizzes, newQuiz] : [newQuiz] };
      }
      return group;
    });
    setGroups(updatedGroups);
    setFormStatus("");
    success("Quiz created successfully");

    // redirect to group
    router.push(`/group?id=${group?.id}`);
  };

  // check if group exists
  useEffect(() => {
    if (!isGroupsLoading && !group) {
      error("Group not found", 1000);
      router.push("/");
    }
    if (fetchingError) {
      error(fetchingError, 1000);
      router.push("/");
    }
  }, [groups, isGroupsLoading, fetchingError]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex justify-between gap-2 w-full">
        <ImageUplaod type="left" setImages={setImages} images={images} />
        {quizName && (
          <div className="bg-muted h-fit w-fit max-w-[55%] rounded-b-md px-2 py-1 title-shadow">
            <h1 className="text-sm xs:text-xl md:text-2xl lg:text-3xl font-medium text-center line-clamp-2">{quizName}</h1>
          </div>
        )}
        <ImageUplaod type="right" setImages={setImages} images={images} />
      </div>

      <form onSubmit={submitHandler}>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-2">
            <Label>Quiz Title</Label>
            <Input type="text" name="title" onChange={(e) => setQuizName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label>Quiz Description</Label>
            <Textarea placeholder="Enter quiz description" name="desc" rows={2} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between gap-2">
              <div className="w-full">
                <Label>Time Duration (in minutes)</Label>
                <Input type="number" name="duration" />
              </div>
              <div className="w-full">
                <Label>Max Marks</Label>
                <Input type="number" name="maxMarks" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <AddQuizInput inputs={inputs} setInputs={setInputs} />
          </div>

          <Separator />

          <StrictMode isStrictMode={isStrictMode} setIsStrictMode={setIsStrictMode} />
          <Translation translation={translation} setTranslation={setTranslation} />

          <Label>Quiz Footer</Label>
          <div className="grid grid-cols-1 gap-2">
            <Input
              className="font-semibold text-xl"
              type="text"
              placeholder="Heading1 eg. Company Name"
              name="footerHeading1"
            />
            <Input
              className="font-medium text-lg"
              type="text"
              placeholder="Heading2 eg. Company Address"
              name="footerHeading2"
            />
            <Input className="" type="text" placeholder="Text1 eg. Email" name="footerText1" />
            <Input className="" type="text" placeholder="Text2 eg. Contact" name="footerText2" />
            <Input className="" type="text" placeholder="Link eg. Website" name="footerLink" />
          </div>

          <div className="grid grid-cols-1 gap-2 place-items-end">
            <Button type="submit" className="w-fit" disabled={formStatus ? true : false || !quizName}>
              {formStatus ? formStatus : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
