import Link from "next/link";

type HomepagePreviewBannerProps = {
  configId: string;
  version: number;
  status: string;
};

export default function HomepagePreviewBanner({
  configId,
  version,
  status,
}: HomepagePreviewBannerProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-black uppercase tracking-wide">
          PREVIEW MODE: This version is v{version} ({status}). Not Live.
        </p>
        <Link
          href={`/admin/homepage-control/${configId}`}
          className="w-fit rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-sm font-bold text-amber-950 transition hover:bg-amber-50"
        >
          Return to Detail
        </Link>
      </div>
    </div>
  );
}
