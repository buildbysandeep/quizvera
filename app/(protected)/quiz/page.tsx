import { redirect } from "next/navigation";
import { getQuizSlugByIdDB } from "@/lib/actions/quiz.actions";

export default async function LegacyQuizRoute({ searchParams }: { searchParams: { id?: string } }) {
  if (searchParams?.id) {
    const result = await getQuizSlugByIdDB({ id: searchParams.id });
    if (result.ok && result.slug) redirect(`/quiz/${result.slug}`);
  }
  redirect("/");
}
