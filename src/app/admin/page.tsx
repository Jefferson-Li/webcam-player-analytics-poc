import { AdminDashboard } from "@/components/AdminDashboard";
import { SiteNav } from "@/components/SiteNav";

export default function AdminPage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,211,153,0.14),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.1),_transparent_45%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <SiteNav active="admin" />
        <AdminDashboard />
      </div>
    </div>
  );
}
