import { ListSkeleton } from "@/components/admin/ui";

export default function AdminLoading() {
  return (
    <div className="p-4">
      <ListSkeleton rows={4} />
    </div>
  );
}
