/**
 * Workflows List Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { WorkflowResponse, PaginatedResponse } from '@/types/api';

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/v1/workflows');
      const data: PaginatedResponse<WorkflowResponse> = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      setWorkflows(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = filterStatus === 'ALL' || workflow.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MARKETING':
        return 'bg-purple-100 text-purple-800';
      case 'SALES':
        return 'bg-blue-100 text-blue-800';
      case 'OPERATIONS':
        return 'bg-green-100 text-green-800';
      case 'CUSTOMER_SUPPORT':
        return 'bg-orange-100 text-orange-800';
      case 'ADMIN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              ←
            </Button>
            <h1 className="text-2xl font-bold">Workflows</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/templates')}>
              Templates
            </Button>
            <Button variant="outline" onClick={() => router.push('/integrations')}>
              Integrations
            </Button>
            <Button onClick={() => router.push('/workflows/new')}>+ New Workflow</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <Input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading workflows...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600">{error}</div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No workflows found</div>
            <Button onClick={() => router.push('/workflows/new')}>Create your first workflow</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/workflows/${workflow.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(workflow.status)}`}
                      >
                        {workflow.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(workflow.category)}`}
                      >
                        {workflow.category}
                      </span>
                    </div>
                  </div>
                  {workflow.description && (
                    <CardDescription className="line-clamp-2">{workflow.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{workflow._count?.executions || 0} executions</span>
                    <span>
                      Last updated:{' '}
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
