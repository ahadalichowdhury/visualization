import { describe, it, expect } from "vitest";
import { isValidConnection, NODE_TYPES, CONNECTION_RULES } from "./builder.types";
import type { NodeConfig } from "./builder.types";

describe("SRE Production Fixes - Connection Validation Tests", () => {
  describe("Critical Fix #1: Monitoring Direction", () => {
    it("should allow api_server → monitoring (apps PUSH metrics)", () => {
      expect(isValidConnection("api_server", "monitoring")).toBe(true);
    });

    it("should allow microservice → monitoring (apps PUSH metrics)", () => {
      expect(isValidConnection("microservice", "monitoring")).toBe(true);
    });

    it("should allow worker → monitoring (apps PUSH metrics)", () => {
      expect(isValidConnection("worker", "monitoring")).toBe(true);
    });

    it("should NOT allow monitoring → api_server (wrong direction)", () => {
      expect(isValidConnection("monitoring", "api_server")).toBe(false);
    });

    it("should NOT allow monitoring → microservice (wrong direction)", () => {
      expect(isValidConnection("monitoring", "microservice")).toBe(false);
    });

    it("should allow monitoring → database_timeseries (storage)", () => {
      expect(isValidConnection("monitoring", "database_timeseries")).toBe(true);
    });

    it("should allow monitoring → notification (alerting)", () => {
      expect(isValidConnection("monitoring", "notification")).toBe(true);
    });
  });

  describe("Critical Fix #2: Cache Connection Pattern", () => {
    it("should allow cache_redis → monitoring (push metrics)", () => {
      expect(isValidConnection("cache_redis", "monitoring")).toBe(true);
    });

    it("should NOT allow cache_redis → database_sql (wrong direction)", () => {
      expect(isValidConnection("cache_redis", "database_sql")).toBe(false);
    });

    it("should NOT allow cache_redis → database_nosql (wrong direction)", () => {
      expect(isValidConnection("cache_redis", "database_nosql")).toBe(false);
    });

    it("should NOT allow cache_memcached → database_sql (wrong direction)", () => {
      expect(isValidConnection("cache_memcached", "database_sql")).toBe(false);
    });

    it("should allow api_server → cache_redis (cache-aside pattern)", () => {
      expect(isValidConnection("api_server", "cache_redis")).toBe(true);
    });

    it("should allow api_server → database_sql (cache-aside pattern)", () => {
      expect(isValidConnection("api_server", "database_sql")).toBe(true);
    });
  });

  describe("Critical Fix #3: Secret Manager Connections", () => {
    it("should allow api_server → secret_manager (fetch secrets)", () => {
      expect(isValidConnection("api_server", "secret_manager")).toBe(true);
    });

    it("should allow microservice → secret_manager (fetch secrets)", () => {
      expect(isValidConnection("microservice", "secret_manager")).toBe(true);
    });

    it("should allow worker → secret_manager (fetch secrets)", () => {
      expect(isValidConnection("worker", "secret_manager")).toBe(true);
    });

    it("should allow auth_service → secret_manager (fetch secrets)", () => {
      expect(isValidConnection("auth_service", "secret_manager")).toBe(true);
    });

    it("should allow payment_gateway → secret_manager (fetch API keys)", () => {
      expect(isValidConnection("payment_gateway", "secret_manager")).toBe(true);
    });

    it("should allow secret_manager → monitoring (audit logs)", () => {
      expect(isValidConnection("secret_manager", "monitoring")).toBe(true);
    });
  });

  describe("Critical Fix #4: CDC Flag Support", () => {
    it("should allow database_sql → queue with CDC enabled", () => {
      const config: NodeConfig = { cdcEnabled: true };
      expect(isValidConnection("database_sql", "queue", config)).toBe(true);
    });

    it("should allow database_nosql → queue with CDC enabled", () => {
      const config: NodeConfig = { cdcEnabled: true };
      expect(isValidConnection("database_nosql", "queue", config)).toBe(true);
    });

    it("should allow database_sql → message_broker with CDC enabled", () => {
      const config: NodeConfig = { cdcEnabled: true };
      expect(isValidConnection("database_sql", "message_broker", config)).toBe(true);
    });

    // Note: Currently allows without CDC flag (should show UI warning)
    it("should allow database_sql → queue without CDC flag (for now)", () => {
      const config: NodeConfig = { cdcEnabled: false };
      expect(isValidConnection("database_sql", "queue", config)).toBe(true);
    });

    it("should allow database_sql → queue with no config (for now)", () => {
      expect(isValidConnection("database_sql", "queue")).toBe(true);
    });
  });

  describe("Critical Fix #5: Logging → Monitoring", () => {
    it("should allow logging → monitoring (trigger alerts)", () => {
      expect(isValidConnection("logging", "monitoring")).toBe(true);
    });

    it("should allow logging → object_storage (log storage)", () => {
      expect(isValidConnection("logging", "object_storage")).toBe(true);
    });

    it("should allow logging → search (log indexing)", () => {
      expect(isValidConnection("logging", "search")).toBe(true);
    });
  });

  describe("New Component #1: APM / Distributed Tracing", () => {
    it("should have APM component in NODE_TYPES", () => {
      const apmComponent = NODE_TYPES.find((node) => node.type === "apm");
      expect(apmComponent).toBeDefined();
      expect(apmComponent?.label).toBe("APM / Tracing");
      expect(apmComponent?.category).toBe("other");
    });

    it("should allow api_server → apm (send traces)", () => {
      expect(isValidConnection("api_server", "apm")).toBe(true);
    });

    it("should allow microservice → apm (send traces)", () => {
      expect(isValidConnection("microservice", "apm")).toBe(true);
    });

    it("should allow worker → apm (background job tracing)", () => {
      expect(isValidConnection("worker", "apm")).toBe(true);
    });

    it("should allow apm → monitoring (send metrics)", () => {
      expect(isValidConnection("apm", "monitoring")).toBe(true);
    });

    it("should allow apm → logging (send logs)", () => {
      expect(isValidConnection("apm", "logging")).toBe(true);
    });

    it("should allow apm → database_timeseries (store traces)", () => {
      expect(isValidConnection("apm", "database_timeseries")).toBe(true);
    });
  });

  describe("New Component #2: Sidecar Proxy (Service Mesh)", () => {
    it("should have sidecar_proxy component in NODE_TYPES", () => {
      const sidecarComponent = NODE_TYPES.find((node) => node.type === "sidecar_proxy");
      expect(sidecarComponent).toBeDefined();
      expect(sidecarComponent?.label).toBe("Sidecar Proxy");
      expect(sidecarComponent?.category).toBe("network");
    });

    it("should allow microservice → sidecar_proxy (attach sidecar)", () => {
      expect(isValidConnection("microservice", "sidecar_proxy")).toBe(true);
    });

    it("should allow sidecar_proxy → service_mesh (connect to mesh)", () => {
      expect(isValidConnection("sidecar_proxy", "service_mesh")).toBe(true);
    });

    it("should allow sidecar_proxy → monitoring (push metrics)", () => {
      expect(isValidConnection("sidecar_proxy", "monitoring")).toBe(true);
    });

    it("should allow sidecar_proxy → logging (push logs)", () => {
      expect(isValidConnection("sidecar_proxy", "logging")).toBe(true);
    });

    it("should allow sidecar_proxy → apm (distributed tracing)", () => {
      expect(isValidConnection("sidecar_proxy", "apm")).toBe(true);
    });

    it("should allow service_mesh → sidecar_proxy (control plane)", () => {
      expect(isValidConnection("service_mesh", "sidecar_proxy")).toBe(true);
    });
  });

  describe("Updated Connection Rules", () => {
    it("should have updated auth_service connections", () => {
      const authConnections = CONNECTION_RULES["auth_service"];
      expect(authConnections).toContain("monitoring");
      expect(authConnections).toContain("secret_manager");
    });

    it("should have updated payment_gateway connections", () => {
      const paymentConnections = CONNECTION_RULES["payment_gateway"];
      expect(paymentConnections).toContain("secret_manager");
    });

    it("should have updated service_mesh connections", () => {
      const meshConnections = CONNECTION_RULES["service_mesh"];
      expect(meshConnections).toContain("sidecar_proxy");
    });
  });

  describe("Backwards Compatibility", () => {
    it("should allow legacy nodes with undefined type", () => {
      expect(isValidConnection("", "database_sql")).toBe(true);
      expect(isValidConnection("unknown", "database_sql")).toBe(true);
    });

    it("should allow legacy target nodes with undefined type", () => {
      expect(isValidConnection("api_server", "")).toBe(true);
      expect(isValidConnection("api_server", "unknown")).toBe(true);
    });
  });

  describe("Real-World SRE Patterns", () => {
    it("should allow worker → search (indexing jobs)", () => {
      expect(isValidConnection("worker", "search")).toBe(true);
    });

    it("should allow worker → analytics_service (data processing)", () => {
      expect(isValidConnection("worker", "analytics_service")).toBe(true);
    });

    it("should allow worker → api_server (webhooks)", () => {
      expect(isValidConnection("worker", "api_server")).toBe(true);
    });

    it("should allow database_nosql → search (indexing)", () => {
      expect(isValidConnection("database_nosql", "search")).toBe(true);
    });

    it("should allow load_balancer → api_gateway (chained LBs)", () => {
      expect(isValidConnection("load_balancer", "api_gateway")).toBe(true);
    });
  });

  describe("Component Categories", () => {
    it("should have correct component categories", () => {
      const apm = NODE_TYPES.find((n) => n.type === "apm");
      const sidecar = NODE_TYPES.find((n) => n.type === "sidecar_proxy");
      const apiServer = NODE_TYPES.find((n) => n.type === "api_server");
      const redis = NODE_TYPES.find((n) => n.type === "cache_redis");

      expect(apm?.category).toBe("other");
      expect(sidecar?.category).toBe("network");
      expect(apiServer?.category).toBe("compute");
      expect(redis?.category).toBe("storage");
    });
  });
});
