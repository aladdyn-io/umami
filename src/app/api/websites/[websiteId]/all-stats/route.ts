import { z } from 'zod';
import { parseRequest, getRequestDateRange, getRequestFilters } from '@/lib/request';
import { unauthorized, json } from '@/lib/response';
import { canViewWebsite } from '@/lib/auth';
import { getCompareDate } from '@/lib/date';
import { filterParams, unitParam, timezoneParam } from '@/lib/schema';
import {
  getWebsiteStats,
  getWebsiteSessionStats,
  getPageviewStats,
  getSessionStats,
  getPageviewMetrics,
  getSessionMetrics,
  getEventDataStats,
} from '@/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const schema = z.object({
    startAt: z.coerce.number().int(),
    endAt: z.coerce.number().int(),
    unit: unitParam.optional(),
    timezone: timezoneParam.optional(),
    compare: z.string().optional(),
    limit: z.coerce.number().optional().default(10),
    ...filterParams,
  });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { websiteId } = await params;
  const { compare, timezone, limit } = query;

  if (!(await canViewWebsite(auth, websiteId))) {
    return unauthorized();
  }

  const { startDate, endDate, unit } = await getRequestDateRange(query);
  const { startDate: compareStartDate, endDate: compareEndDate } = getCompareDate(
    compare,
    startDate,
    endDate,
  );

  const filters = await getRequestFilters(query);

  // Fetch all stats in parallel
  const [
    websiteMetrics,
    prevWebsiteMetrics,
    sessionStats,
    pageviews,
    sessions,
    topUrls,
    topReferrers,
    topBrowsers,
    topOs,
    topDevices,
    topCountries,
    topLanguages,
    eventDataStats,
  ] = await Promise.all([
    // Basic website stats
    getWebsiteStats(websiteId, {
      ...filters,
      startDate,
      endDate,
    }),
    // Previous period stats for comparison
    getWebsiteStats(websiteId, {
      ...filters,
      startDate: compareStartDate,
      endDate: compareEndDate,
    }),
    // Session stats
    getWebsiteSessionStats(websiteId, {
      ...filters,
      startDate,
      endDate,
    }),
    // Pageview timeseries
    unit && timezone
      ? getPageviewStats(websiteId, {
          ...filters,
          startDate,
          endDate,
          timezone,
          unit,
        })
      : Promise.resolve([]),
    // Session timeseries
    unit && timezone
      ? getSessionStats(websiteId, {
          ...filters,
          startDate,
          endDate,
          timezone,
          unit,
        })
      : Promise.resolve([]),
    // Top metrics
    getPageviewMetrics(websiteId, 'url', { ...filters, startDate, endDate }, limit),
    getSessionMetrics(websiteId, 'referrer', { ...filters, startDate, endDate }, limit),
    getSessionMetrics(websiteId, 'browser', { ...filters, startDate, endDate }, limit),
    getSessionMetrics(websiteId, 'os', { ...filters, startDate, endDate }, limit),
    getSessionMetrics(websiteId, 'device', { ...filters, startDate, endDate }, limit),
    getSessionMetrics(websiteId, 'country', { ...filters, startDate, endDate }, limit),
    getSessionMetrics(websiteId, 'language', { ...filters, startDate, endDate }, limit),
    // Event data stats (may be empty if no events)
    getEventDataStats(websiteId, { startDate, endDate }).catch(() => ({
      events: 0,
      properties: 0,
      records: 0,
    })),
  ]);

  // Format basic stats with comparison
  const stats = Object.keys(websiteMetrics[0]).reduce((obj, key) => {
    obj[key] = {
      value: Number(websiteMetrics[0][key]) || 0,
      prev: Number(prevWebsiteMetrics[0][key]) || 0,
    };
    return obj;
  }, {} as Record<string, { value: number; prev: number }>);

  // Format session stats
  const sessionStatsData = Object.keys(sessionStats[0]).reduce((obj, key) => {
    obj[key] = {
      value: Number(sessionStats[0][key]) || 0,
    };
    return obj;
  }, {} as Record<string, { value: number }>);

  // Combine language data (lowercase first part of locale)
  const combinedLanguages = {};
  for (const { x, y } of topLanguages) {
    const key = String(x).toLowerCase().split('-')[0];
    if (combinedLanguages[key] === undefined) {
      combinedLanguages[key] = { x: key, y };
    } else {
      combinedLanguages[key].y += y;
    }
  }

  return json({
    stats,
    sessionStats: sessionStatsData,
    timeseries: {
      pageviews,
      sessions,
    },
    topMetrics: {
      urls: topUrls,
      referrers: topReferrers,
      browsers: topBrowsers,
      os: topOs,
      devices: topDevices,
      countries: topCountries,
      languages: Object.values(combinedLanguages),
    },
    eventData: eventDataStats,
  });
}

