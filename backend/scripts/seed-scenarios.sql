-- Seed sample scenarios

-- 1. Real-time Chat System (FREE)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'chat-realtime',
    'Real-time Chat System',
    'Design a scalable real-time chat system like WhatsApp or Slack that can handle millions of concurrent users with low latency message delivery.',
    'Messaging',
    'Intermediate',
    45,
    'free',
    '{"traffic_load": "50K requests per second", "sla": "P95 latency < 200ms", "user_base": "20M daily active users", "consistency": "Eventual consistency allowed", "constraints": ["Limited write throughput", "Mobile network variability", "Multi-region users"]}',
    '["Consider using WebSocket connections for real-time messaging", "Use message queues to handle bursts of messages", "Implement a presence service to track online users", "Cache user data and recent messages for faster access", "Use CDN for static assets and media files"]',
    '{"max_latency_ms": 200, "max_error_rate_percent": 1, "min_throughput_rps": 50000, "must_support_regions": ["US", "EU", "APAC"]}',
    true
);

-- 2. Video Streaming Platform (PREMIUM)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'video-streaming',
    'Video Streaming Platform',
    'Build a video streaming platform similar to YouTube or Netflix that can serve millions of concurrent video streams with adaptive bitrate.',
    'Video Streaming',
    'Advanced',
    60,
    'premium',
    '{"traffic_load": "100K concurrent streams", "sla": "Buffer time < 3 seconds", "user_base": "50M monthly active users", "consistency": "Strong consistency for user data, eventual for views", "constraints": ["High bandwidth costs", "Global user base", "Multiple device types"]}',
    '["Use CDN to distribute video content globally", "Implement adaptive bitrate streaming (HLS/DASH)", "Consider video transcoding pipeline", "Use object storage for video files", "Implement view counting with eventual consistency"]',
    '{"max_latency_ms": 3000, "max_error_rate_percent": 0.5, "min_throughput_rps": 10000, "must_support_regions": ["US", "EU", "APAC", "SA"]}',
    true
);

-- 3. E-commerce Product Catalog (FREE)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'ecommerce-catalog',
    'E-commerce Product Catalog',
    'Design a high-performance product catalog system for an e-commerce platform like Amazon with search, filtering, and inventory management.',
    'E-commerce',
    'Intermediate',
    40,
    'free',
    '{"traffic_load": "30K requests per second", "sla": "P99 latency < 100ms for reads", "user_base": "10M daily active users", "consistency": "Strong consistency for inventory, eventual for product data", "constraints": ["Frequent inventory updates", "Complex search queries", "High read-to-write ratio"]}',
    '["Use Elasticsearch for product search and filtering", "Cache popular product data in Redis", "Implement read replicas for scaling reads", "Use pessimistic locking for inventory updates", "Consider event sourcing for order processing"]',
    '{"max_latency_ms": 100, "max_error_rate_percent": 0.1, "min_throughput_rps": 30000, "must_support_regions": ["US", "EU"]}',
    true
);

-- 4. Social Media Feed (PREMIUM)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'social-feed',
    'Social Media Feed',
    'Build a personalized social media feed system like Twitter or Instagram that can generate and serve personalized content feeds in real-time.',
    'Social Media Feed',
    'Advanced',
    55,
    'premium',
    '{"traffic_load": "80K requests per second", "sla": "P95 latency < 300ms", "user_base": "100M daily active users", "consistency": "Eventual consistency acceptable", "constraints": ["Complex ranking algorithms", "User graph traversal", "Real-time updates"]}',
    '["Use fanout-on-write for users with few followers", "Use fanout-on-read for celebrity accounts", "Cache user feeds in memory", "Implement timeline service for feed aggregation", "Use graph database for social connections"]',
    '{"max_latency_ms": 300, "max_error_rate_percent": 1, "min_throughput_rps": 80000, "must_support_regions": ["US", "EU", "APAC"]}',
    true
);

