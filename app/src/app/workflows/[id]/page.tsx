/**
 * Workflow Detail Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkflowResponse, ExecutionResponse } from '@/types/api';

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [executions, setExecutions] = useState<ExecutionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workflowId) {
      fetchWorkflow();
      fetchExecutions();
    }
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch workflow');
      }

      setWorkflow(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}/executions`);
      const data = await response.json();

      if (response.ok) {
        setExecutions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunWorkflow = async () => {
    try {
      const response = await fetch(`/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchExecutions(); // Refresh executions
        alert('Workflow started successfully!');
      }
    } catch (err) {
      alert('Failed to start workflow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExecutionResultColor = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'FAILURE':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (!workflow) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Workflow not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/workflows')}>
              ←
            </Button>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workflow.status)}`}>
              {workflow.status}
            </span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push(`/workflows/${workflow.id}/edit`)}>
              Edit
            </Button>
            <Button onClick={handleRunWorkflow}>▶ Run Now</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>
                  {workflow.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Category</div>
                    <div className="text-lg">{workflow.category}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Created</div>
                    <div>{new Date(workflow.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Last Updated</div>
                    <div>{new Date(workflow.updatedAt).toLocaleString()}</div>
                  </div>
                  {workflow.createdBy && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Created By</div>
                      <div>{workflow.createdBy.name || workflow.createdBy.email}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Execution History */}
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
                <CardDescription>Recent runs of this workflow</CardDescription>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No executions yet</p>
                ) : (
                  <div className="space-y-4">
                    {executions.map((execution) => (
                      <div
                        key={execution.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="text-sm text-gray-600">
                            {new Date(execution.startedAt).toLocaleString()}
                          </div>
                          {execution.duration && (
                            <div className="text-xs text-gray-500">
                              Duration: {(execution.duration / 1000).toFixed(2)}s
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getExecutionStatusColor(
                              execution.status
                            )}`}
                          >
                            {execution.status}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getExecutionResultColor(
                              execution.result
                            )}`}
                          >
                            {execution.result}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/executions/${execution.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Executions</div>
                    <div className="text-2xl font-bold">{workflow._count?.executions || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                    <div className="text-2xl font-bold">
                      {executions.length > 0
                        ? `${Math.round(
                            (executions.filter((e) => e.result === 'SUCCESS').length /
                              executions.length) *
                              100
                          )}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/workflows/${workflow.id}/edit`)}
                >
                  Edit Workflow
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/workflows/${workflow.id}/settings`)}
                >
                  Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this workflow?')) {
                      // TODO: Implement delete
                      alert('Delete functionality coming soon');
                    }
                  }}
                >
                  Delete Workflow
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
