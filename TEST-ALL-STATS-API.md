# Testing the All Stats API

## Quick Test Commands

### 1. Basic Test (Last 30 Days)
```bash
# Replace YOUR_WEBSITE_ID and YOUR_TOKEN with actual values
WEBSITE_ID="your-website-id-here"
TOKEN="your-auth-token-here"
START_DATE=$(date -v-30d +%s)000
END_DATE=$(date +%s)000

curl -X GET \
  "http://localhost:3000/api/websites/${WEBSITE_ID}/all-stats?startAt=${START_DATE}&endAt=${END_DATE}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '.'
```

### 2. With Timeseries (Last 7 Days, Daily)
```bash
WEBSITE_ID="your-website-id-here"
TOKEN="your-auth-token-here"
START_DATE=$(date -v-7d +%s)000
END_DATE=$(date +%s)000

curl -X GET \
  "http://localhost:3000/api/websites/${WEBSITE_ID}/all-stats?startAt=${START_DATE}&endAt=${END_DATE}&unit=day&timezone=UTC" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '.'
```

### 3. With Comparison and Top 5 Metrics
```bash
WEBSITE_ID="your-website-id-here"
TOKEN="your-auth-token-here"
START_DATE=$(date -v-30d +%s)000
END_DATE=$(date +%s)000

curl -X GET \
  "http://localhost:3000/api/websites/${WEBSITE_ID}/all-stats?startAt=${START_DATE}&endAt=${END_DATE}&compare=30d&limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '.'
```

### 4. Filtered (Mobile Traffic Only)
```bash
WEBSITE_ID="your-website-id-here"
TOKEN="your-auth-token-here"
START_DATE=$(date -v-30d +%s)000
END_DATE=$(date +%s)000

curl -X GET \
  "http://localhost:3000/api/websites/${WEBSITE_ID}/all-stats?startAt=${START_DATE}&endAt=${END_DATE}&device=mobile" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '.'
```

### 5. Complete Example (All Features)
```bash
WEBSITE_ID="your-website-id-here"
TOKEN="your-auth-token-here"
START_DATE=$(date -v-30d +%s)000
END_DATE=$(date +%s)000

curl -X GET \
  "http://localhost:3000/api/websites/${WEBSITE_ID}/all-stats?startAt=${START_DATE}&endAt=${END_DATE}&unit=day&timezone=America/New_York&compare=30d&limit=10" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '.'
```

## Expected Response Structure

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
      { "t": "2024-01-02", "y": 485 }
    ],
    "sessions": [
      { "t": "2024-01-01", "y": 145 },
      { "t": "2024-01-02", "y": 132 }
    ]
  },
  "topMetrics": {
    "urls": [
      { "x": "/home", "y": 3240 },
      { "x": "/about", "y": 2150 }
    ],
    "referrers": [
      { "x": "google.com", "y": 1240 },
      { "x": "facebook.com", "y": 890 }
    ],
    "browsers": [
      { "x": "Chrome", "y": 2140 },
      { "x": "Safari", "y": 980 }
    ],
    "os": [
      { "x": "Windows", "y": 1840 },
      { "x": "Mac OS", "y": 1320 }
    ],
    "devices": [
      { "x": "desktop", "y": 2840 },
      { "x": "mobile", "y": 1240 }
    ],
    "countries": [
      { "x": "US", "y": 1240 },
      { "x": "GB", "y": 890 }
    ],
    "languages": [
      { "x": "en", "y": 2840 },
      { "x": "es", "y": 640 }
    ]
  },
  "eventData": {
    "events": 892,
    "properties": 15,
    "records": 4562
  }
}
```

## Testing Checklist

- [ ] Endpoint responds successfully (200 OK)
- [ ] Basic stats are returned with `value` and `prev` fields
- [ ] Session stats are returned
- [ ] Top metrics for all 7 categories are returned
- [ ] Event data stats are included
- [ ] Timeseries data appears when `unit` and `timezone` provided
- [ ] Comparison works when `compare` parameter is set
- [ ] Limit parameter affects number of items in top metrics
- [ ] Filters work correctly (test with `device=mobile`, `country=US`, etc.)
- [ ] Authentication is required (401 without token)
- [ ] Authorization works (can only access websites you have permission for)

## Troubleshooting

### 401 Unauthorized
- Verify your auth token is valid
- Check the token is included in the `Authorization` header

### 403 Forbidden
- Verify you have access to this website
- Check the website ID is correct

### Empty Data
- Verify the website has tracking data in the specified date range
- Check that the date range is valid (startAt < endAt)

### Missing Timeseries
- Ensure both `unit` and `timezone` parameters are provided
- Valid units: `year`, `month`, `day`, `hour`

## Notes

- **jq** is used to format JSON output (install with `brew install jq` on macOS)
- Replace `localhost:3000` with your actual Umami server URL
- Timestamps are in milliseconds
- The `date` command syntax shown is for macOS/BSD. On Linux, use `date -d` instead of `date -v`

### Linux Date Command Adjustments
```bash
# For Linux, use this instead:
START_DATE=$(date -d '30 days ago' +%s)000
END_DATE=$(date +%s)000
```

## Integration Test Example

```javascript
// test-all-stats.js
const fetch = require('node-fetch');

async function testAllStatsAPI() {
  const websiteId = 'your-website-id';
  const token = 'your-token';
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const url = `http://localhost:3000/api/websites/${websiteId}/all-stats?` + 
    new URLSearchParams({
      startAt: thirtyDaysAgo.toString(),
      endAt: now.toString(),
      unit: 'day',
      timezone: 'UTC',
      compare: '30d',
      limit: '10'
    });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ API Test Passed!');
    console.log('Stats:', data.stats);
    console.log('Top URLs:', data.topMetrics.urls.slice(0, 3));
    console.log('Top Countries:', data.topMetrics.countries.slice(0, 3));
    
    return data;
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    throw error;
  }
}

// Run the test
testAllStatsAPI();
```

Run with: `node test-all-stats.js`

