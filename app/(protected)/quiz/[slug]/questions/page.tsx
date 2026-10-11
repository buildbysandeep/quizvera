import QuestionBankManager from "@/components/quiz/QuestionBankManager";

export default function QuizQuestionBankPage({ params }: { params: { slug: string } }) {
  return <QuestionBankManager slug={params.slug} />;
}
