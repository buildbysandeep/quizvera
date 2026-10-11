import QuizStatusPage from "../components/QuizStatusPage";

const Page = () => (
  <QuizStatusPage
    tone="neutral"
    eyebrow="Link unavailable"
    title="This quiz is unavailable"
    description="This quiz link is no longer active. It may have been unpublished or its access period may have ended."
    detail="Contact the person or organization that shared this quiz if you believe you should still have access."
  />
);

export default Page;
