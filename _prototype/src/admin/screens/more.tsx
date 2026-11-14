import { Link } from "react-router";
import {
  ChevronRight,
  ExternalLink,
  FolderTree,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { AppBar, Card } from "@/admin/components/ui";

const row =
  "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left text-[16px] font-medium hover:bg-sand/40";

export function MorePage() {
  return (
    <>
      <title>More · SSV Admin</title>
      <AppBar title="More" />
      <div className="mx-auto max-w-[640px] space-y-3 p-4">
        <Card className="divide-y divide-sand overflow-hidden">
          <Link to="/admin/categories" className={row}>
            <FolderTree size={22} className="text-forest" />
            <span className="flex-1">Categories</span>
            <ChevronRight size={20} className="text-deep/50" />
          </Link>
          <Link to="/admin/coupons" className={row}>
            <TicketPercent size={22} className="text-forest" />
            <span className="flex-1">Coupons</span>
            <ChevronRight size={20} className="text-deep/50" />
          </Link>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-forest">
            <UserRound size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-deep/65">Viewing as</p>
            <p className="truncate text-[16px] font-semibold">SSV Admin</p>
            <p className="truncate text-[14px] text-deep/70">Prototype preview, no sign-in</p>
          </div>
        </Card>

        <Card className="divide-y divide-sand overflow-hidden">
          <Link to="/" className={row}>
            <ExternalLink size={22} className="text-forest" />
            <span className="flex-1">View store</span>
            <ChevronRight size={20} className="text-deep/50" />
          </Link>
          <Link to="/" className={row}>
            <ExternalLink size={22} className="text-forest" />
            <span className="flex-1">View store</span>
            <ChevronRight size={20} className="text-deep/50" />
          </Link>
        </Card>
      </div>
    </>
  );
}

export function AdminNotFound() {
  return (
    <>
      <AppBar title="Page not found" />
      <div className="p-6 text-center">
        <p className="text-[16px]">This admin page doesn't exist.</p>
        <Link
          to="/admin/orders"
          className="mt-4 inline-flex min-h-11 items-center font-semibold text-forest underline underline-offset-4"
        >
          Go to orders
        </Link>
      </div>
    </>
  );
}
