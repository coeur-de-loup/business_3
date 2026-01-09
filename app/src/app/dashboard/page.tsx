/**
 * Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/types/api';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/dashboard');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Orchestration Platform</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/workflows')}>
              Workflows
            </Button>
            <Button variant="outline" onClick={() => router.push('/integrations')}>
              Integrations
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-gray-600">Welcome to your AI orchestration dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Total Workflows</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalWorkflows || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Workflows</CardDescription>
              <CardTitle className="text-3xl">{stats?.activeWorkflows || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Total Executions</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalExecutions || 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-3xl">{stats?.successRate || 0}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Latest workflow runs</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentExecutions && stats.recentExecutions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{execution.workflow.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(execution.startedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          execution.result === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : execution.result === 'FAILURE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {execution.result}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          execution.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {execution.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No executions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/workflows/new')}>
            <CardHeader>
              <CardTitle>Create Workflow</CardTitle>
              <CardDescription>Build a new automation workflow</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/templates')}>
            <CardHeader>
              <CardTitle>Browse Templates</CardTitle>
              <CardDescription>Use pre-built workflow templates</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/integrations')}>
            <CardHeader>
              <CardTitle>Manage Integrations</CardTitle>
              <CardDescription>Connect your AI services</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
