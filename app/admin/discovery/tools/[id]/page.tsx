import AdminDashboardClient from "../../../../../components/admin/admin-dashboard-client";

type DiscoveryToolDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DiscoveryToolDetailPage({
  params,
}: DiscoveryToolDetailPageProps) {
  const { id } = await params;

  return (
    <AdminDashboardClient
      view="discovery-tool-detail"
      discoveryToolId={id}
    />
  );
}
