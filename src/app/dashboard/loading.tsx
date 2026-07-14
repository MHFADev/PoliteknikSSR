import { LoadingAnimation } from "@/components/ui/LoadingAnimation";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-soft">
      <LoadingAnimation />
    </div>
  );
}
