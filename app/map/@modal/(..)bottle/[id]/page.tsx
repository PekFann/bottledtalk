import BottlePageContent from "@/components/bottles/BottlePageContent";

export const dynamic = "force-dynamic";

export default async function BottleModalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ footprint?: string }>;
}) {
  const { id } = await params;
  const { footprint: footprintId } = await searchParams;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <BottlePageContent id={id} footprintId={footprintId} />
    </div>
  );
}