-- 5. Analytics Dashboard (PREMIUM)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'analytics-dashboard',
    'Analytics Dashboard',
    'Design a real-time analytics dashboard system that processes and visualizes billions of events per day with low latency queries.',
    'Analytics',
    'Advanced',
    50,
    'premium',
    '{"traffic_load": "1M events per second", "sla": "Query latency < 2 seconds", "user_base": "5M monthly active users", "consistency": "Eventual consistency acceptable", "constraints": ["Large data volumes", "Complex aggregations", "Historical data retention"]}',
    '["Use stream processing (Kafka, Flink) for real-time ingestion", "Store data in columnar format (ClickHouse, BigQuery)", "Pre-aggregate common queries", "Use time-series database for metrics", "Implement data retention policies"]',
    '{"max_latency_ms": 2000, "max_error_rate_percent": 0.5, "min_throughput_rps": 5000, "must_support_regions": ["US", "EU"]}',
    true
);

-- 6. URL Shortener (FREE)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'url-shortener',
    'URL Shortener Service',
    'Build a URL shortening service like bit.ly that can generate short URLs and redirect users with high availability and low latency.',
    'Web Services',
    'Beginner',
    30,
    'free',
    '{"traffic_load": "10K requests per second", "sla": "P95 latency < 100ms", "user_base": "1M daily active users", "consistency": "Strong consistency for URL creation", "constraints": ["Short URL collisions", "High read-to-write ratio", "Custom aliases"]}',
    '["Use base62 encoding for short URL generation", "Implement URL cache for popular links", "Use distributed ID generation", "Add analytics tracking for clicks", "Consider rate limiting for abuse prevention"]',
    '{"max_latency_ms": 100, "max_error_rate_percent": 0.1, "min_throughput_rps": 10000, "must_support_regions": ["US", "EU"]}',
    true
);

-- 7. Notification System (FREE)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'notification-system',
    'Multi-Channel Notification System',
    'Design a notification system that can send push notifications, emails, and SMS to millions of users across multiple channels with reliability.',
    'Notification Systems',
    'Intermediate',
    40,
    'free',
    '{"traffic_load": "20K notifications per second", "sla": "Delivery within 5 seconds", "user_base": "30M users", "consistency": "At-least-once delivery guarantee", "constraints": ["Multiple channels (email, push, SMS)", "User preferences", "Rate limiting per channel"]}',
    '["Use message queue for reliable delivery", "Implement retry mechanism with exponential backoff", "Batch notifications when possible", "Store user preferences in fast cache", "Use worker pools for different channels"]',
    '{"max_latency_ms": 5000, "max_error_rate_percent": 0.5, "min_throughput_rps": 20000, "must_support_regions": ["US", "EU", "APAC"]}',
    true
);

-- 8. Ride-Sharing Service (PREMIUM)
INSERT INTO scenarios (id, title, description, category, difficulty, estimated_time, tier, requirements, hints, goals, is_active)
VALUES (
    'ride-sharing',
    'Ride-Sharing Platform',
    'Build a ride-sharing platform like Uber or Lyft with real-time location tracking, matching algorithms, and surge pricing.',
    'Maps / Navigation',
    'Advanced',
    60,
    'premium',
    '{"traffic_load": "15K requests per second", "sla": "Matching latency < 1 second", "user_base": "5M daily active users", "consistency": "Strong consistency for ride state", "constraints": ["Real-time location updates", "Matching algorithm complexity", "Surge pricing calculation"]}',
    '["Use geospatial indexing for nearby driver search", "Implement location update buffering", "Use WebSocket for real-time updates", "Cache driver availability in memory", "Implement event-driven architecture for ride state"]',
    '{"max_latency_ms": 1000, "max_error_rate_percent": 0.1, "min_throughput_rps": 15000, "must_support_regions": ["US", "EU", "APAC"]}',
    true
);
