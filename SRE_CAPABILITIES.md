# 🛡️ SRE / Professional System Design Capabilities

This platform has been upgraded to support industry-standard cloud architecture patterns. Below is a guide to the advanced "Pro" features available for System Architects and Site Reliability Engineers (SREs).

---

## 🔒 1. Network Isolation (Subnets & VPCs)
**Feature:** New `Private Subnet` Component
- **Icon**: 🔒
- **Category**: Network
- **Use Case**: Visually group internal components that should not be accessible from the public internet.
- **How to use**: 
  1. Drag a "Private Subnet" node onto the canvas.
  2. Resize it (if applicable) or place it behind your internal services.
  3. Place sensitive components (Databases, Workers, Internal APIs) "inside" or near it.
- **SRE Benefit**: Clearly defines security boundaries (DMZ vs. Private).

---

## ⚖️ 2. Internal vs. External Load Balancing
**Feature:** `Access Type` Configuration for Load Balancers
- **Option 1: External** (Internet-Facing)
  - Standard ALB/NLB receiving traffic from Clients/CDN.
- **Option 2: Internal** (Private)
  - Used for routing traffic *inside* your VPC (e.g., Microservice → Internal LB → Database/Service).
- **How to use**: Select a Load Balancer and change "Access Type" in the config panel.
- **SRE Benefit**: Distinguishes between public ingress and internal traffic shaping.

---

## 📡 3. Observability Symmetry (Push & Pull)
**Feature:** Bi-directional Monitoring Connections
- **Pull Model (Prometheus-style)**: 
  - Connect `Monitoring` ➔ `Microservice` / `API Server`
  - Represents the monitoring system "scraping" metrics endpoint.
- **Push Model (Datadog/StatsD-style)**:
  - Connect `Microservice` / `Worker` ➔ `Monitoring`
  - Represents the application "pushing" metrics to a collector.
- **SRE Benefit**: Models the actual data flow of your observability stack.

---

## 🔗 4. Advanced Connectivity Patterns
The validation engine now supports complex, real-world connection flows:

| Source | Target | Pattern | Real-World Use Case |
|--------|--------|---------|---------------------|
| `CDN` | `Logging` | **Edge Logging** | Streaming WAF/Access logs to analysis tools. |
| `CDN` | `Load Balancer`| **Dynamic Acceleration** | CloudFront sitting in front of an ALB. |
| `Load Balancer` | `Load Balancer` | **Multi-Tier LB** | External Layer 7 LB routing to Internal Layer 4 LB. |
| `Worker` | `Worker` | **Coordination** | Leader election or P2P mesh logic. |
| `Database` | `Queue` | **CDC** | Change Data Capture (database triggers event). |
| `Worker` | `Redis` | **Locking** | Using Redis for distributed locks/state. |

---

## 🚀 Summary
Your tool now supports the **"Request Life Cycle"** of a modern production system:
1. **Ingress**: Client ➔ CDN ➔ External LB
2. **Routing**: External LB ➔ API Gateway ➔ Internal Services
3. **Security**: Services grouped in Subnets
4. **Processing**: Workers coordinating via Queues & Redis
5. **Persistence**: CDC events flowing from DBs to Queues
6. **Observability**: Metric pushing and scraping happening in parallel

*Documentation generated: 2026-01-27*
