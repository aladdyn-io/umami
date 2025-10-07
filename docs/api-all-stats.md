# Get All Website Stats API

## Overview
This endpoint returns comprehensive website statistics in a single API call, combining data from multiple individual endpoints.

## Endpoint
```
GET /api/websites/{websiteId}/all-stats
```

## Parameters

### Required
- `startAt` (number): Start timestamp in milliseconds
- `endAt` (number): End timestamp in milliseconds

### Optional
- `unit` (string): Time unit for timeseries data (`year`, `month`, `day`, `hour`)
- `timezone` (string): Timezone for timeseries data (e.g., `America/New_York`)
- `compare` (string): Comparison period (`1d`, `7d`, `30d`, `1y`, etc.)
- `limit` (number): Maximum number of results for top metrics (default: 10)

### Filter Parameters
- `url` (string): Filter by URL path
- `referrer` (string): Filter by referrer
- `title` (string): Filter by page title
- `query` (string): Filter by query parameters
- `host` (string): Filter by hostname
- `os` (string): Filter by operating system
- `browser` (string): Filter by browser
- `device` (string): Filter by device type
- `country` (string): Filter by country code
- `region` (string): Filter by region
- `city` (string): Filter by city
- `language` (string): Filter by language
- `screen` (string): Filter by screen size

## Response Structure

```typescript
{
  // Basic website stats with comparison to previous period
  stats: {
    pageviews: { value: number, prev: number },
    visitors: { value: number, prev: number },
    visits: { value: number, prev: number },
    bounces: { value: number, prev: number },
    totaltime: { value: number, prev: number }
  },
  
  // Session statistics
  sessionStats: {
    pageviews: { value: number },
    visitors: { value: number },
    visits: { value: number },
    countries: { value: number },
    events: { value: number }
  },
  
  // Timeseries data (only included if unit and timezone provided)
  timeseries: {
    pageviews: Array<{ t: string, y: number }>,
    sessions: Array<{ t: string, y: number }>
  },
  
  // Top metrics
  topMetrics: {
    urls: Array<{ x: string, y: number }>,
    referrers: Array<{ x: string, y: number }>,
    browsers: Array<{ x: string, y: number }>,
    os: Array<{ x: string, y: number }>,
    devices: Array<{ x: string, y: number }>,
    countries: Array<{ x: string, y: number }>,
    languages: Array<{ x: string, y: number }>
  },
  
  // Event data statistics
  eventData: {
    events: number,
    properties: number,
    records: number
  }
}
```

## Example Request

```bash
curl -X GET \
  'https://your-domain.com/api/websites/abc123/all-stats?startAt=1704067200000&endAt=1706745600000&unit=day&timezone=UTC&compare=30d&limit=5' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Example Response

```json
{
  "stats": {
    "pageviews": { "value": 15420, "prev": 12850 },
    "visitors": { "value": 3240, "prev": 2890 },
    "visits": { "value": 4560, "prev": 3920 },
    "bounces": { "value": 1820, "prev": 1650 },
    "totaltime": { "value": 452800, "prev": 389200 }
  },
  "sessionStats": {
    "pageviews": { "value": 15420 },
    "visitors": { "value": 3240 },
    "visits": { "value": 4560 },
    "countries": { "value": 45 },
    "events": { "value": 892 }
  },
  "timeseries": {
    "pageviews": [
      { "t": "2024-01-01", "y": 520 },
      { "t": "2024-01-02", "y": 485 },
      ...
    ],
    "sessions": [
      { "t": "2024-01-01", "y": 145 },
      { "t": "2024-01-02", "y": 132 },
      ...
    ]
  },
  "topMetrics": {
    "urls": [
      { "x": "/home", "y": 3240 },
      { "x": "/about", "y": 2150 },
      { "x": "/products", "y": 1890 },
      { "x": "/contact", "y": 1420 },
      { "x": "/blog", "y": 980 }
    ],
    "referrers": [
      { "x": "google.com", "y": 1240 },
      { "x": "facebook.com", "y": 890 },
      { "x": "twitter.com", "y": 560 },
      { "x": "linkedin.com", "y": 420 },
      { "x": "reddit.com", "y": 310 }
    ],
    "browsers": [
      { "x": "Chrome", "y": 2140 },
      { "x": "Safari", "y": 980 },
      { "x": "Firefox", "y": 560 },
      { "x": "Edge", "y": 340 },
      { "x": "Opera", "y": 120 }
    ],
    "os": [
      { "x": "Windows", "y": 1840 },
      { "x": "Mac OS", "y": 1320 },
      { "x": "Linux", "y": 560 },
      { "x": "Android", "y": 340 },
      { "x": "iOS", "y": 180 }
    ],
    "devices": [
      { "x": "desktop", "y": 2840 },
      { "x": "mobile", "y": 1240 },
      { "x": "tablet", "y": 160 }
    ],
    "countries": [
      { "x": "US", "y": 1240 },
      { "x": "GB", "y": 890 },
      { "x": "CA", "y": 560 },
      { "x": "DE", "y": 420 },
      { "x": "FR", "y": 310 }
    ],
    "languages": [
      { "x": "en", "y": 2840 },
      { "x": "es", "y": 640 },
      { "x": "fr", "y": 420 },
      { "x": "de", "y": 380 },
      { "x": "pt", "y": 240 }
    ]
  },
  "eventData": {
    "events": 892,
    "properties": 15,
    "records": 4562
  }
}
```

## Benefits

### Before (Multiple API Calls)
```javascript
// Previously needed 10+ API calls
const stats = await fetch('/api/websites/abc123/stats?...');
const sessionStats = await fetch('/api/websites/abc123/sessions/stats?...');
const pageviews = await fetch('/api/websites/abc123/pageviews?...');
const urls = await fetch('/api/websites/abc123/metrics?type=url&...');
const referrers = await fetch('/api/websites/abc123/metrics?type=referrer&...');
const browsers = await fetch('/api/websites/abc123/metrics?type=browser&...');
// ... and so on
```

### After (Single API Call)
```javascript
// Now only 1 API call
const allStats = await fetch('/api/websites/abc123/all-stats?...');
```

## Use Cases

1. **Dashboard Overview**: Get all necessary stats for a complete dashboard in one request
2. **Performance**: Reduce network overhead and improve loading times
3. **Mobile Apps**: Minimize battery usage by reducing HTTP requests
4. **Reports**: Generate comprehensive reports with a single data fetch
5. **Real-time Analytics**: Efficiently update multiple metrics simultaneously

## Notes

- All parameters that work with individual stats endpoints are supported
- The `compare` parameter only affects the `stats` section
- Timeseries data (`pageviews` and `sessions`) is only included when both `unit` and `timezone` are provided
- The `limit` parameter controls the number of items returned for each metric in `topMetrics`
- Event data stats will return zeros if no events exist for the period
- Authentication is required (same as other API endpoints)

