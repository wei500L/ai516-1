import { ResultPage } from "@/components/heart-cabin/result-page";

type PageProps = {
  params: Promise<{
    guessId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { guessId } = await params;

  return <ResultPage guessId={guessId} />;
}
