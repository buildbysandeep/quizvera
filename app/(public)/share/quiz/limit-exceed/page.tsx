import QuizStatusPage from "../components/QuizStatusPage";

const Page = () => (
  <QuizStatusPage
    tone="warning"
    eyebrow="Time limit reached"
    title="Time limit exceeded"
    description="The available time for this quiz has ended. Your attempt may already have been submitted."
    detail="If you were redirected here unexpectedly, contact the quiz administrator before attempting the quiz again."
  />
);

export default Page;
