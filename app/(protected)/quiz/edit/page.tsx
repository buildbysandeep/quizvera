"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useState } from "react";
import ImageUplaod from "@/app/(protected)/quiz/components/ImageUplaod";
import AddQuizInput from "@/app/(protected)/quiz/components/AddQuizInput";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { redirect, useRouter } from "next/navigation";
import { error, success, uploadImageAPI } from "@/lib/utils";
import { updateQuizDB } from "@/lib/actions/quiz.actions";
import { IQuiz } from "@/types";
import { getQuizDB } from "@/lib/actions/quiz.actions";
import Loading from "@/components/shared/Loading";
import StrictMode from "../components/StrictMode";
import Translation from "../components/Translation";

const Page = ({ searchParams }: { searchParams: { id: string } }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<IQuiz | null>(null);

  const [images, setImages] = React.useState<{ key: string; publicId?: string; file?: File; url: string }[]>(
    data?.images || [],
  );
  const [imagePublicId, setImagePublicId] = React.useState<string[]>([]);
  const [quizName, setQuizName] = React.useState(data?.title || "");
  const [inputs, setInputs] = React.useState<string[]>(data?.userInputs || []);
  const [formStatus, setFormStatus] = React.useState("");

  const [isStrictMode, setIsStrictMode] = React.useState(false);
  const [translation, setTranslation] = React.useState({
    enable: false,
    sourceLanguage: "",
    targetLanguage: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (searchParams.id) {
        console.log("call");
        const res = await getQuizDB({ id: searchParams.id });
        setIsLoading(false);
        if (!res.ok) return error(res.error!);
        setData(res.data as IQuiz);
        setQuizName(res.data?.title || "");
        setInputs(res.data?.userInputs || []);
        setImages(res.data?.images || []);
        setIsStrictMode(res.data?.isStrictMode || false);
        setTranslation({
          enable: res.data?.translationEnabled || false,
          sourceLanguage: res.data?.sourceLanguage || "",
          targetLanguage: res.data?.targetLanguage || "",
        });
      }
    };
    fetchData();
  }, [searchParams.id]);

  if (!searchParams.id || (!isLoading && !data)) return redirect("/");

  if (isLoading || !data) {
    return (
      <span className="gap-2 mt-10 flex items-center justify-center">
        <Loading />
      </span>
    );
  }

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
        if (!image.publicId) {
          const obj = await uploadImage(image.file!, image.key);
          if (obj) uploadedImages.push(obj);
        } else {
          uploadedImages.push({ key: image.key, publicId: image.publicId, url: image.url });
        }
      }
    }
    if (imagePublicId.length > 0) {
      await fetch(`/api/image?public_ids=${imagePublicId.join(",")}`, { method: "DELETE" });
    }

    setFormStatus("updating...");
    const res = await updateQuizDB(values, {
      quizId: data.id!,
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

    setFormStatus("");
    success("Quiz updated successfully");

    // redirect to quiz
    router.push(`/quiz?id=${searchParams.id}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex justify-between gap-2 w-full">
        <ImageUplaod type="left" setImages={setImages} images={images} setDeleteImage={setImagePublicId} edit />
        <div className="bg-muted h-fit w-fit max-w-[55%] rounded-b-md px-2 py-1 title-shadow">
          <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-medium text-center line-clamp-2">{quizName}</h1>
        </div>
        <ImageUplaod type="right" setImages={setImages} images={images} setDeleteImage={setImagePublicId} edit />
      </div>

      <form onSubmit={submitHandler}>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-2">
            <Label>Quiz Title</Label>
            <Input type="text" name="title" defaultValue={data.title} onChange={(e) => setQuizName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label>Quiz Description</Label>
            <Textarea placeholder="Enter quiz description" name="desc" defaultValue={data.desc} rows={2} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between gap-2">
              <div className="w-full">
                <Label>Time Duration (in minutes)</Label>
                <Input type="number" name="duration" defaultValue={data.duration} />
              </div>
              <div className="w-full">
                <Label>Max Marks</Label>
                <Input type="number" name="maxMarks" defaultValue={data.maxMarks} />
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
              defaultValue={data.footerHeading1}
            />
            <Input
              className="font-medium text-lg"
              type="text"
              placeholder="Heading2 eg. Company Address"
              name="footerHeading2"
              defaultValue={data.footerHeading2}
            />
            <Input
              className=""
              type="text"
              placeholder="Text1 eg. Email"
              name="footerText1"
              defaultValue={data.footerText1}
            />
            <Input
              className=""
              type="text"
              placeholder="Text2 eg. Contact"
              name="footerText2"
              defaultValue={data.footerText2}
            />
            <Input
              className=""
              type="text"
              placeholder="Link eg. Website"
              name="footerLink"
              defaultValue={data.footerLink}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 place-items-end">
            <Button type="submit" className="w-fit">
              {formStatus ? formStatus : "Update"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
