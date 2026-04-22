/* data.js — static dataset replaced by live backend integration.
   Events are now loaded from the FastAPI backend:
     - Initial load:  GET /events/recent
     - Live stream:   GET /stream/events  (SSE)
     - Analytics:     GET /analytics/*    (PostgreSQL)
*/
window.DISASTER_EVENTS = [];   // kept for safety; map.js uses window.LIVE_EVENTS instead
