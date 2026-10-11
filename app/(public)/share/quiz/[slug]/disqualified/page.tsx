import QuizStatusPage from "../../components/QuizStatusPage";

type SearchParams = { exitFullScreen?: boolean | string; lostFocus?: boolean | string };
const isTrue = (value?: boolean | string) => value === true || value === "true" || value === "1";

export default function QuizDisqualifiedPage({ searchParams }: { searchParams: SearchParams }) {
  const exitedFullScreen = isTrue(searchParams?.exitFullScreen);
  const lostFocus = isTrue(searchParams?.lostFocus);
  const detail = exitedFullScreen
    ? "The quiz was configured for strict mode, and full-screen mode was exited during the attempt."
    : lostFocus
      ? "The quiz was configured for strict mode, and the browser window lost focus during the attempt."
      : "The attempt was marked as disqualified by the quiz rules.";
  return <QuizStatusPage tone="danger" eyebrow="Attempt disqualified" title="Quiz attempt disqualified" description="This attempt has been marked as disqualified under the quiz rules." detail={detail} />;
}
