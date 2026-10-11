import QuizStatusPage from "../../components/QuizStatusPage";

type SearchParams = { timeOut?: string | boolean };

export default function QuizResultStatusPage({ searchParams }: { searchParams: SearchParams }) {
  const timedOut = searchParams?.timeOut === true || searchParams?.timeOut === "true" || searchParams?.timeOut === "1";
  return (
    <QuizStatusPage
      tone="success"
      eyebrow={timedOut ? "Submitted automatically" : "Submission complete"}
      title={timedOut ? "Time is up" : "Thank you!"}
      description={timedOut ? "Your recorded answers were submitted when the time limit was reached." : "Your response has been submitted successfully."}
      detail={timedOut ? "Your score is based on the answers recorded before the timer expired." : "Your answers have been recorded. You can safely close this page."}
    />
  );
}
