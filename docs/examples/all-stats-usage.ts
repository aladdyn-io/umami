/**
 * Example usage of the All Stats API endpoint
 * This file demonstrates how to use the new /api/websites/{id}/all-stats endpoint
 */

// Type definitions for the response
interface AllStatsResponse {
  stats: {
    pageviews: { value: number; prev: number };
    visitors: { value: number; prev: number };
    visits: { value: number; prev: number };
    bounces: { value: number; prev: number };
    totaltime: { value: number; prev: number };
  };
  sessionStats: {
    pageviews: { value: number };
    visitors: { value: number };
    visits: { value: number };
    countries: { value: number };
    events: { value: number };
  };
  timeseries: {
    pageviews: Array<{ t: string; y: number }>;
    sessions: Array<{ t: string; y: number }>;
  };
  topMetrics: {
    urls: Array<{ x: string; y: number }>;
    referrers: Array<{ x: string; y: number }>;
    browsers: Array<{ x: string; y: number }>;
    os: Array<{ x: string; y: number }>;
    devices: Array<{ x: string; y: number }>;
    countries: Array<{ x: string; y: number }>;
    languages: Array<{ x: string; y: number }>;
  };
  eventData: {
    events: number;
    properties: number;
    records: number;
  };
}

// Parameters interface
interface AllStatsParams {
  websiteId: string;
  startAt: number;
  endAt: number;
  unit?: 'year' | 'month' | 'day' | 'hour';
  timezone?: string;
  compare?: string;
  limit?: number;
  // Filter parameters
  url?: string;
  referrer?: string;
  title?: string;
  query?: string;
  host?: string;
  os?: string;
  browser?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  screen?: string;
}

/**
 * Fetch all website stats in a single API call
 */
async function fetchAllStats(
  params: AllStatsParams,
  token?: string
): Promise<AllStatsResponse> {
  const { websiteId, ...queryParams } = params;

  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `/api/websites/${websiteId}/all-stats?${searchParams}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// EXAMPLE 1: Basic usage - Get last 30 days stats
// ============================================================================

async function example1_basicUsage() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const stats = await fetchAllStats({
    websiteId: 'abc123',
    startAt: thirtyDaysAgo,
    endAt: now,
  });

  console.log('Total pageviews:', stats.stats.pageviews.value);
  console.log('Total visitors:', stats.stats.visitors.value);
  console.log('Bounce rate:', 
    (stats.stats.bounces.value / stats.stats.visits.value * 100).toFixed(2) + '%'
  );
}

// ============================================================================
// EXAMPLE 2: With timeseries data and comparison
// ============================================================================

async function example2_withTimeseries() {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const stats = await fetchAllStats({
    websiteId: 'abc123',
    startAt: sevenDaysAgo,
    endAt: now,
    unit: 'day',
    timezone: 'America/New_York',
    compare: '7d', // Compare with previous 7 days
    limit: 5, // Get top 5 for each metric
  });

  // Show growth compared to previous period
  const growth = stats.stats.pageviews.value - stats.stats.pageviews.prev;
  const growthPercent = (growth / stats.stats.pageviews.prev * 100).toFixed(1);
  console.log(`Pageviews growth: ${growthPercent}%`);

  // Display timeseries data
  console.log('Daily pageviews:');
  stats.timeseries.pageviews.forEach(({ t, y }) => {
    console.log(`  ${t}: ${y} views`);
  });

  // Show top URLs
  console.log('\nTop URLs:');
  stats.topMetrics.urls.forEach(({ x, y }) => {
    console.log(`  ${x}: ${y} views`);
  });
}

// ============================================================================
// EXAMPLE 3: With filters - Analyze mobile traffic from USA
// ============================================================================

async function example3_withFilters() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const stats = await fetchAllStats({
    websiteId: 'abc123',
    startAt: thirtyDaysAgo,
    endAt: now,
    device: 'mobile',
    country: 'US',
    limit: 10,
  });

  console.log('Mobile traffic from USA:');
  console.log('  Visitors:', stats.stats.visitors.value);
  console.log('  Top browsers:', stats.topMetrics.browsers.slice(0, 3));
  console.log('  Top pages:', stats.topMetrics.urls.slice(0, 5));
}

// ============================================================================
// EXAMPLE 4: React Hook
// ============================================================================

import { useState, useEffect } from 'react';

function useWebsiteStats(params: AllStatsParams) {
  const [data, setData] = useState<AllStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        const stats = await fetchAllStats(params);
        if (mounted) {
          setData(stats);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load stats'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}

// Usage in a React component
function DashboardComponent({ websiteId }: { websiteId: string }) {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const { data, loading, error } = useWebsiteStats({
    websiteId,
    startAt: thirtyDaysAgo,
    endAt: now,
    unit: 'day',
    timezone: 'UTC',
    compare: '30d',
    limit: 10,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>Website Analytics</h1>
      
      <section>
        <h2>Overview</h2>
        <div>Pageviews: {data.stats.pageviews.value.toLocaleString()}</div>
        <div>Visitors: {data.stats.visitors.value.toLocaleString()}</div>
        <div>Visits: {data.stats.visits.value.toLocaleString()}</div>
      </section>

      <section>
        <h2>Top Pages</h2>
        <ul>
          {data.topMetrics.urls.map(({ x, y }) => (
            <li key={x}>{x}: {y} views</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Traffic Sources</h2>
        <ul>
          {data.topMetrics.referrers.map(({ x, y }) => (
            <li key={x}>{x}: {y} visitors</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Visitor Technology</h2>
        <div>
          <h3>Browsers</h3>
          <ul>
            {data.topMetrics.browsers.map(({ x, y }) => (
              <li key={x}>{x}: {y}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Operating Systems</h3>
          <ul>
            {data.topMetrics.os.map(({ x, y }) => (
              <li key={x}>{x}: {y}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Devices</h3>
          <ul>
            {data.topMetrics.devices.map(({ x, y }) => (
              <li key={x}>{x}: {y}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2>Geographic Distribution</h2>
        <ul>
          {data.topMetrics.countries.map(({ x, y }) => (
            <li key={x}>{x}: {y} visitors</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Calculating Derived Metrics
// ============================================================================

function calculateMetrics(stats: AllStatsResponse) {
  const { pageviews, visitors, visits, bounces, totaltime } = stats.stats;

  return {
    // Bounce rate
    bounceRate: (bounces.value / visits.value * 100).toFixed(2) + '%',
    
    // Pages per visit
    pagesPerVisit: (pageviews.value / visits.value).toFixed(2),
    
    // Average time on site (in seconds)
    avgTimeOnSite: Math.round(totaltime.value / visits.value / 1000),
    
    // Growth metrics
    pageviewGrowth: ((pageviews.value - pageviews.prev) / pageviews.prev * 100).toFixed(1) + '%',
    visitorGrowth: ((visitors.value - visitors.prev) / visitors.prev * 100).toFixed(1) + '%',
    
    // Total unique visitors vs total visits
    returningVisitorRate: ((visits.value - visitors.value) / visits.value * 100).toFixed(2) + '%',
  };
}

// Usage
async function example5_derivedMetrics() {
  const stats = await fetchAllStats({
    websiteId: 'abc123',
    startAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endAt: Date.now(),
    compare: '30d',
  });

  const metrics = calculateMetrics(stats);
  console.log('Derived Metrics:', metrics);
}

// Export for use in other files
export {
  fetchAllStats,
  useWebsiteStats,
  calculateMetrics,
  type AllStatsResponse,
  type AllStatsParams,
};

