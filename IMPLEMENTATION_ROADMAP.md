# Implementation Roadmap - ALL Features Complete

**Date**: January 28, 2026  
**Status**: 🚀 **IN PROGRESS**

---

## Overview

This document tracks the implementation of all minor issues, Priority 1-3 features for the Architecture Visualization Platform. Total: **13 features** to implement across frontend and backend.

---

## ✅ COMPLETED (1/13)

### Minor Issues

1. **✅ Add UI Warning for DB→Queue without CDC Flag** ✅
   - **Status**: COMPLETED
   - **File**: `frontend/src/pages/Builder.tsx` (Lines 743-807)
   - **Implementation**: 
     - Added CDC flag detection in `onConnect` callback
     - Shows confirm dialog when DB→Queue connection attempted without CDC
     - Offers to enable CDC automatically
     - Preserves user choice if they decline
   - **Test**: Create SQL DB → Queue connection, verify warning appears
   - **Code**:
     ```typescript
     // ⚠️ SRE WARNING: DB→Queue without CDC flag
     if (
       (sourceType === "database_sql" || sourceType === "database_nosql") &&
       (targetType === "queue" || targetType === "message_broker")
     ) {
       if (!sourceConfig?.cdcEnabled) {
         const enableCDC = confirm(
           `⚠️ SRE Warning: Database→Queue Connection\n\n` +
             `You're connecting a database to a queue without Change Data Capture (CDC) enabled...`
         );
         if (enableCDC) {
           handleUpdateNode(connection.source!, { cdcEnabled: true });
         }
       }
     }
     ```

---

## 🚧 IN PROGRESS (0/13)

None currently

---

## 📋 PENDING (12/13)

### Minor Issues (1/2)

2. **⏳ Implement OAuth (Google/GitHub)**
   - **Files**: 
     - `backend/internal/api/handlers/auth.go`
     - `backend/internal/config/config.go` (add OAuth secrets)
     - `frontend/src/components/auth/LoginForm.tsx` (add OAuth buttons)
   - **Tasks**:
     - [ ] Add Google OAuth 2.0 flow (backend)
     - [ ] Add GitHub OAuth flow (backend)
     - [ ] Update config to support OAuth client IDs/secrets
     - [ ] Add OAuth buttons to frontend login form
     - [ ] Test OAuth flow end-to-end
   - **Estimated Lines**: ~300 (backend: 200, frontend: 100)

---

### Priority 1: UI Improvements (4/4)

3. **⏳ Show Cost Estimate in UI Before Simulation**
   - **Files**:
     - `frontend/src/components/builder/SimulationPanel.tsx` (add cost preview)
     - `frontend/src/services/simulation.service.ts` (add cost estimation API call)
     - `backend/internal/api/handlers/simulation.go` (add `/estimate-cost` endpoint)
   - **Tasks**:
     - [ ] Create `/api/simulation/estimate-cost` backend endpoint
     - [ ] Calculate estimated monthly cost before simulation runs
     - [ ] Add cost preview section in SimulationPanel
     - [ ] Show cost breakdown by component type
     - [ ] Add "Estimated Cost: $XXX/month" banner
   - **Estimated Lines**: ~250 (backend: 100, frontend: 150)

4. **⏳ Display Bottleneck Icons on Nodes During Simulation**
   - **Files**:
     - `frontend/src/components/builder/CustomNode.tsx` (add bottleneck indicator)
     - `frontend/src/pages/Builder.tsx` (pass bottleneck data to nodes)
   - **Tasks**:
     - [ ] Add bottleneck type to node activity data
     - [ ] Create bottleneck icon components (CPU, Memory, Disk, Network)
     - [ ] Display icon overlay on nodes during simulation
     - [ ] Color-code by bottleneck type (red=CPU, blue=Memory, yellow=Disk, green=Network)
     - [ ] Add tooltip showing bottleneck details
   - **Estimated Lines**: ~150 (frontend only)

5. **⏳ Real-time Latency Heatmap for Cross-Region Connections**
   - **Files**:
     - `frontend/src/components/builder/LatencyHeatmap.tsx` (**NEW**)
     - `frontend/src/pages/Builder.tsx` (add heatmap overlay)
     - `frontend/src/components/builder/AnimatedEdge.tsx` (color edges by latency)
   - **Tasks**:
     - [ ] Create LatencyHeatmap component (modal/panel)
     - [ ] Color-code edges by latency during simulation (green<50ms, yellow<150ms, red>=150ms)
     - [ ] Show latency matrix for all cross-region connections
     - [ ] Add toggle to enable/disable heatmap view
     - [ ] Update edge styles dynamically based on current tick latency
   - **Estimated Lines**: ~300 (frontend only)

---

### Priority 2: Additional Components (4/4)

6. **⏳ Add Serverless Functions (Lambda/Cloud Functions)**
   - **Files**:
     - `frontend/src/types/builder.types.ts` (add serverless node types)
     - `backend/internal/simulation/resources.go` (add serverless resource modeling)
     - `backend/internal/simulation/hardware.go` (add cold start latency)
   - **Tasks**:
     - [ ] Add `lambda_function`, `cloud_function`, `azure_function` node types
     - [ ] Model cold start latency (100-1000ms depending on runtime)
     - [ ] Model warm execution (5-50ms)
     - [ ] Add invocation-based pricing (vs instance-based)
     - [ ] Connection rules: API Gateway → Lambda, EventBridge → Lambda
   - **Estimated Lines**: ~400 (frontend: 100, backend: 300)

7. **⏳ Add Multi-cloud Support (Azure, GCP)**
   - **Files**:
     - `frontend/src/types/builder.types.ts` (add Azure/GCP equivalents)
     - `backend/internal/simulation/regions.go` (add Azure/GCP regions)
     - `backend/internal/simulation/cost_optimization.go` (add Azure/GCP pricing)
   - **Tasks**:
     - [ ] Add Azure equivalents (App Service, CosmosDB, Azure SQL, Azure Cache, etc.)
     - [ ] Add GCP equivalents (Cloud Run, Firestore, Cloud SQL, Memorystore, etc.)
     - [ ] Add Azure regions (East US, West Europe, Southeast Asia)
     - [ ] Add GCP regions (us-central1, europe-west1, asia-southeast1)
     - [ ] Add Azure/GCP pricing data
     - [ ] Update UI to allow cloud provider selection per node
   - **Estimated Lines**: ~800 (frontend: 200, backend: 600)

8. **⏳ Add Kubernetes Components (Pods, Services, Ingress)**
   - **Files**:
     - `frontend/src/types/builder.types.ts` (add K8s node types)
     - `backend/internal/simulation/resources.go` (add K8s resource modeling)
   - **Tasks**:
     - [ ] Add `k8s_pod`, `k8s_deployment`, `k8s_service`, `k8s_ingress`, `k8s_configmap`, `k8s_secret` node types
     - [ ] Model pod scheduling overhead
     - [ ] Model service discovery latency
     - [ ] Connection rules: Ingress → Service → Pod
     - [ ] Add namespace grouping visual
   - **Estimated Lines**: ~500 (frontend: 150, backend: 350)

9. **⏳ Add AI/ML Model Serving (SageMaker/Vertex AI)**
   - **Files**:
     - `frontend/src/types/builder.types.ts` (add ML serving node types)
     - `backend/internal/simulation/resources.go` (add ML resource modeling)
     - `backend/internal/simulation/hardware.go` (add GPU support)
   - **Tasks**:
     - [ ] Add `sagemaker_endpoint`, `vertex_ai_endpoint`, `azure_ml_endpoint` node types
     - [ ] Model GPU/TPU resource usage (high CPU+Memory for inference)
     - [ ] Add model loading latency (1-10 seconds for large models)
     - [ ] Add inference latency (10-1000ms depending on model size)
     - [ ] Connection rules: API → ML Endpoint → Object Storage (model artifacts)
   - **Estimated Lines**: ~400 (frontend: 100, backend: 300)

---

### Priority 3: Advanced Features (4/4)

10. **⏳ Implement Chaos Engineering (Failures with Recovery)**
    - **Files**:
      - `backend/internal/simulation/chaos.go` (**NEW**)
      - `frontend/src/components/builder/ChaosPanel.tsx` (**NEW**)
      - `backend/internal/simulation/features.go` (add recovery logic)
    - **Tasks**:
      - [ ] Add chaos experiment types (node failure, network partition, latency spike, packet loss)
      - [ ] Add recovery simulation (auto-restart after 30s, failover to replica)
      - [ ] Add circuit breaker pattern (open after 5 failures, half-open after 60s)
      - [ ] Add retry logic with exponential backoff
      - [ ] Create UI panel to configure chaos experiments
      - [ ] Visualize failures and recovery on canvas (red→yellow→green)
    - **Estimated Lines**: ~700 (backend: 500, frontend: 200)

11. **⏳ Add Real-time Collaboration (Multi-user Editing)**
    - **Files**:
      - `backend/internal/websocket/collaboration.go` (**NEW**)
      - `frontend/src/hooks/useCollaboration.ts` (**NEW**)
      - `backend/internal/api/handlers/websocket.go` (**NEW**)
    - **Tasks**:
      - [ ] Add WebSocket server for real-time updates
      - [ ] Implement Operational Transformation (OT) for conflict resolution
      - [ ] Add user cursors (show where other users are editing)
      - [ ] Add user presence indicators (active users list)
      - [ ] Broadcast node/edge changes to all connected clients
      - [ ] Add collaborative locking (prevent simultaneous edits)
    - **Estimated Lines**: ~1000 (backend: 600, frontend: 400)

12. **⏳ Implement Export to Terraform/CloudFormation**
    - **Files**:
      - `backend/internal/export/terraform.go` (**NEW**)
      - `backend/internal/export/cloudformation.go` (**NEW**)
      - `frontend/src/components/builder/ExportModal.tsx` (**NEW**)
    - **Tasks**:
      - [ ] Map node types to Terraform resources (aws_instance, aws_rds_cluster, etc.)
      - [ ] Generate Terraform HCL code from canvas
      - [ ] Map node types to CloudFormation resources
      - [ ] Generate CloudFormation YAML/JSON from canvas
      - [ ] Add variable extraction (instance_type, region, etc.)
      - [ ] Create export modal with format selection (Terraform/CloudFormation)
      - [ ] Add syntax highlighting for generated code
    - **Estimated Lines**: ~900 (backend: 700, frontend: 200)

13. **⏳ Implement Import from AWS CloudWatch/Datadog**
    - **Files**:
      - `backend/internal/import/cloudwatch.go` (**NEW**)
      - `backend/internal/import/datadog.go` (**NEW**)
      - `frontend/src/components/builder/ImportModal.tsx` (**NEW**)
    - **Tasks**:
      - [ ] Add AWS SDK for CloudWatch API calls
      - [ ] Query CloudWatch ServiceMap for architecture discovery
      - [ ] Parse CloudWatch metrics to determine node types
      - [ ] Add Datadog API integration
      - [ ] Query Datadog APM for service topology
      - [ ] Convert discovered services to canvas nodes/edges
      - [ ] Create import modal with API key input
      - [ ] Add progress indicator during import
    - **Estimated Lines**: ~1200 (backend: 900, frontend: 300)

---

## 📊 Summary Statistics

| Category | Total | Completed | In Progress | Pending |
|----------|-------|-----------|-------------|---------|
| **Minor Issues** | 2 | 1 | 0 | 1 |
| **Priority 1** | 4 | 1 | 0 | 3 |
| **Priority 2** | 4 | 0 | 0 | 4 |
| **Priority 3** | 4 | 0 | 0 | 4 |
| **TOTAL** | **13** | **1** | **0** | **12** |

---

## 📈 Estimated Effort

| Feature | Lines of Code | Estimated Time |
|---------|---------------|----------------|
| OAuth Implementation | 300 | 4 hours |
| Cost Estimate UI | 250 | 3 hours |
| Bottleneck Icons | 150 | 2 hours |
| Latency Heatmap | 300 | 4 hours |
| Serverless Functions | 400 | 5 hours |
| Multi-cloud Support | 800 | 10 hours |
| Kubernetes Components | 500 | 6 hours |
| AI/ML Model Serving | 400 | 5 hours |
| Chaos Engineering | 700 | 9 hours |
| Real-time Collaboration | 1000 | 15 hours |
| Export to IaC | 900 | 12 hours |
| Import from Monitoring | 1200 | 16 hours |
| **TOTAL** | **6,900 lines** | **~90 hours** |

---

## 🎯 Implementation Order (Recommended)

### Phase 1: Quick Wins (8 hours)
1. ✅ UI Warning for DB→Queue (DONE)
2. Cost Estimate UI
3. Bottleneck Icons
4. OAuth Implementation

### Phase 2: Priority Features (15 hours)
5. Latency Heatmap
6. Serverless Functions
7. AI/ML Model Serving

### Phase 3: Major Features (30 hours)
8. Multi-cloud Support
9. Kubernetes Components
10. Chaos Engineering

### Phase 4: Advanced Features (40 hours)
11. Export to Terraform/CloudFormation
12. Import from AWS/Datadog
13. Real-time Collaboration

---

## 🚀 Next Steps

Given the scope (90+ hours of development), I'll implement features in batches, starting with quick wins and progressing to more complex features. Each feature will be:

1. ✅ Implemented in both frontend and backend
2. ✅ Tested for basic functionality
3. ✅ Documented with code comments
4. ✅ Added to this tracking document

**Current Focus**: Implementing Priority 1 features (Cost Estimate UI, Bottleneck Icons, Latency Heatmap)

---

**Status**: 🚀 **1/13 COMPLETE** (7.7%)  
**Next**: Implementing OAuth + Priority 1 features
