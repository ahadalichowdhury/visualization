import { Node, Edge, MarkerType } from "reactflow";
import { NodeData } from "../types/builder.types";

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  category: "starter" | "advanced" | "pattern";
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: "3-tier-webapp",
    name: "Classic 3-Tier Web App",
    description: "Standard production architecture with Load Balancer, Web Servers, and Database.",
    category: "starter",
    nodes: [
      {
        id: "node-1",
        type: "custom",
        position: { x: 250, y: 50 },
        data: {
          label: "Internet Traffic",
          nodeType: "client",
          config: { region: "us-east" },
        },
      },
      {
        id: "node-2",
        type: "custom",
        position: { x: 250, y: 200 },
        data: {
          label: "Load Balancer",
          nodeType: "load_balancer",
          config: { lbType: "alb", region: "us-east" },
        },
      },
      {
        id: "node-3",
        type: "custom",
        position: { x: 250, y: 350 },
        data: {
          label: "Web Server Cluster",
          nodeType: "web_server",
          config: {
            instanceType: "t3.medium",
            replicas: 2,
            region: "us-east"
          },
        },
      },
      {
        id: "node-4",
        type: "custom",
        position: { x: 250, y: 500 },
        data: {
          label: "Primary Database",
          nodeType: "database_sql",
          config: {
            storageType: "gp3",
            storage_size_gb: 100,
            consistency: "strong",
            region: "us-east"
          },
        },
      },
    ],
    edges: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "edge-2",
        source: "node-2",
        target: "node-3",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "edge-3",
        source: "node-3",
        target: "node-4",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    id: "microservices-basic",
    name: "Microservices with Cache",
    description: "API Gateway routing to services with a Redis caching layer for performance.",
    category: "pattern",
    nodes: [
      {
        id: "ms-1",
        type: "custom",
        position: { x: 300, y: 50 },
        data: {
          label: "Users",
          nodeType: "client",
          config: {},
        },
      },
      {
        id: "ms-2",
        type: "custom",
        position: { x: 300, y: 200 },
        data: {
          label: "API Gateway",
          nodeType: "api_gateway",
          config: { region: "us-east" },
        },
      },
      {
        id: "ms-3",
        type: "custom",
        position: { x: 100, y: 350 },
        data: {
          label: "Auth Service",
          nodeType: "auth_service",
          config: { instanceType: "c5.large", region: "us-east" },
        },
      },
      {
        id: "ms-4",
        type: "custom",
        position: { x: 500, y: 350 },
        data: {
          label: "Product Service",
          nodeType: "microservice",
          config: { instanceType: "m5.large", region: "us-east" },
        },
      },
      {
        id: "ms-5",
        type: "custom",
        position: { x: 500, y: 500 },
        data: {
          label: "Redis Cache",
          nodeType: "cache_redis",
          config: { ttl_ms: 3600, region: "us-east" },
        },
      },
      {
        id: "ms-6",
        type: "custom",
        position: { x: 300, y: 650 },
        data: {
          label: "Core Database",
          nodeType: "database_sql",
          config: { storageType: "io2", storage_size_gb: 500, region: "us-east" },
        },
      },
    ],
    edges: [
      {
        id: "e-ms-1",
        source: "ms-1",
        target: "ms-2",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-ms-2",
        source: "ms-2",
        target: "ms-3",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-ms-3",
        source: "ms-2",
        target: "ms-4",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-ms-4",
        source: "ms-4",
        target: "ms-5",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-ms-5",
        source: "ms-3",
        target: "ms-6",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-ms-6",
        source: "ms-5",
        target: "ms-6",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    id: "async-processing",
    name: "Async Job Queue Pattern",
    description: "Decoupled architecture using Message Queues and Workers for heavy processing.",
    category: "advanced",
    nodes: [
      {
        id: "aq-1",
        type: "custom",
        position: { x: 100, y: 100 },
        data: {
          label: "API Server",
          nodeType: "api_server",
          config: { region: "us-east" },
        },
      },
      {
        id: "aq-2",
        type: "custom",
        position: { x: 350, y: 100 },
        data: {
          label: "SQS Queue",
          nodeType: "queue",
          config: { queueType: "sqs-standard", region: "us-east" },
        },
      },
      {
        id: "aq-3",
        type: "custom",
        position: { x: 600, y: 100 },
        data: {
          label: "Worker Fleet",
          nodeType: "worker",
          config: { replicas: 3, instanceType: "c5.xlarge", region: "us-east" },
        },
      },
      {
        id: "aq-4",
        type: "custom",
        position: { x: 600, y: 250 },
        data: {
          label: "S3 Storage",
          nodeType: "object_storage",
          config: { objectStorageType: "s3-standard", region: "us-east" },
        },
      },
      {
        id: "aq-5",
        type: "custom",
        position: { x: 350, y: 250 },
        data: {
          label: "Notification Svc",
          nodeType: "notification",
          config: { region: "us-east" },
        },
      },
    ],
    edges: [
      {
        id: "e-aq-1",
        source: "aq-1",
        target: "aq-2",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-aq-2",
        source: "aq-2",
        target: "aq-3",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-aq-3",
        source: "aq-3",
        target: "aq-4",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
      {
        id: "e-aq-4",
        source: "aq-3",
        target: "aq-5",
        type: "animated",
        markerEnd: { type: MarkerType.ArrowClosed },
      },
    ],
  },
  {
    id: "global-banking",
    name: "Global Banking System (Enterprise)",
    description: "Full SRE-validated architecture complying with PCI-DSS. Features WAF, Secrets Management, Analytics Pipeline, and CI/CD.",
    category: "advanced",
    nodes: [
      // 1. INGRESS & SECURITY
      { id: "g-dns", type: "custom", position: { x: 400, y: 50 }, data: { label: "Route 53 (DNS)", nodeType: "dns", config: { region: "global" } } },
      { id: "g-waf", type: "custom", position: { x: 400, y: 150 }, data: { label: "WAF Shield", nodeType: "waf", config: { region: "us-east" } } },
      { id: "g-cdn", type: "custom", position: { x: 400, y: 250 }, data: { label: "CloudFront", nodeType: "cdn", config: { cdnType: "cloudfront-premium" } } },
      { id: "g-alb", type: "custom", position: { x: 400, y: 350 }, data: { label: "Public ALB", nodeType: "load_balancer", config: { lbType: "alb", accessType: "external" } } },

      // 2. CORE SERVICES (Private Subnet)
      { id: "g-api", type: "custom", position: { x: 400, y: 500 }, data: { label: "Banking API Gateway", nodeType: "api_gateway", config: { apiGatewayType: "rest" } } },
      { id: "g-auth", type: "custom", position: { x: 200, y: 650 }, data: { label: "Auth Service", nodeType: "auth_service", config: { instanceType: "c5.large" } } },
      { id: "g-core", type: "custom", position: { x: 400, y: 650 }, data: { label: "Core Ledger Svc", nodeType: "microservice", config: { instanceType: "m5.2xlarge" } } },
      { id: "g-fraud", type: "custom", position: { x: 600, y: 650 }, data: { label: "Fraud Detector", nodeType: "ml_model", config: { instanceType: "p3.2xlarge" } } },

      // 3. SECURITY & EXT. INTEGRATION
      { id: "g-vault", type: "custom", position: { x: 50, y: 650 }, data: { label: "Vault (Secrets)", nodeType: "secret_manager", config: {} } },
      { id: "g-nat", type: "custom", position: { x: 800, y: 650 }, data: { label: "NAT Gateway", nodeType: "nat_gateway", config: {} } },
      { id: "g-stripe", type: "custom", position: { x: 950, y: 650 }, data: { label: "Stripe API", nodeType: "external_api", config: {} } },

      // 4. DATA & PERSISTENCE
      { id: "g-sql", type: "custom", position: { x: 400, y: 800 }, data: { label: "Ledger DB (Multi-AZ)", nodeType: "database_sql", config: { storageType: "io2", storage_size_gb: 1000, consistency: "strong" } } },
      { id: "g-redis", type: "custom", position: { x: 200, y: 800 }, data: { label: "Balance Cache", nodeType: "cache_redis", config: { cacheEngine: "redis" } } },

      // 5. ASYNC & ANALYTICS PIPELINE
      { id: "g-stream", type: "custom", position: { x: 400, y: 950 }, data: { label: "Transaction Stream", nodeType: "stream_processing", config: {} } },
      { id: "g-lake", type: "custom", position: { x: 400, y: 1100 }, data: { label: "Data Lake (S3)", nodeType: "data_lake", config: {} } },
      { id: "g-dw", type: "custom", position: { x: 600, y: 1100 }, data: { label: "Snowflake DW", nodeType: "data_warehouse", config: {} } },

      // 6. DEVOPS & CI/CD
      { id: "g-cicd", type: "custom", position: { x: -150, y: 500 }, data: { label: "GitHub Actions", nodeType: "cicd_pipeline", config: {} } },
      { id: "g-ecr", type: "custom", position: { x: 0, y: 500 }, data: { label: "Docker Registry", nodeType: "container_registry", config: {} } },
    ],
    edges: [
      // Traffic Flow
      { id: "e-g-1", source: "g-dns", target: "g-waf", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-2", source: "g-waf", target: "g-cdn", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-3", source: "g-cdn", target: "g-alb", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-4", source: "g-alb", target: "g-api", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-5", source: "g-api", target: "g-auth", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-6", source: "g-api", target: "g-core", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-7", source: "g-api", target: "g-fraud", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },

      // Data/Logic Flow
      { id: "e-g-8", source: "g-core", target: "g-sql", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-9", source: "g-core", target: "g-redis", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-10", source: "g-core", target: "g-nat", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-11", source: "g-nat", target: "g-stripe", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },

      // Analytics
      { id: "e-g-12", source: "g-sql", target: "g-stream", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } }, // CDC
      { id: "e-g-13", source: "g-stream", target: "g-lake", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-14", source: "g-lake", target: "g-dw", type: "animated", markerEnd: { type: MarkerType.ArrowClosed } },

      // Security Access (Logic Only)
      // Note: Secrets Manager usually doesn't have traffic flow, but we can visualize access

      // DevOps (Dashed)
      { id: "e-g-15", source: "g-cicd", target: "g-ecr", type: "animated", style: { strokeDasharray: '5,5', stroke: '#ea580c' }, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e-g-16", source: "g-ecr", target: "g-core", type: "animated", style: { strokeDasharray: '5,5', stroke: '#ea580c' }, markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
];
