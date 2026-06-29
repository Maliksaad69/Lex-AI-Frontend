import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to LexAI Litigation Intelligence Platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Cases</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold">12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold">84</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Analyses</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold">29</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-4xl font-bold">8</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground">
            No recent activity available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
