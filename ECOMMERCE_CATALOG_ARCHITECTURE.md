# 🛒 System Architecture: Global E-Commerce Catalog (SRE Edition)

**Project Goal**: Design a high-scale, globally distributed product catalog capable of handling **50,000+ RPS** with <100ms latency.
**Pattern**: Event-Driven Microservices with Edge Acceleration.

---

### 🌐 Phase 1: Network & Edge Layer (The Entry Point)
*Security First: We start by defining our network boundaries and ingress points.*

#### 1. Global CDN (Edge Acceleration)
- **Component**: `CDN`
- **Label**: "Global Edge (CloudFront)"
- **Position**: Top, Center
- **Config**: 
  - Type: `cloudfront-premium`
  - Targets: Load Balancer (Origin), Object Storage (Assets), Logging Service
- **SRE Note**: Offloads 95% of static read traffic + SSL termination at the edge.

#### 2. Edge Logging (Compliance)
- **Component**: `Logging Service`
- **Label**: "WAF Access Logs"
- **Position**: Top Right (Next to CDN)
- **Connection**: `CDN` → `Logging Service`
- **SRE Note**: Streams real-time access logs for security analysis.

#### 3. Public Load Balancer (Ingress)
- **Component**: `Load Balancer`
- **Label**: "Public ALB (Ingress)"
- **Position**: Below CDN
- **Config**:
  - Region: `us-east`
  - LB Type: `alb`
  - Access Type: `external` **(New!)**
- **Connection**: `CDN` → `Public ALB`

---

### 🔒 Phase 2: Compute Layer (Private Subnet)
*Isolation: All compute resources create inside a secured private network.*

#### 4. Private Subnet (VPC Security Group)
- **Component**: `Private Subnet` **(New!)**
- **Label**: "Application VPC (Private)"
- **Position**: Middle Large Area (Draw this first effectively as a container)
- **Config**: Region `us-east`
- **Action**: Place the API Gateway, Services, and Workers **INSIDE** this box visually.

#### 5. API Gateway (Routing)
- **Component**: `API Gateway`
- **Label**: "Catalog API Gateway"
- **Position**: Top-center inside Subnet
- **Config**: Access Type `internal`
- **Connection**: `Public ALB` → `API Gateway`
- **SRE Note**: Handles auth, throttling, and routing to microservices.

#### 6. Microservices (The Logic)
- **Component**: `Microservice` (Create 3 instances)
  1. **Product Svc**: `t3.large`, 5 Replicas (Heavy Read)
  2. **Inventory Svc**: `t3.medium`, 3 Replicas (Strong Consistency)
  3. **Search Svc**: `t3.medium`, 3 Replicas
- **Position**: Middle row inside Subnet
- **Connection**: 
  - `API Gateway` → `Product Svc`
  - `API Gateway` → `Inventory Svc`
  - `API Gateway` → `Search Svc`

---

### 💾 Phase 3: Data & State Layer (Persistence)
*Polyglot Persistence: Different databases for different access patterns.*

#### 7. Distributed Cache (Hot Data)
- **Component**: `Redis Cache`
- **Label**: "Product Cache (Cluster)"
- **Position**: Right side inside Subnet
- **Config**: `cache.m5.large`, TTL `3600ms`
- **Connection**: `Product Svc` → `Redis Cache`
- **SRE Note**: Protects the DB from "Thundering Herd" on hot products.

#### 8. Primary Database (Source of Truth)
- **Component**: `SQL Database`
- **Label**: "Product DB (Primary)"
- **Position**: Bottom Center inside Subnet
- **Config**: 
  - Engine: `postgres`
  - Type: `db.m5.xlarge`
  - Storage: `gp3` (High IOPS)
- **Connection**: `Product Svc` → `Product DB`
- **Connection**: `Inventory Svc` → `Product DB`

---

### ⚡ Phase 4: Event-Driven Async Layer (CDC)
*Decoupling: Using CDC to sync Search Index without dual-writes.*

#### 9. Change Data Capture (CDC) Pipeline
- **Component**: `Message Queue`
- **Label**: "CDC Events (Kafka)"
- **Position**: Bottom Right
- **Config**: Type `kafka-standard`
- **Connection**: `Product DB` → `Message Queue` **(New! CDC Logic)**
- **SRE Note**: The simulation engine now ONLY sends **Write** traffic here.

#### 10. Indexing Worker
- **Component**: `Worker`
- **Label**: "Search Indexer"
- **Position**: Right of Queue
- **Connection**: `Message Queue` → `Worker`
- **Connection**: `Worker` → `Search Svc` (Updates index)

---

### 🔎 Phase 5: Observability Sidecars
*Telemetry: "If you can't measure it, you can't manage it."*

#### 11. Monitoring Stack
- **Component**: `Monitoring`
- **Label**: "Prometheus / Datadog"
- **Position**: Far Left (Outside critical path)
- **Connection**: 
  - `Product Svc` → `Monitoring` (Push Metrics) **(New!)**
  - `Inventory Svc` → `Monitoring`
- **SRE Note**: These connections use the new **Telemetry Sampling** logic (won't crash your dashboard).

---

### � Final Simulation Checklist
1. Click **"Run Simulation"**.
2. **Observe**:
   - Traffic flowing `Client` → `CDN` → `LB`.
   - **CDC Action**: See writes flowing `DB` → `Queue` (this line should be thinner/less active than the DB line).
   - **Telemetry**: See faint traffic going to `Monitoring`.
   - **Scaling**: Watch `Product Svc` scale up replicas as RPS increases.
   
You have now built a **production-grade** architecture.
