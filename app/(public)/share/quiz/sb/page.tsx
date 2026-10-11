import QuizStatusPage from "../components/QuizStatusPage";

type SearchParams = { timeOut?: boolean | string };

const Page = ({ searchParams }: { searchParams: SearchParams }) => {
  const timedOut = searchParams?.timeOut === true || searchParams?.timeOut === "true" || searchParams?.timeOut === "1";

  return (
    <QuizStatusPage
      tone="success"
      eyebrow={timedOut ? "Submitted automatically" : "Submission complete"}
      title={timedOut ? "Time is up" : "Thank you!"}
      description={
        timedOut
          ? "Your quiz response has been submitted when the time limit was reached."
          : "Your response has been submitted successfully."
      }
      detail={
        timedOut
          ? "Your score will be determined from the answers recorded before the timer expired."
          : "Your answers have been recorded. You can safely close this page."
      }
    />
  );
};

export default Page;
