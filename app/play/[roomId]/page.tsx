import { RoomPlayPage } from "@/components/heart-cabin/room-play-page";

type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { roomId } = await params;

  return <RoomPlayPage roomId={roomId} />;
}
