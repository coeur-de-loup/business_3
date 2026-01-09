/**
 * Templates Library Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TemplateResponse } from '@/types/api';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/v1/templates');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch templates');
      }

      setTemplates(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/v1/templates/${templateId}/use`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to use template');
      }

      const data = await response.json();
      router.push(`/workflows/${data.workflowId}/edit`);
    } catch (err: any) {
      alert(err.message);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = ['ALL', 'MARKETING', 'SALES', 'OPERATIONS', 'CUSTOMER_SUPPORT', 'ADMIN', 'CUSTOM'];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.popularity - a.popularity);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              ←
            </Button>
            <h1 className="text-2xl font-bold">Template Library</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/workflows')}>
              Workflows
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
        <div className="mb-6 space-y-4">
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading templates...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600">{error}</div>
          </div>
        ) : sortedTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No templates found</div>
            <Button onClick={() => router.push('/workflows/new')}>
              Create a custom workflow
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTemplates.map((template) => (
              <Card
                key={template.id}
                className="flex flex-col hover:shadow-lg transition-shadow"
              >
                <CardHeader className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                          template.category
                        )}`}
                      >
                        {template.category}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                          template.difficulty
                        )}`}
                      >
                        {template.difficulty}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      ⭐ {template.rating.toFixed(1)} ({template.ratingCount})
                    </span>
                    <span className="flex items-center gap-1">
                      👥 {template.popularity} uses
                    </span>
                  </div>

                  {/* Time Savings */}
                  {template.estimatedTimeSavings && (
                    <div className="text-sm text-green-600 font-medium">
                      ⏱️ Saves {template.estimatedTimeSavings}
                    </div>
                  )}

                  {/* Required Integrations */}
                  {template.requiredIntegrations.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Requires: {template.requiredIntegrations.join(', ')}
                    </div>
                  )}

                  {/* Actions */}
                  <Button
                    className="w-full"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
