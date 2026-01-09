/**
 * Integrations Management Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { IntegrationResponse } from '@/types/api';

interface IntegrationCategory {
  name: string;
  icon: string;
  providers: string[];
}

const integrationCategories: IntegrationCategory[] = [
  {
    name: 'AI Providers',
    icon: '🤖',
    providers: ['OPENAI', 'ANTHROPIC', 'GOOGLE_GEMINI', 'COHERE'],
  },
  {
    name: 'Communication',
    icon: '💬',
    providers: ['SLACK', 'MICROSOFT_TEAMS', 'DISCORD'],
  },
  {
    name: 'Email',
    icon: '📧',
    providers: ['GMAIL', 'OUTLOOK', 'SENDGRID', 'RESEND'],
  },
  {
    name: 'CRM & Sales',
    icon: '👥',
    providers: ['HUBSPOT', 'SALESFORCE', 'PIPEDRIVE'],
  },
  {
    name: 'Project Management',
    icon: '📋',
    providers: ['TRELLO', 'ASANA', 'MONDAY', 'NOTION', 'LINEAR'],
  },
  {
    name: 'E-commerce',
    icon: '🛒',
    providers: ['SHOPIFY', 'WOO_COMMERCE', 'SQUARE'],
  },
  {
    name: 'Marketing',
    icon: '📢',
    providers: ['MAILCHIMP', 'CONVERTKIT', 'ACTIVECAMPAIGN'],
  },
  {
    name: 'Payments',
    icon: '💳',
    providers: ['STRIPE', 'PAYPAL'],
  },
  {
    name: 'Scheduling',
    icon: '📅',
    providers: ['CALENDLY', 'ACUITY'],
  },
  {
    name: 'Automation',
    icon: '⚡',
    providers: ['ZAPIER', 'MAKE'],
  },
  {
    name: 'Spreadsheets',
    icon: '📊',
    providers: ['GOOGLE_SHEETS', 'AIRTABLE'],
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/v1/integrations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch integrations');
      }

      setIntegrations(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    // TODO: Implement OAuth flow or API key input
    alert(`Connect integration: ${provider}\n\nOAuth flow would be initiated here.`);
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchIntegrations();
        alert('Integration disconnected successfully');
      }
    } catch (err) {
      alert('Failed to disconnect integration');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'DISABLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const connectedProviders = new Set(integrations.map((i) => i.provider));

  const filteredCategories = integrationCategories.filter((category) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.providers.some((p) => p.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              ←
            </Button>
            <h1 className="text-2xl font-bold">Integrations</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.push('/workflows')}>
              Workflows
            </Button>
            <Button variant="outline" onClick={() => router.push('/templates')}>
              Templates
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Connected Integrations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Connected Integrations</h2>
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No integrations connected yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{integration.provider}</CardTitle>
                        <CardDescription>
                          Connected on {new Date(integration.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          integration.status
                        )}`}
                      >
                        {integration.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/integrations/${integration.id}`)}
                      >
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Available Integrations */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Available Integrations</h2>
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border rounded-lg w-full max-w-md"
            />
          </div>

          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.providers.map((provider) => {
                    const isConnected = connectedProviders.has(provider as any);

                    return (
                      <Card
                        key={provider}
                        className={`${
                          isConnected ? 'border-green-500 bg-green-50' : ''
                        }`}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{provider}</CardTitle>
                          {isConnected && (
                            <CardDescription className="text-green-600">
                              ✓ Connected
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          {isConnected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const integration = integrations.find(
                                  (i) => i.provider === provider
                                );
                                if (integration) {
                                  router.push(`/integrations/${integration.id}`);
                                }
                              }}
                            >
                              Configure
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleConnect(provider)}
                            >
                              Connect
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
