'use client';

import { useEffect, useState } from 'react';

export default function DebugBannersPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        
        console.log('Fetching from:', `${API_URL}/homepage/banners?active_only=true`);
        
        const response = await fetch(`${API_URL}/homepage/banners?active_only=true`);
        const json = await response.json();
        
        console.log('Raw response:', json);
        setData(json);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Banners API</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {data && (
        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="font-bold">Success: {data.success ? 'Yes' : 'No'}</h2>
            <h2 className="font-bold">Data count: {data.data?.length || 0}</h2>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">Raw Response:</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          
          {data.data && data.data.length > 0 && (
            <div>
              <h2 className="font-bold mb-2">Banners by Type:</h2>
              <div className="space-y-2">
                {['HERO', 'PROMO_FULL', 'PROMO_LARGE', 'PROMO_SMALL'].map(type => {
                  const count = data.data.filter((b: any) => b.banner_type === type).length;
                  return (
                    <div key={type} className="bg-white p-2 rounded border">
                      <strong>{type}:</strong> {count} banner(s)
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!data && !error && (
        <div className="text-gray-500">Loading...</div>
      )}
    </div>
  );
}
