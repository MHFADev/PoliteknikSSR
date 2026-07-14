import { LoadingAnimation } from "@/components/ui/LoadingAnimation";

export default function SiswaLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <LoadingAnimation />
    </div>
  );
}
