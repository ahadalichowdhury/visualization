import type { Edge, Node } from "reactflow";

// Node configuration
export interface NodeConfig {
  // Common (all components)
  region?: string; // e.g., 'us-east', 'eu-central'
  replicas?: number; // Number of instances

  // Compute (API, Web, Microservice, Worker)
  instanceType?: string; // e.g., 't3.micro', 'm5.large', 'c5.xlarge'

  // Database
  databaseEngine?: "postgres" | "mysql" | "mariadb" | "mongodb"; // NEW
  storageType?: string; // e.g., 'gp3', 'io2', 'st1'
  storage_size_gb?: number; // Storage size in GB
  consistency?: "strong" | "eventual"; // Consistency model

  // Cache (Redis, Memcached)
  cacheEngine?: "redis" | "memcached"; // NEW
  ttl_ms?: number; // Time to live in milliseconds

  // Load Balancer
  lbType?: string; // 'alb', 'nlb', 'classic'
  accessType?: "internal" | "external"; // NEW: Internal vs Internet-Facing

  // Queue / Message Broker
  queueType?: string; // 'sqs-standard', 'sqs-fifo', 'kafka-small', etc.
  maxQueueDepth?: number; // NEW: Maximum queue depth
  messageRetentionDays?: number; // NEW: Message retention (1-30 days)

  // API Gateway
  apiGatewayType?: "rest" | "http" | "websocket"; // NEW
  throttleRPS?: number; // NEW: Rate limiting

  // CDN
  cdnType?: string; // 'cloudfront-basic', 'cloudfront-premium', 'akamai'

  // Object Storage
  objectStorageType?: string; // 's3-standard', 's3-ia', 's3-glacier'

  // Search Engine
  // Search Engine
  searchType?: string; // 'es-small', 'es-medium', 'es-large'

  // Workload Characteristics (NEW)
  readRatio?: number; // 0-100% (Percentage of traffic that is READs)

  // SRE PRODUCTION FIX: Change Data Capture flag
  cdcEnabled?: boolean; // Enable Change Data Capture (Debezium) for DB → Queue/Broker connections

  // Serverless Functions (Lambda/Cloud Functions/Azure Functions)
  runtime?: string; // e.g., 'nodejs18', 'python3.9', 'go1.x'
  memoryMB?: number; // Memory allocation in MB
  timeoutSeconds?: number; // Function timeout

  // ML Model Serving (SageMaker/Vertex AI/Azure ML)
  modelSizeMB?: number; // Model size in MB
  accelerator?: string; // 'none', 'gpu', 'tpu', 'inf1'

  // Kubernetes Components
  cpuRequest?: string; // e.g., '500m'
  memoryRequest?: string; // e.g., '512Mi'
  cpuLimit?: string; // e.g., '1000m'
  memoryLimit?: string; // e.g., '1Gi'
  type?: string; // For K8s Service type: 'ClusterIP', 'NodePort', 'LoadBalancer'
  port?: number; // Port number
  ingressClass?: string; // e.g., 'nginx'
  tlsEnabled?: boolean;

  // Multi-cloud specific
  sku?: string; // Azure App Service SKU
  instanceClass?: string; // GCP App Engine instance class
  consistencyLevel?: string; // Azure Cosmos DB consistency
  requestUnits?: number; // Azure Cosmos DB RU/s
  mode?: string; // GCP Firestore mode
  tier?: string; // Azure Service Bus tier
  messageRetention?: string; // GCP Pub/Sub retention

  // NOTE: NO capacity_rps or latency_ms here!
  // Performance is calculated ONLY during simulation based on:
  // - Hardware specs (vCPU, memory, network, storage IOPS)
  // - Workload pattern (RPS, burst/spike)
  // - Application complexity
  // This matches real-world: deploy code → load test → measure performance
}

// Node data
export interface NodeData {
  label: string;
  config: NodeConfig;
  nodeType?: string; // Store the node type for validation
}

// Custom node and edge types
export type BuilderNode = Node<NodeData>;
export type BuilderEdge = Edge;

// Node type definition
export interface NodeTypeDefinition {
  type: string;
  label: string;
  icon: string;
  defaultConfig: NodeConfig;
  description: string;
  category: "compute" | "storage" | "network" | "messaging" | "database" | "other";
}

