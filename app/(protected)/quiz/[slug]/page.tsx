import QuizManagement from "@/components/quiz/QuizManagement";

export default function QuizDetailsPage({ params }: { params: { slug: string } }) {
  return <QuizManagement params={params} />;
}
