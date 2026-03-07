'use client';

import { useState, useEffect } from 'react';
import { Alert } from '@/components/ui';

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
}

export default function SystemStatusPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    storage: 38,
    uptime: '15 days, 3 hours',
  });
  const [services, setServices] = useState([
    { name: 'Database', status: 'operational', response: '12ms' },
    { name: 'API Server', status: 'operational', response: '45ms' },
    { name: 'Email Service', status: 'operational', response: '120ms' },
    { name: 'Storage Service', status: 'operational', response: '8ms' },
    { name: 'Payment Gateway', status: 'operational', response: '230ms' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMetricColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">


      {/* Overall Status */}
      <Alert variant="success">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">All systems operational</span>
        </div>
      </Alert>

      {/* Server Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">CPU Usage</h3>
            <span className={`text-2xl font-bold ${getMetricColor(metrics.cpu)}`}>
              {metrics.cpu}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${metrics.cpu}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Memory Usage</h3>
            <span className={`text-2xl font-bold ${getMetricColor(metrics.memory)}`}>
              {metrics.memory}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${metrics.memory}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Storage Usage</h3>
            <span className={`text-2xl font-bold ${getMetricColor(metrics.storage)}`}>
              {metrics.storage}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${metrics.storage}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">System Uptime</h3>
          <p className="text-2xl font-bold text-gray-900">{metrics.uptime}</p>
          <p className="text-xs text-gray-500 mt-1">Since last restart</p>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Services Status</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {services.map((service, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                    {service.status}
                  </div>
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Response time: {service.response}</span>
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent System Events</h2>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-gray-900">Database backup completed successfully</p>
                <p className="text-gray-500 text-xs">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-gray-900">System update applied</p>
                <p className="text-gray-500 text-xs">Yesterday at 2:30 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-gray-900">SSL certificate renewed</p>
                <p className="text-gray-500 text-xs">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
