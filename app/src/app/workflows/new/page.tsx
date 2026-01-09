/**
 * Workflow Builder Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { CreateWorkflowRequest } from '@/types/api';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OPERATIONS');

  // Workflow graph state
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    setIsLoading(true);

    try {
      const definition = {
        nodes,
        edges,
        variables: {},
      };

      const workflowData: CreateWorkflowRequest = {
        name,
        description,
        category: category as any,
        definition,
      };

      const response = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create workflow');
      }

      const data = await response.json();
      router.push(`/workflows/${data.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addNode = (type: string, label: string) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: {
        x: 100 + nodes.length * 50,
        y: 100 + nodes.length * 50,
      },
      data: {
        label,
        config: {},
      },
    };

    setNodes([...nodes, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const addEdge = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const edgeExists = edges.some(
      (e) => e.source === sourceId && e.target === targetId
    );

    if (!edgeExists) {
      const newEdge: WorkflowEdge = {
        id: `edge-${Date.now()}`,
        source: sourceId,
        target: targetId,
      };
      setEdges([...edges, newEdge]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/workflows')}>
              ←
            </Button>
            <h1 className="text-2xl font-bold">Create Workflow</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/templates')}>
              Use Template
            </Button>
            <Button onClick={handleSaveWorkflow} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Workflow'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Workflow Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>Basic information about your workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <Input
                    type="text"
                    placeholder="My Workflow"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    type="text"
                    placeholder="What does this workflow do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="SALES">Sales</option>
                    <option value="OPERATIONS">Operations</option>
                    <option value="CUSTOMER_SUPPORT">Customer Support</option>
                    <option value="ADMIN">Admin</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Node Palette */}
            <Card>
              <CardHeader>
                <CardTitle>Add Nodes</CardTitle>
                <CardDescription>Drag to add to your workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode('trigger', 'Trigger')}
                >
                  🚀 Trigger
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode('ai', 'AI Task')}
                >
                  🤖 AI Task
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode('integration', 'Integration')}
                >
                  🔌 Integration
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode('condition', 'Condition')}
                >
                  🔀 Condition
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode('delay', 'Delay')}
                >
                  ⏱️ Delay
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode('action', 'Action')}
                >
                  ⚡ Action
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Canvas */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Workflow Canvas</CardTitle>
                <CardDescription>
                  Design your workflow by adding and connecting nodes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-gray-100 border-2 border-dashed rounded-lg min-h-[600px] relative overflow-auto"
                  onDragOver={(e) => e.preventDefault()}
                >
                  {nodes.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[600px]">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-4">📋</div>
                        <div className="text-lg font-medium">No nodes yet</div>
                        <div className="text-sm">
                          Add nodes from the left panel to get started
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 relative">
                      {/* Simple canvas rendering */}
                      {nodes.map((node, index) => (
                        <div
                          key={node.id}
                          className={`absolute bg-white border-2 rounded-lg p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${
                            selectedNode?.id === node.id
                              ? 'border-blue-500'
                              : 'border-gray-300'
                          }`}
                          style={{
                            left: `${node.position.x}px`,
                            top: `${node.position.y}px`,
                            minWidth: '150px',
                          }}
                          onClick={() => setSelectedNode(node)}
                          draggable
                          onDragEnd={(e) => {
                            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                            if (rect) {
                              const newNode = {
                                ...node,
                                position: {
                                  x: e.clientX - rect.left - 75,
                                  y: e.clientY - rect.top - 50,
                                },
                              };
                              setNodes(nodes.map((n) => (n.id === node.id ? newNode : n)));
                            }
                          }}
                        >
                          <div className="font-medium text-sm mb-1">{node.data.label}</div>
                          <div className="text-xs text-gray-500">{node.type}</div>
                        </div>
                      ))}

                      {/* Simple edge rendering */}
                      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {edges.map((edge) => {
                          const sourceNode = nodes.find((n) => n.id === edge.source);
                          const targetNode = nodes.find((n) => n.id === edge.target);

                          if (!sourceNode || !targetNode) return null;

                          const x1 = sourceNode.position.x + 75;
                          const y1 = sourceNode.position.y + 50;
                          const x2 = targetNode.position.x + 75;
                          const y2 = targetNode.position.y;

                          return (
                            <g key={edge.id}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                              />
                            </g>
                          );
                        })}
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="3"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3, 0 6"
                              fill="#94a3b8"
                            />
                          </marker>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Connection Helper */}
                {selectedNode && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium mb-2">
                      Selected: {selectedNode.data.label}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const targetNode = prompt(
                            'Enter target node ID to connect to:',
                            nodes.find((n) => n.id !== selectedNode.id)?.id || ''
                          );
                          if (targetNode) {
                            addEdge(selectedNode.id, targetNode);
                          }
                        }}
                      >
                        Connect to Node
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNode(selectedNode.id)}
                      >
                        Delete Node
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNode(null)}
                      >
                        Deselect
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 text-sm text-gray-600">
                  Nodes: {nodes.length} | Connections: {edges.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