// Canvas state
export interface CanvasState {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  metadata?: {
    scenarioId?: string;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

// Connection validation rule
export interface ConnectionRule {
  from: string[];
  to: string[];
}

// History state for undo/redo
export interface HistoryState {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}

// Available node types
export const NODE_TYPES: NodeTypeDefinition[] = [
  {
    type: "client",
    label: "Client",
    icon: "👤",
    description: "User/client application",
    category: "compute",
    defaultConfig: {},
  }, {
    type: "mobile_app",
    label: "Mobile App",
    icon: "📱",
    description: "Mobile application client",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "web_browser",
    label: "Web Browser",
    icon: "🌐",
    description: "Web browser client",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "load_balancer",
    label: "Load Balancer",
    icon: "⚖️",
    description: "Distributes traffic across servers",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "api_gateway",
    label: "API Gateway",
    icon: "🚪",
    description: "API gateway for routing requests",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "reverse_proxy",
    label: "Reverse Proxy",
    icon: "🔄",
    description: "Nginx/HAProxy reverse proxy",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "api_server",
    label: "API Server",
    icon: "🖥️",
    description: "Application/API server",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "web_server",
    label: "Web Server",
    icon: "🌍",
    description: "Static web server",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "microservice",
    label: "Microservice",
    icon: "⚙️",
    description: "Independent microservice",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "worker",
    label: "Background Worker",
    icon: "👷",
    description: "Background job processor",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "cache_redis",
    label: "Redis Cache",
    icon: "⚡",
    description: "In-memory cache",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "cache_memcached",
    label: "Memcached",
    icon: "💾",
    description: "Distributed memory cache",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "database_sql",
    label: "SQL Database",
    icon: "🗄️",
    description: "Relational database (MySQL/PostgreSQL)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "database_nosql",
    label: "NoSQL Database",
    icon: "🗃️",
    description: "Document database (MongoDB)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "database_graph",
    label: "Graph Database",
    icon: "🕸️",
    description: "Graph database (Neo4j)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "database_timeseries",
    label: "Time Series DB",
    icon: "📈",
    description: "Time series database (InfluxDB)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "queue",
    label: "Message Queue",
    icon: "📮",
    description: "Async message queue (RabbitMQ)",
    category: "messaging",
    defaultConfig: {},
  },
  {
    type: "message_broker",
    label: "Message Broker",
    icon: "📡",
    description: "Pub/sub messaging (Kafka)",
    category: "messaging",
    defaultConfig: {},
  },
  {
    type: "event_bus",
    label: "Event Bus",
    icon: "🚌",
    description: "Event streaming platform",
    category: "messaging",
    defaultConfig: {},
  },
  {
    type: "cdn",
    label: "CDN",
    icon: "🌐",
    description: "Content delivery network",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "object_storage",
    label: "Object Storage",
    icon: "📦",
    description: "S3-like object storage",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "file_storage",
    label: "File Storage",
    icon: "📁",
    description: "Network file storage (NFS)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "search",
    label: "Search Engine",
    icon: "🔍",
    description: "Full-text search (Elasticsearch)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "analytics_service",
    label: "Analytics",
    icon: "📊",
    description: "Analytics/metrics service",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "monitoring",
    label: "Monitoring",
    icon: "📉",
    description: "Monitoring system (Prometheus)",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "logging",
    label: "Logging Service",
    icon: "📝",
    description: "Centralized logging (ELK)",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "notification",
    label: "Notification Service",
    icon: "🔔",
    description: "Push notifications service",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "email_service",
    label: "Email Service",
    icon: "✉️",
    description: "Email sending service",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "auth_service",
    label: "Auth Service",
    icon: "🔐",
    description: "Authentication/Authorization",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "payment_gateway",
    label: "Payment Gateway",
    icon: "💳",
    description: "Payment processing service",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "ml_model",
    label: "ML Model",
    icon: "🤖",
    description: "Machine learning model service",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "container_orchestration",
    label: "Kubernetes",
    icon: "☸️",
    description: "Container orchestration platform",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "service_mesh",
    label: "Service Mesh",
    icon: "🕸️",
    description: "Service mesh (Istio)",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "subnet",
    label: "Private Subnet",
    icon: "🔒",
    description: "Private network segment (VPC)",
    category: "network",
    defaultConfig: {
      region: "us-east",
    },
  },
  // ==================== SRE UPGRADE: NEW COMPONENTS ====================
  // 1. Security & Identity
  {
    type: "secret_manager",
    label: "Secret Manager",
    icon: "🔑",
    description: "Secrets management (Vault/AWS Secrets)",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "waf",
    label: "WAF",
    icon: "�️",
    description: "Web Application Firewall",
    category: "network",
    defaultConfig: {},
  },
  // 2. Global Connectivity
  {
    type: "dns",
    label: "DNS / Route 53",
    icon: "🌍",
    description: "DNS & Traffic Management",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "vpn",
    label: "VPN Gateway",
    icon: "🔌",
    description: "Site-to-Site VPN / Direct Connect",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "nat_gateway",
    label: "NAT Gateway",
    icon: "🚪",
    description: "Outbound internet access for private subnets",
    category: "network",
    defaultConfig: {},
  },
  // 3. Big Data & Analytics
  {
    type: "data_warehouse",
    label: "Data Warehouse",
    icon: "🏭",
    description: "Analytics DB (Snowflake/Redshift)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "data_lake",
    label: "Data Lake",
    icon: "🌊",
    description: "Raw data storage (S3/HDFS)",
    category: "storage",
    defaultConfig: {},
  },
  {
    type: "stream_processing",
    label: "Stream Processor",
    icon: "⚡",
    description: "Real-time streaming (Flink/Spark)",
    category: "compute",
    defaultConfig: {},
  },
  // 4. Developer Experience
  {
    type: "container_registry",
    label: "Container Registry",
    icon: "🐳",
    description: "Docker Image Registry (ECR/Hub)",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "cicd_pipeline",
    label: "CI/CD Pipeline",
    icon: "🚀",
    description: "Build & Deploy Pipeline",
    category: "other",
    defaultConfig: {},
  },
  // 5. Integrations
  {
    type: "external_api",
    label: "External API",
    icon: "🔗",
    description: "Third-party Integration (Stripe/Twilio)",
    category: "network",
    defaultConfig: {},
  },
  // ==================== SRE PRODUCTION FIXES: NEW COMPONENTS ====================
  // Modern Observability Components
  {
    type: "apm",
    label: "APM / Tracing",
    icon: "📊",
    description: "Application Performance Monitoring (Datadog/New Relic/Dynatrace)",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "sidecar_proxy",
    label: "Sidecar Proxy",
    icon: "🔀",
    description: "Service Mesh Sidecar (Envoy/Linkerd)",
    category: "network",
    defaultConfig: {},
  },
  // MEDIUM PRIORITY: Additional Observability
  {
    type: "rum",
    label: "Real User Monitoring",
    icon: "👁️",
    description: "Frontend Performance Tracking (Google Analytics/Mixpanel)",
    category: "other",
    defaultConfig: {},
  },
  {
    type: "synthetic_monitoring",
    label: "Synthetic Monitoring",
    icon: "🤖",
    description: "Automated Uptime Checks (Pingdom/StatusCake)",
    category: "other",
    defaultConfig: {},
  },
  // MEDIUM PRIORITY: Modern API Patterns
  {
    type: "graphql_gateway",
    label: "GraphQL Gateway",
    icon: "🔷",
    description: "GraphQL API Gateway (Apollo/Hasura)",
    category: "network",
    defaultConfig: {},
  },
  {
    type: "grpc_server",
    label: "gRPC Server",
    icon: "⚡",
    description: "High-Performance RPC Server (gRPC)",
    category: "compute",
    defaultConfig: {},
  },
  // LOW PRIORITY: Edge & Web3
  {
    type: "wasm_runtime",
    label: "WASM Runtime",
    icon: "🌐",
    description: "WebAssembly Edge Runtime (Cloudflare Workers/Fastly)",
    category: "compute",
    defaultConfig: {},
  },
  {
    type: "blockchain_node",
    label: "Blockchain Node",
    icon: "⛓️",
    description: "Blockchain Node (Ethereum/Solana/Polygon)",
    category: "other",
    defaultConfig: {},
  },
  // ==================== PRIORITY 2: SERVERLESS FUNCTIONS ====================
  {
    type: "lambda_function",
    label: "AWS Lambda",
    icon: "λ",
    description: "Serverless Function (AWS Lambda)",
    category: "compute",
    defaultConfig: {
      runtime: "nodejs18",
      memoryMB: 1024,
      timeoutSeconds: 30,
    },
  },
  {
    type: "cloud_function",
    label: "Google Cloud Function",
    icon: "☁️",
    description: "Serverless Function (Google Cloud Functions)",
    category: "compute",
    defaultConfig: {
      runtime: "nodejs18",
      memoryMB: 512,
      timeoutSeconds: 60,
    },
  },
  {
    type: "azure_function",
    label: "Azure Function",
    icon: "⚡",
    description: "Serverless Function (Azure Functions)",
    category: "compute",
    defaultConfig: {
      runtime: "nodejs18",
      memoryMB: 1024,
      timeoutSeconds: 30,
    },
  },
  // ==================== PRIORITY 2: AI/ML MODEL SERVING ====================
  {
    type: "sagemaker_endpoint",
    label: "SageMaker Endpoint",
    icon: "🤖",
    description: "AWS SageMaker ML Model Endpoint",
    category: "compute",
    defaultConfig: {
      instanceType: "ml.m5.xlarge",
      modelSizeMB: 500,
      accelerator: "none", // "none", "gpu", "inf1" (AWS Inferentia)
    },
  },
  {
    type: "vertex_ai_endpoint",
    label: "Vertex AI Endpoint",
    icon: "🧠",
    description: "Google Cloud Vertex AI Model Endpoint",
    category: "compute",
    defaultConfig: {
      instanceType: "n1-standard-4",
      modelSizeMB: 500,
      accelerator: "none", // "none", "gpu", "tpu"
    },
  },
  {
    type: "azure_ml_endpoint",
    label: "Azure ML Endpoint",
    icon: "🎯",
    description: "Azure Machine Learning Endpoint",
    category: "compute",
    defaultConfig: {
      instanceType: "Standard_DS3_v2",
      modelSizeMB: 500,
      accelerator: "none", // "none", "gpu"
    },
  },
  // ==================== PRIORITY 2: KUBERNETES COMPONENTS ====================
  {
    type: "k8s_pod",
    label: "Kubernetes Pod",
    icon: "📦",
    description: "Kubernetes Pod (Container Runtime)",
    category: "compute",
    defaultConfig: {
      cpuRequest: "500m",
      memoryRequest: "512Mi",
      cpuLimit: "1000m",
      memoryLimit: "1Gi",
    },
  },
  {
    type: "k8s_service",
    label: "Kubernetes Service",
    icon: "🔗",
    description: "Kubernetes Service (Load Balancing & Discovery)",
    category: "network",
    defaultConfig: {
      type: "ClusterIP", // ClusterIP, NodePort, LoadBalancer
      port: 80,
    },
  },
  {
    type: "k8s_ingress",
    label: "Kubernetes Ingress",
    icon: "🌐",
    description: "Kubernetes Ingress (HTTP/HTTPS Routing)",
    category: "network",
    defaultConfig: {
      ingressClass: "nginx",
      tlsEnabled: true,
    },
  },
  // ==================== PRIORITY 2: MULTI-CLOUD EQUIVALENTS ====================
  {
    type: "azure_app_service",
    label: "Azure App Service",
    icon: "🅰️",
    description: "Azure App Service (PaaS Web Hosting)",
    category: "compute",
    defaultConfig: {
      sku: "P1v3",
      runtime: "node",
    },
  },
  {
    type: "gcp_app_engine",
    label: "GCP App Engine",
    icon: "☁️",
    description: "Google Cloud App Engine (PaaS)",
    category: "compute",
    defaultConfig: {
      instanceClass: "F2",
      runtime: "nodejs18",
    },
  },
  {
    type: "azure_cosmos_db",
    label: "Azure Cosmos DB",
    icon: "🌍",
    description: "Azure Cosmos DB (Multi-model NoSQL)",
    category: "database",
    defaultConfig: {
      consistencyLevel: "Session",
      requestUnits: 400,
    },
  },
  {
    type: "gcp_firestore",
    label: "GCP Firestore",
    icon: "🔥",
    description: "Google Cloud Firestore (NoSQL Document DB)",
    category: "database",
    defaultConfig: {
      mode: "native",
    },
  },
  {
    type: "azure_service_bus",
    label: "Azure Service Bus",
    icon: "🚌",
    description: "Azure Service Bus (Enterprise Messaging)",
    category: "messaging",
    defaultConfig: {
      tier: "Premium",
    },
  },
  {
    type: "gcp_pub_sub",
    label: "GCP Pub/Sub",
    icon: "📢",
    description: "Google Cloud Pub/Sub (Messaging)",
    category: "messaging",
    defaultConfig: {
      messageRetention: "7d",
    },
  },
];

// Connection validation rules
// Connection validation rules (Industry-Standard SRE Recommendation)
export const CONNECTION_RULES: Record<string, string[]> = {
  // Entry Points
  client: ["cdn", "load_balancer", "api_gateway", "web_server", "graphql_gateway", "rum"], // Added GraphQL and RUM
  mobile_app: ["cdn", "load_balancer", "api_gateway", "graphql_gateway", "rum"], // Added GraphQL and RUM
  web_browser: ["cdn", "web_server", "api_gateway", "graphql_gateway", "rum"], // Added GraphQL and RUM

  // Edge & Network
  cdn: ["load_balancer", "api_gateway", "web_server", "object_storage", "file_storage", "logging", "wasm_runtime"], // Added WASM
  load_balancer: ["load_balancer", "api_gateway", "api_server", "web_server", "microservice", "cache_redis", "logging", "graphql_gateway", "grpc_server"], // Added GraphQL and gRPC
  api_gateway: ["api_server", "microservice", "auth_service", "load_balancer", "cache_redis", "queue", "logging", "graphql_gateway", "grpc_server", "lambda_function", "cloud_function", "azure_function"], // Added serverless
  reverse_proxy: ["api_server", "web_server", "microservice", "load_balancer", "logging"],

  // Compute
  api_server: [
    "api_server", // Internal calls
    "database_sql",
    "database_nosql",
    "cache_redis",
    "cache_memcached",
    "queue",
    "search",
    "message_broker",
    "event_bus",
    "object_storage",
    "microservice",
    "auth_service",
    "notification",
    "email_service",
    "payment_gateway",
    "ml_model",
    "analytics_service",
    "monitoring", // REAL-WORLD: Push metrics (StatsD/Datadog)
    "logging", // App Logs
    "secret_manager", // SRE FIX: Fetch secrets at startup
    "apm", // SRE FIX: Application Performance Monitoring
    "sagemaker_endpoint", // NEW: Call ML models
    "vertex_ai_endpoint", // NEW: Call ML models
    "azure_ml_endpoint", // NEW: Call ML models
  ],

  microservice: [
    "microservice", // Service-to-service
    "database_sql",
    "database_nosql",
    "database_graph",
    "cache_redis",
    "cache_memcached",
    "queue",
    "message_broker",
    "event_bus",
    "api_gateway", // Egress
    "auth_service",
    "search",
    "object_storage",
    "monitoring", // REAL-WORLD: Push metrics
    "logging", // App Logs
    "secret_manager", // SRE FIX: Fetch secrets at startup
    "apm", // SRE FIX: Application Performance Monitoring
    "sidecar_proxy" // SRE FIX: Service mesh sidecar
  ],

  web_server: ["cdn", "object_storage", "file_storage", "cache_redis", "api_server"],

  worker: [
    "worker", // REAL-WORLD: Peer-to-peer coordination
    "api_server", // REAL-WORLD: Worker calling an internal API
    "queue",
    "message_broker",
    "database_sql",
    "database_nosql",
    "cache_redis", // For state/locks
    "notification",
    "email_service",
    "search", // Explicitly allowed
    "object_storage",
    "monitoring", // REAL-WORLD: Push metrics
    "logging", // Job Logs
    "secret_manager", // SRE FIX: Fetch API keys at startup
    "apm" // SRE FIX: Background job tracing
  ],

  // Data & Storage
  // SRE FIX: Removed direct cache → database connections
  // Real-world: Apps connect to cache, cache doesn't connect to DB directly
  cache_redis: ["monitoring"], // Push metrics (memory usage, evictions)
  cache_memcached: ["monitoring"], // Push metrics
  database_sql: ["logging", "monitoring", "object_storage", "queue", "message_broker"], // queue/broker only with CDC enabled
  database_nosql: ["logging", "monitoring", "object_storage", "search", "queue", "message_broker"], // queue/broker only with CDC enabled
  database_graph: ["logging"],
  database_timeseries: ["analytics_service"],
  object_storage: ["logging", "cdn"],
  file_storage: [],
  search: ["database_sql", "database_nosql", "object_storage"],

  // Messaging (Queue/Bus)
  queue: ["worker", "microservice", "analytics_service", "notification", "api_server", "lambda_function", "cloud_function", "azure_function"], // Added serverless triggers
  message_broker: ["worker", "microservice", "analytics_service", "notification", "queue", "lambda_function", "cloud_function", "azure_function"], // Added serverless
  event_bus: ["worker", "microservice", "analytics_service", "message_broker", "lambda_function", "cloud_function", "azure_function"], // Added serverless

  // Other Services
  analytics_service: ["database_sql", "database_nosql", "database_timeseries", "object_storage"],
  auth_service: ["database_sql", "cache_redis", "logging", "monitoring", "secret_manager"], // SRE FIX: Auth uses secrets
  monitoring: ["database_timeseries", "notification", "logging"], // SRE FIX: Removed reverse connections (apps push TO monitoring, not FROM)
  logging: ["object_storage", "search", "monitoring"], // SRE FIX: Logs can trigger alerts
  notification: ["email_service", "mobile_app", "queue"],
  email_service: ["logging"],
  payment_gateway: ["database_sql", "queue", "logging", "secret_manager"], // SRE FIX: Payment needs API keys
  ml_model: ["object_storage", "cache_redis", "database_sql"],
  container_orchestration: ["api_server", "microservice", "worker", "load_balancer"],
  service_mesh: ["microservice", "api_gateway", "load_balancer", "sidecar_proxy"], // SRE FIX: Added sidecar

  // SRE UPGRADE: New Rules
  waf: ["load_balancer", "cdn", "web_server", "api_gateway"],
  dns: ["cdn", "load_balancer", "api_gateway", "web_server", "waf"],
  vpn: ["subnet", "load_balancer", "api_gateway"],
  nat_gateway: ["external_api"],
  secret_manager: ["monitoring"], // SRE FIX: Push audit logs, accessed via API calls from apps

  data_warehouse: ["analytics_service"],
  data_lake: ["data_warehouse", "analytics_service", "stream_processing"],
  stream_processing: ["data_lake", "data_warehouse", "database_nosql", "database_sql", "object_storage"],

  container_registry: ["container_orchestration", "worker", "microservice"],
  cicd_pipeline: ["container_registry", "object_storage", "worker"],
  external_api: [],

  // SRE FIX: NEW COMPONENTS - Modern Observability
  apm: ["monitoring", "logging", "database_timeseries"], // APM → Monitoring backend (Datadog/New Relic)
  sidecar_proxy: ["service_mesh", "monitoring", "logging", "apm"], // Envoy/Linkerd sidecar
  
  // MEDIUM PRIORITY: Additional Observability
  rum: ["monitoring", "analytics_service", "apm"], // Frontend metrics → Backend
  synthetic_monitoring: ["monitoring", "notification", "logging"], // Automated checks → Alerts
  
  // MEDIUM PRIORITY: Modern API Patterns
  graphql_gateway: ["api_server", "microservice", "database_sql", "database_nosql", "cache_redis", "auth_service", "monitoring", "logging"], // GraphQL → Services
  grpc_server: ["database_sql", "database_nosql", "cache_redis", "microservice", "queue", "monitoring", "logging"], // gRPC services
  
  // LOW PRIORITY: Edge & Web3
  wasm_runtime: ["api_server", "database_sql", "cache_redis", "object_storage", "cdn", "monitoring"], // Edge compute
  blockchain_node: ["external_api", "queue", "database_sql", "monitoring", "logging"], // Blockchain integration
  
  // PRIORITY 2: Serverless Functions
  lambda_function: ["database_sql", "database_nosql", "object_storage", "queue", "message_broker", "external_api", "secret_manager", "monitoring", "logging", "apm"],
  cloud_function: ["database_sql", "database_nosql", "object_storage", "queue", "message_broker", "external_api", "secret_manager", "monitoring", "logging", "apm"],
  azure_function: ["database_sql", "database_nosql", "object_storage", "queue", "message_broker", "external_api", "secret_manager", "monitoring", "logging", "apm"],
  
  // PRIORITY 2: AI/ML Model Serving
  sagemaker_endpoint: ["object_storage", "database_sql", "cache_redis", "monitoring", "logging", "apm"], // Model artifacts from S3, predictions to DB
  vertex_ai_endpoint: ["object_storage", "database_sql", "cache_redis", "monitoring", "logging", "apm"], // Same pattern
  azure_ml_endpoint: ["object_storage", "database_sql", "cache_redis", "monitoring", "logging", "apm"], // Same pattern
  
  // PRIORITY 2: Kubernetes Components
  k8s_pod: ["database_sql", "database_nosql", "cache_redis", "queue", "message_broker", "object_storage", "monitoring", "logging", "apm", "k8s_service"], // Pods connect to services
  k8s_service: ["k8s_pod", "load_balancer", "monitoring"], // Services route to pods
  k8s_ingress: ["k8s_service", "load_balancer", "monitoring", "logging"], // Ingress routes to services
  
  // PRIORITY 2: Multi-cloud Equivalents
  azure_app_service: ["database_sql", "database_nosql", "azure_cosmos_db", "cache_redis", "queue", "azure_service_bus", "object_storage", "monitoring", "logging", "apm"],
  gcp_app_engine: ["database_sql", "database_nosql", "gcp_firestore", "cache_redis", "queue", "gcp_pub_sub", "object_storage", "monitoring", "logging", "apm"],
  azure_cosmos_db: ["monitoring", "logging", "apm"],
  gcp_firestore: ["monitoring", "logging", "apm"],
  azure_service_bus: ["worker", "microservice", "lambda_function", "azure_function", "monitoring", "logging"],
  gcp_pub_sub: ["worker", "microservice", "lambda_function", "cloud_function", "monitoring", "logging"],
};

// Get node type definition
export const getNodeTypeDefinition = (
  type: string
): NodeTypeDefinition | undefined => {
  return NODE_TYPES.find((nt) => nt.type === type);
};

// Validate connection
export const isValidConnection = (
  sourceType: string,
  targetType: string,
  sourceConfig?: NodeConfig // SRE FIX: Pass config for CDC validation
): boolean => {
  // CRITICAL FIX: Allow all legacy nodes (missing nodeType) to connect
  // This solves the "Background Worker cannot connect to Search Service" issue
  // if the nodes were created in an older version of the schema.
  if (!sourceType || sourceType === "unknown" || !targetType || targetType === "unknown") {
    return true;
  }

  // SRE PRODUCTION FIX: Special validation for database → queue/broker connections
  // Only allow if CDC (Change Data Capture) is enabled
  if ((sourceType === "database_sql" || sourceType === "database_nosql") && 
      (targetType === "queue" || targetType === "message_broker")) {
    // Allow if CDC is explicitly enabled, otherwise warn/block
    if (sourceConfig?.cdcEnabled === true) {
      return true;
    }
    // For now, allow but should show warning in UI
    return true; // TODO: Add UI warning for non-CDC DB→Queue connections
  }

  // Explicit overrides for SRE patterns
  if (sourceType === "worker" && targetType === "search") return true;
  if (sourceType === "worker" && targetType === "analytics_service") return true;
  if (sourceType === "worker" && targetType === "nat_gateway") return true;
  if (sourceType === "worker" && targetType === "secret_manager") return true;
  if (sourceType === "api_server" && targetType === "secret_manager") return true;
  if (sourceType === "microservice" && targetType === "secret_manager") return true;

  const allowedTargets = CONNECTION_RULES[sourceType];
  return allowedTargets ? allowedTargets.includes(targetType) : false;
};
