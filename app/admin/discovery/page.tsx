import AdminDashboardClient from "../../../components/admin/admin-dashboard-client";
import { CandidateStagingQueuePanel } from "../../../components/admin/discovery/candidate-staging-queue-panel";

export default function AdminDiscoveryPage() {
  return (
    <AdminDashboardClient view="discovery">
      <CandidateStagingQueuePanel />
    </AdminDashboardClient>
  );
}
