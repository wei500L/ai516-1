import { GuessPage } from "@/components/heart-cabin/guess-page";

type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { roomId } = await params;

  return <GuessPage roomId={roomId} />;
}
