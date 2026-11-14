import { AdminShell } from "./shell/AdminShell";

/** Root of /admin: its own layout and navigation (no storefront chrome). Prototype: no sign-in. */
export default function AdminApp() {
  return <AdminShell />;
}
