import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  MarkerType,
  MiniMap,
  NodeTypes,
  Node as ReactFlowNode,
  SelectionMode,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import { AuthModal } from "../components/auth/AuthModal";
import { AnimatedEdge } from "../components/builder/AnimatedEdge";
import { ArchitectureManager } from "../components/builder/ArchitectureManager";
import { BuilderFooter } from "../components/builder/BuilderFooter";
import { BuilderHeader } from "../components/builder/BuilderHeader";
import { CanvasToolbar } from "../components/builder/CanvasToolbar";
import { ChaosConfig, ChaosPanel } from "../components/builder/ChaosPanel";
import { CustomNode } from "../components/builder/CustomNode";
import { EdgeContextMenu } from "../components/builder/EdgeContextMenu";
import { HardwareConfigPanel } from "../components/builder/HardwareConfigPanel";
import { LatencyHeatmap } from "../components/builder/LatencyHeatmap";
import { NodeContextMenu } from "../components/builder/NodeContextMenu";
import { NodePalette } from "../components/builder/NodePalette";
import { RemoteCursor } from "../components/builder/RemoteCursor";
import { ScenarioInfoPanel } from "../components/builder/ScenarioInfoPanel";
import { ShareDialog } from "../components/builder/ShareDialog";
import { SimulationPanel } from "../components/builder/SimulationPanel";
import { TemplateModal } from "../components/builder/TemplateModal";
import { PublishDialog } from "../components/gallery/PublishDialog";
import { ExportDialog } from "../components/export/ExportDialog";
import { MobileCanvasWarning } from "../components/common/MobileCanvasWarning";
import type { ArchitectureTemplate } from "../data/templates";
import { useCollaboration } from "../hooks/useCollaboration";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { architectureService } from "../services/architecture.service";
import { scenarioService } from "../services/scenario.service";
import { useAuthStore } from "../store/authStore";
import type {
  NodeConfig,
  NodeData,
  NodeTypeDefinition,
} from "../types/builder.types";
import { isValidConnection } from "../types/builder.types";
import type { Scenario } from "../types/scenario.types";
import type { SimulationOutput } from "../types/simulation.types";
import { getDefaultConfig } from "../utils/configCalculator";
import { generateRoomId } from "../utils/roomUtils";
import { showError, showInfo, showSuccess, showWarning } from "../utils/toast";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

const snapGrid: [number, number] = [20, 20];

interface HistoryState {
  nodes: ReactFlowNode[];
  edges: Edge[];
}

interface ClipboardState {
  nodes: ReactFlowNode[];
  edges: Edge[];
}

export const Builder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { scenarioId, roomId } = useParams<{ scenarioId: string; roomId: string }>();
  
  // Initialize from navigation state if available (for handling transition to collaboration room)
  const initialNodes = location.state?.nodes || [];
  const initialEdges = location.state?.edges || [];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [isScenarioPanelOpen, setIsScenarioPanelOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentArchitectureId, setCurrentArchitectureId] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showArchitectureManager, setShowArchitectureManager] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [isSimulationPanelOpen, setIsSimulationPanelOpen] = useState(false);
  const [chaosExternalTrigger, setChaosExternalTrigger] = useState(false);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    x: number;
    y: number;
    edgeId: string;
  } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [interactionMode, setInteractionMode] = useState<"hand" | "pointer">(
    "pointer",
  );
  const [simulationResults, setSimulationResults] =
    useState<SimulationOutput | null>(null);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isSimulationPlaying, setIsSimulationPlaying] = useState(false);
  const [showLatencyHeatmap, setShowLatencyHeatmap] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [collaborationRoomId, setCollaborationRoomId] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const nodeIdCounter = useRef(0);
  const edgeIdCounter = useRef(0);
  const isReceivingRemoteUpdate = useRef(false);
  const lastSentNodesJson = useRef<string>('[]');
  const lastSentEdgesJson = useRef<string>('[]');
  const { isAuthenticated, user } = useAuthStore();

  // Check if this is a free canvas (no scenario)
  const isFreeCanvas = !scenarioId;

  // Auto-enable collaboration if we are in a room URL
  useEffect(() => {
    if (roomId && !isCollaborationEnabled) {
      console.log('🔄 Auto-enabling collaboration for room:', roomId);
      setIsCollaborationEnabled(true);
      // Also verify nodes/edges are sent if we are the host
      if (location.state?.isHost) {
        // The existing useEffect for sending updates will trigger once isConnected becomes true
        console.log('👑 Host detected, will sync state once connected');
      }
    }
  }, [roomId, location.state]);
  
  // Determine the session ID for collaboration
  const collaborationSessionId = useMemo(() => {
    console.log('🔍 Determining collaborationSessionId:', { roomId, collaborationRoomId });
    // If we have a roomId from URL, use it (user joined via share link)
    if (roomId) {
      console.log('✅ Using roomId from URL:', roomId);
      return roomId;
    }
    // If we have a generated room ID, use it (user created the room)
    if (collaborationRoomId) {
      console.log('✅ Using generated collaborationRoomId:', collaborationRoomId);
      return collaborationRoomId;
    }
    // Fallback for non-collaborative sessions
    console.log('⚠️  No room ID available, returning null');
    return null;
  }, [roomId, collaborationRoomId]);

  // Generate a stable temp session ID for non-collaborative sessions (only once)
  const tempSessionIdRef = useRef(`temp-${Date.now()}`);
  const stableSessionId = collaborationSessionId || tempSessionIdRef.current;
  
  console.log('🎯 Final stableSessionId:', stableSessionId, {
    collaborationSessionId,
    tempFallback: tempSessionIdRef.current,
  });

  // Initialize real-time collaboration
  const collaboration = useCollaboration({
    sessionId: stableSessionId,
    userId: user?.id || "anonymous",
    userName: user?.name || "Guest",
    enabled: isCollaborationEnabled && isAuthenticated,
    shouldLoadInitialState: !location.state?.isHost,
    onNodesChange: (remoteNodes) => {
      // Update nodes from remote users
      console.log('📥 Received nodes from backend:', remoteNodes.length);
      isReceivingRemoteUpdate.current = true;
      
      // Update tracking before setting state
      lastSentNodesJson.current = JSON.stringify(remoteNodes);
      
      setNodes(remoteNodes);
      
      // Reset flag after state update completes
      setTimeout(() => {
        isReceivingRemoteUpdate.current = false;
      }, 50);
    },
    onEdgesChange: (remoteEdges) => {
      // Update edges from remote users
      console.log('📥 Received edges from backend:', remoteEdges.length);
      isReceivingRemoteUpdate.current = true;
      
      // Update tracking before setting state
      lastSentEdgesJson.current = JSON.stringify(remoteEdges);
      
      setEdges(remoteEdges);
      
      // Reset flag after state update completes
      setTimeout(() => {
        isReceivingRemoteUpdate.current = false;
      }, 50);
    },
    onSessionEnded: (reason) => {
      // Logic for when host ends the session
      if (isCollaborationEnabled) {
        setIsCollaborationEnabled(false);
        setCollaborationRoomId(null);
        
        const message = reason || "The host has ended the collaboration session.";
        
        // If it's a "Room not found" error, show a error toast to ensure user sees it
        if (message.includes("not found")) {
             showError(message);
        } else {
             showInfo(message);
        }
        
        // If we are in a room URL, navigate back to clean canvas or dashboard
        if (roomId) {
          navigate('/canvas'); 
        }
      }
    }
  });

  // Send node updates to collaborators when nodes change (but not when receiving remote updates)
  useEffect(() => {
    if (isCollaborationEnabled && collaboration.isConnected && isAuthenticated && !isReceivingRemoteUpdate.current) {
      // Only send if nodes actually changed (prevent duplicate sends)
      const currentNodesJson = JSON.stringify(nodes);
      if (currentNodesJson !== lastSentNodesJson.current) {
        lastSentNodesJson.current = currentNodesJson;
        collaboration.sendNodesUpdate(nodes);
      }
    }
  }, [nodes, isCollaborationEnabled, collaboration.isConnected, isAuthenticated, collaboration]);

  // Send edge updates to collaborators when edges change (but not when receiving remote updates)
  useEffect(() => {
    if (isCollaborationEnabled && collaboration.isConnected && isAuthenticated && !isReceivingRemoteUpdate.current) {
      // Only send if edges actually changed (prevent duplicate sends)
      const currentEdgesJson = JSON.stringify(edges);
      if (currentEdgesJson !== lastSentEdgesJson.current) {
        lastSentEdgesJson.current = currentEdgesJson;
        collaboration.sendEdgesUpdate(edges);
      }
    }
  }, [edges, isCollaborationEnabled, collaboration.isConnected, isAuthenticated, collaboration]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // ==================== VERSIONING HELPERS (Excalidraw-style) ====================
  const versionRef = useRef<Map<string, number>>(new Map()); // Track version for each element

  // Get next version for an element
  const getNextVersion = useCallback((id: string): number => {
    const currentVersion = versionRef.current.get(id) || 0;
    const nextVersion = currentVersion + 1;
    versionRef.current.set(id, nextVersion);
    return nextVersion;
  }, []);

  // TODO: These helpers will be used when we enable versioning in node/edge operations
  // Add version metadata to nodes
  // const addVersionToNodes = useCallback((nodes: BuilderNode[]): BuilderNode[] => {
  //   return nodes.map(node => ({
  //     ...node,
  //     version: getNextVersion(node.id),
  //     lastModifiedBy: user?.id || "anonymous",
  //     lastModifiedAt: Date.now(),
  //     data: {
  //       ...node.data,
  //       version: getNextVersion(node.id),
  //       lastModifiedBy: user?.id || "anonymous",
  //       lastModifiedAt: Date.now(),
  //     },
  //   }));
  // }, [getNextVersion, user?.id]);

  // Add version metadata to edges
  // const addVersionToEdges = useCallback((edges: BuilderEdge[]): BuilderEdge[] => {
  //   return edges.map(edge => ({
  //     ...edge,
  //     version: getNextVersion(edge.id),
  //     lastModifiedBy: user?.id || "anonymous",
  //     lastModifiedAt: Date.now(),
  //   }));
  // }, [getNextVersion, user?.id]);

  // Soft delete (tombstone) nodes - mark as deleted instead of removing
  // const tombstoneNodes = useCallback((nodeIds: string[]): void => {
  //   setNodes((nds: ReactFlowNode[]) =>
  //     nds.map(node => {
  //       if (nodeIds.includes(node.id)) {
  //         const versionedNode = {
  //           ...node,
  //           isDeleted: true,
  //           version: getNextVersion(node.id),
  //           lastModifiedBy: user?.id || "anonymous",
  //           lastModifiedAt: Date.now(),
  //         };
  //         // Broadcast tombstoned node
  //         if (isCollaborationEnabled && collaboration.isConnected) {
  //           collaboration.sendNodesUpdate([versionedNode]);
  //         }
  //         return versionedNode;
  //       }
  //       return node;
  //     })
  //   );
  // }, [setNodes, getNextVersion, user?.id, isCollaborationEnabled, collaboration]);

  // Filter out deleted nodes from display (conflict resolution will filter these automatically)
  // const visibleNodes = useMemo(() => {
  //   return nodes.filter(node => !(node as any).isDeleted);
  // }, [nodes]);

  // Filter out deleted edges from display
  // const visibleEdges = useMemo(() => {
  //   return edges.filter(edge => !(edge as any).isDeleted);
  // }, [edges]);

  // Prevent unused variable warning
  void getNextVersion;

  // Auto-enable collaboration if joining via room link (only on initial load, not when already in a room)
  const hasAutoEnabledRef = useRef(false);
  useEffect(() => {
    // Only auto-enable if:
    // 1. roomId exists in URL
    // 2. Collaboration is currently disabled
    // 3. We haven't already auto-enabled for this session
    if (roomId && !isCollaborationEnabled && !hasAutoEnabledRef.current) {
      console.log('🔗 Auto-enabling collaboration for room:', roomId);
      setIsCollaborationEnabled(true);
      hasAutoEnabledRef.current = true;
      showInfo(`Connecting to collaboration room: ${roomId}...`);
    }
    
    // Reset flag if roomId changes or is cleared
    if (!roomId) {
      hasAutoEnabledRef.current = false;
    }
  }, [roomId, isCollaborationEnabled]);

  // Send initial canvas state when connected (SIMPLE: Just send it!)
  // Send initial canvas state ONLY ONCE when first connecting
  const hasInitialSyncRun = useRef(false);
  useEffect(() => {
    if (collaboration.isConnected && isCollaborationEnabled && isAuthenticated && !hasInitialSyncRun.current) {
      console.log('📤 Sending my current canvas to backend:', nodes.length, 'nodes', edges.length, 'edges');
      
      // Only send if we have local data (we're the room creator)
      if (nodes.length > 0 || edges.length > 0) {
        // Send without throttling for initial sync
        isReceivingRemoteUpdate.current = true; // Prevent echo
        collaboration.sendNodesUpdate(nodes);
        collaboration.sendEdgesUpdate(edges);
        console.log('✅ Initial canvas state sent');
        setTimeout(() => {
          isReceivingRemoteUpdate.current = false;
        }, 100);
      } else {
        console.log('ℹ️  No local canvas data to send (waiting for server state)');
      }
      
      hasInitialSyncRun.current = true;
    }
    
    // Reset flag when disconnected
    if (!collaboration.isConnected) {
      hasInitialSyncRun.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaboration.isConnected, isCollaborationEnabled, isAuthenticated, nodes, edges]);

  // Fetch scenario and load saved architecture if exists
  // IMPORTANT: Skip loading saved architecture when joining a collaboration room!
  useEffect(() => {
    // If user is joining a collaboration room via link, don't load their own saved architecture
    // The collaboration sync will provide the shared diagram
    if (roomId) {
      console.log('🔗 Joining collaboration room - skipping local architecture load');
      return;
    }

    const fetchScenarioAndArchitecture = async () => {
      if (scenarioId) {
        try {
          // Load scenario details
          const data = await scenarioService.getScenarioById(scenarioId);
          setScenario(data);
          setIsScenarioPanelOpen(true);
          setSaveTitle(data.title + " - My Solution");

          // Try to load saved architecture for this scenario
          if (isAuthenticated) {
            try {
              const architectures =
                await architectureService.getUserArchitectures(scenarioId);
              if (architectures.length > 0) {
                // Load the most recent architecture
                const latestArch = architectures[0];
                const fullArch = await architectureService.getArchitecture(
                  latestArch.id,
                );

                // Populate canvas with saved data
                const loadedNodes = fullArch.canvas_data.nodes || [];
                const loadedEdges = fullArch.canvas_data.edges || [];

                // Regenerate replica clones for nodes with replicas > 1
                const nodesWithReplicas: ReactFlowNode[] = [];
                loadedNodes.forEach((node: ReactFlowNode) => {
                  const nodeData = node.data as NodeData;
                  const replicas = nodeData?.config?.replicas || 1;

                  if (replicas > 1) {
                    // Mark main node as part of replica group
                    const mainNode = {
                      ...node,
                      data: {
                        ...node.data,
                        replicaGroup: node.id,
                        replicaIndex: 1,
                        totalReplicas: replicas,
                      },
                    };
                    nodesWithReplicas.push(mainNode);

                    // Create replica clones
                    const REPLICA_SPACING_X = 180;
                    for (let i = 1; i < replicas; i++) {
                      const replicaNode = {
                        ...mainNode,
                        id: `${node.id}-replica-${i}`,
                        position: {
                          x: node.position.x + i * REPLICA_SPACING_X,
                          y: node.position.y,
                        },
                        data: {
                          ...mainNode.data,
                          replicaGroup: node.id,
                          replicaIndex: i + 1,
                          totalReplicas: replicas,
                        },
                      };
                      nodesWithReplicas.push(replicaNode);
                    }
                  } else {
                    nodesWithReplicas.push(node);
                  }
                });

                // Regenerate edges for replica clones
                const edgesWithReplicas: Edge[] = [...loadedEdges];
                loadedNodes.forEach((node: ReactFlowNode) => {
                  const nodeData = node.data as NodeData;
                  const replicas = nodeData?.config?.replicas || 1;

                  if (replicas > 1) {
                    // Find edges connected to this node
                    const nodeEdges = loadedEdges.filter(
                      (e: Edge) => e.source === node.id || e.target === node.id,
                    );

                    // Duplicate edges for each replica
                    for (let i = 1; i < replicas; i++) {
                      const replicaId = `${node.id}-replica-${i}`;

                      nodeEdges.forEach((edge: Edge) => {
                        if (edge.source === node.id) {
                          edgesWithReplicas.push({
                            ...edge,
                            id: `${edge.id}-replica-${i}`,
                            source: replicaId,
                          });
                        } else if (edge.target === node.id) {
                          edgesWithReplicas.push({
                            ...edge,
                            id: `${edge.id}-replica-${i}`,
                            target: replicaId,
                          });
                        }
                      });
                    }
                  }
                });

                setNodes(nodesWithReplicas);
                setEdges(edgesWithReplicas);
                setCurrentArchitectureId(fullArch.id);
                setSaveTitle(fullArch.title);
                setSaveDescription(fullArch.description || "");
                setAutoSaveEnabled(true); // Enable auto-save for loaded architecture
                setLastSavedAt(new Date(fullArch.updated_at));

                // Update node/edge counters
                nodeIdCounter.current =
                  Math.max(
                    0,
                    ...fullArch.canvas_data.nodes.map((n: ReactFlowNode) => {
                      const match = n.id.match(/node-(\d+)/);
                      return match ? parseInt(match[1]) : 0;
                    }),
                  ) + 1;

                edgeIdCounter.current =
                  Math.max(
                    0,
                    ...fullArch.canvas_data.edges.map((e: Edge) => {
                      const match = e.id.match(/edge-(\d+)/);
                      return match ? parseInt(match[1]) : 0;
                    }),
                  ) + 1;

                console.log("Loaded saved architecture:", fullArch.title);
              }
            } catch (error) {
              console.log("No saved architecture found, starting fresh");
            }
          }
        } catch (error) {
          console.error("Failed to load scenario:", error);
        }
      } else {
        // Free canvas mode - set default title and try to load most recent standalone architecture
        setSaveTitle("My Architecture Design");
        setIsScenarioPanelOpen(false);

        // Try to load most recent standalone architecture (no scenario_id)
        if (isAuthenticated) {
          try {
            const architectures =
              await architectureService.getUserArchitectures(undefined, true); // standalone only
            if (architectures.length > 0) {
              // Load the most recent standalone architecture
              const latestArch = architectures[0];
              const fullArch = await architectureService.getArchitecture(
                latestArch.id,
              );

              // Populate canvas with saved data
              const loadedNodes = fullArch.canvas_data.nodes || [];
              const loadedEdges = fullArch.canvas_data.edges || [];

              // Regenerate replica clones for nodes with replicas > 1
              const nodesWithReplicas: ReactFlowNode[] = [];
              loadedNodes.forEach((node: ReactFlowNode) => {
                const nodeData = node.data as NodeData;
                const replicas = nodeData?.config?.replicas || 1;

                if (replicas > 1) {
                  // Mark main node as part of replica group
                  const mainNode = {
                    ...node,
                    data: {
                      ...node.data,
                      replicaGroup: node.id,
                      replicaIndex: 1,
                      totalReplicas: replicas,
                    },
                  };
                  nodesWithReplicas.push(mainNode);

                  // Create replica clones
                  const REPLICA_SPACING_X = 180;
                  for (let i = 1; i < replicas; i++) {
                    const replicaNode = {
                      ...mainNode,
                      id: `${node.id}-replica-${i}`,
                      position: {
                        x: node.position.x + i * REPLICA_SPACING_X,
                        y: node.position.y,
                      },
                      data: {
                        ...mainNode.data,
                        replicaGroup: node.id,
                        replicaIndex: i + 1,
                        totalReplicas: replicas,
                      },
                    };
                    nodesWithReplicas.push(replicaNode);
                  }
                } else {
                  nodesWithReplicas.push(node);
                }
              });

              // Regenerate edges for replica clones
              const edgesWithReplicas: Edge[] = [...loadedEdges];
              loadedNodes.forEach((node: ReactFlowNode) => {
                const nodeData = node.data as NodeData;
                const replicas = nodeData?.config?.replicas || 1;

                if (replicas > 1) {
                  // Find edges connected to this node
                  const nodeEdges = loadedEdges.filter(
                    (e: Edge) => e.source === node.id || e.target === node.id,
                  );

                  // Duplicate edges for each replica
                  for (let i = 1; i < replicas; i++) {
                    const replicaId = `${node.id}-replica-${i}`;

                    nodeEdges.forEach((edge: Edge) => {
                      if (edge.source === node.id) {
                        edgesWithReplicas.push({
                          ...edge,
                          id: `${edge.id}-replica-${i}`,
                          source: replicaId,
                        });
                      } else if (edge.target === node.id) {
                        edgesWithReplicas.push({
                          ...edge,
                          id: `${edge.id}-replica-${i}`,
                          target: replicaId,
                        });
                      }
                    });
                  }
                }
              });

              setNodes(nodesWithReplicas);
              setEdges(edgesWithReplicas);
              setCurrentArchitectureId(fullArch.id);
              setSaveTitle(fullArch.title);
              setSaveDescription(fullArch.description || "");
              setAutoSaveEnabled(true); // Enable auto-save for loaded architecture
              setLastSavedAt(new Date(fullArch.updated_at));

              // Update node/edge counters
              nodeIdCounter.current =
                Math.max(
                  0,
                  ...fullArch.canvas_data.nodes.map((n: ReactFlowNode) => {
                    const match = n.id.match(/node-(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                  }),
                ) + 1;

              edgeIdCounter.current =
                Math.max(
                  0,
                  ...fullArch.canvas_data.edges.map((e: Edge) => {
                    const match = e.id.match(/edge-(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                  }),
                ) + 1;

              console.log(
                "Loaded saved standalone architecture:",
                fullArch.title,
              );
            }
          } catch (error) {
            console.log(
              "No saved standalone architecture found, starting fresh",
            );
          }
        }
      }
    };
    fetchScenarioAndArchitecture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, isAuthenticated, roomId]); // Added roomId to prevent loading saved arch when joining collab room

  // Auto-save effect - save every 3 seconds when there are unsaved changes
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 3000); // Auto-save every 3 seconds

    return () => clearInterval(autoSaveInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveEnabled, hasUnsavedChanges, nodes, edges]);

  // Track changes to nodes and edges to mark as unsaved
  useEffect(() => {
    if (currentArchitectureId && autoSaveEnabled) {
      setHasUnsavedChanges(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // Show initial save dialog for new architectures when user adds first node
  useEffect(() => {
    // Skip if in collaboration room (guest should not be forced to save host's canvas)
    if (roomId) return;

    if (
      !currentArchitectureId &&
      nodes.length > 0 &&
      !showSaveDialog &&
      isAuthenticated &&
      !saveTitle
    ) {
      // User has started working but hasn't saved yet
      // Show dialog after a short delay to let them work
      const timer = setTimeout(() => {
        if (!currentArchitectureId && nodes.length > 0) {
          setShowSaveDialog(true);
          showInfo("Please save your architecture to enable auto-save!");
        }
      }, 5000); // Show after 5 seconds of work

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, currentArchitectureId, isAuthenticated]);

  // Chaos Engineering - Inject Failure
  const handleInjectFailure = (config: ChaosConfig) => {
    console.log("Injecting chaos failure:", config);

    // Visual feedback - mark the node as failed
    setNodes((nds: ReactFlowNode[]) =>
      nds.map((node: ReactFlowNode) => {
        if (node.id === config.targetNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              chaosFailure: config.failureType,
              chaosSeverity: config.severity,
              chaosDuration: config.duration, // Store duration for simulation engine
            },
          };
        }
        return node;
      }),
    );

    // Auto-recover after duration
    if (config.autoRecover) {
      setTimeout(() => {
        console.log("Auto-recovering from chaos failure");

        // Remove chaos markers from node
        setNodes((nds: ReactFlowNode[]) =>
          nds.map((node: ReactFlowNode) => {
            if (node.id === config.targetNodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  chaosFailure: undefined,
                  chaosSeverity: undefined,
                },
              };
            }
            return node;
          }),
        );

        showSuccess("Chaos experiment completed. Node recovered successfully.");
      }, config.duration * 1000);
    }

    showInfo(
      `Chaos Injection Active!\n\n` +
        `Target: ${config.targetNodeId}\n` +
        `Failure: ${config.failureType}\n` +
        `Severity: ${config.severity}%\n` +
        `Duration: ${config.duration}s\n` +
        `${config.autoRecover ? "✅ Will auto-recover" : "⚠️ Manual recovery required"}`,
    );
  };

  // Handle simulation completion and update progress
  const handleSimulationComplete = async (results: SimulationOutput) => {
    setSimulationResults(results);

    // If we have a scenario, calculate score and update progress
    if (scenario && isAuthenticated) {
      const goals = scenario.goals;
      const metrics = results.metrics;
      let goalsMet = 0;
      const totalGoals = 4; // Latency, Error, Throughput, Regions

      // 1. Latency Check
      const latencyMet = metrics.latency.p95 <= goals.max_latency_ms;
      if (latencyMet) goalsMet++;

      // 2. Error Rate Check
      const errorRateMet = (metrics.errorRate * 100) <= goals.max_error_rate_percent;
      if (errorRateMet) goalsMet++;

      // 3. Throughput Check
      const throughputMet = metrics.throughput >= goals.min_throughput_rps;
      if (throughputMet) goalsMet++;

      // 4. Regions Check
      // Check regions from the first time series point (workload distribution)
      const usedRegions = Object.keys(results.timeSeries[0]?.regionTrafficMap || {});
      const regionsMet = goals.must_support_regions.every(r => usedRegions.includes(r));
      if (regionsMet) goalsMet++;

      // Calculate Score (0-100)
      const score = Math.round((goalsMet / totalGoals) * 100);

      // Determine Status
      const isSuccess = goalsMet === totalGoals;
      const status = isSuccess ? "completed" : "in_progress";

      // Update backend
      try {
        await scenarioService.updateProgress(scenario.id, {
          status: status,
          steps_completed: goalsMet,
          total_steps: totalGoals,
          score: score,
          score_breakdown: {
             latency: latencyMet ? 25 : 0,
             throughput: throughputMet ? 25 : 0,
             errors: errorRateMet ? 25 : 0,
             hints_penalty: 0 
          } as any
        });
        
        if (isSuccess) {
           showSuccess(`🎉 Scenario Completed Successfully!`);
        } else {
           showInfo(`Progress Saved. Keep optimizing!`);
        }
      } catch (error) {
        console.error("Failed to update progress:", error);
      }
    }
  };

  // Show save dialog (only for first-time save or manual save)
  const handleShowSaveDialog = () => {
    // Check authentication first
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Show the save dialog
    setShowSaveDialog(true);
  };

  // Auto-save function (silent save without dialog)
  const handleAutoSave = async () => {
    // Don't auto-save if:
    // - Not authenticated
    // - No architecture ID (first save needs dialog)
    // - No unsaved changes
    // - Currently saving
    if (
      !isAuthenticated ||
      !currentArchitectureId ||
      !hasUnsavedChanges ||
      isSaving
    ) {
      return;
    }

    try {
      setIsSaving(true);

      // Filter out replica clones before saving (only save main nodes)
      const mainNodes = nodes.filter((n: ReactFlowNode) => {
        return !n.data?.replicaGroup || n.data.replicaGroup === n.id;
      });

      // Filter edges to only include those connected to main nodes
      const mainNodeIds = new Set(mainNodes.map((n: ReactFlowNode) => n.id));
      const mainEdges = edges.filter(
        (e: Edge) => mainNodeIds.has(e.source) && mainNodeIds.has(e.target),
      );

      await architectureService.saveArchitecture({
        id: currentArchitectureId,
        scenario_id: scenarioId,
        title: saveTitle,
        description: saveDescription || undefined,
        canvas_data: {
          nodes: mainNodes,
          edges: mainEdges,
        },
        is_submitted: false,
      });

      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't show error toast for auto-save failures to avoid annoying the user
    } finally {
      setIsSaving(false);
    }
  };

  // Save architecture (manual save with dialog)
  const handleSave = async () => {
    if (!saveTitle.trim()) {
      showWarning("Please enter a title for your architecture");
      return;
    }

    setIsSaving(true);
    try {
      // Filter out replica clones before saving (only save main nodes)
      const mainNodes = nodes.filter((n: ReactFlowNode) => {
        // Keep nodes that are NOT replica clones (either no replicaGroup, or replicaGroup === own id)
        return !n.data?.replicaGroup || n.data.replicaGroup === n.id;
      });

      // Filter edges to only include those connected to main nodes
      const mainNodeIds = new Set(mainNodes.map((n: ReactFlowNode) => n.id));
      const mainEdges = edges.filter(
        (e: Edge) => mainNodeIds.has(e.source) && mainNodeIds.has(e.target),
      );

      const architecture = await architectureService.saveArchitecture({
        id: currentArchitectureId || undefined,
        scenario_id: scenarioId,
        title: saveTitle,
        description: saveDescription || undefined,
        canvas_data: {
          nodes: mainNodes,
          edges: mainEdges,
        },
        is_submitted: false,
      });

      setCurrentArchitectureId(architecture.id);
      setShowSaveDialog(false);
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      setAutoSaveEnabled(true); // Enable auto-save after first manual save
      showSuccess("Architecture saved successfully! Auto-save is now enabled.");
    } catch (error) {
      console.error("Failed to save architecture:", error);
      showError("Failed to save architecture. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle successful authentication from modal
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Show save dialog after successful login
    setShowSaveDialog(true);
  };

  // Load Template
  const handleLoadTemplate = (template: ArchitectureTemplate) => {
    // Only warn if there are unsaved changes on an unsaved architecture
    if (
      nodes.length > 0 &&
      !autoSaveEnabled &&
      !currentArchitectureId &&
      hasUnsavedChanges &&
      !confirm("You have unsaved work. Load template anyway?")
    ) {
      return;
    }

    saveToHistory();

    // Deep copy to avoid reference issues
    const newNodes = JSON.parse(JSON.stringify(template.nodes));
    const newEdges = JSON.parse(JSON.stringify(template.edges));

    // Reset counters based on new content to avoid ID collisions
    // We use a simple heuristic to find max ID numbers
    let maxNodeNum = 0;
    let maxEdgeNum = 0;

    // Helper to extract number from id string
    const extractNum = (str: string) => {
      const matches = str.match(/\d+/);
      return matches ? parseInt(matches[0]) : 0;
    };

    newNodes.forEach(
      (n: ReactFlowNode) =>
        (maxNodeNum = Math.max(maxNodeNum, extractNum(n.id))),
    );
    newEdges.forEach(
      (e: Edge) => (maxEdgeNum = Math.max(maxEdgeNum, extractNum(e.id))),
    );

    nodeIdCounter.current = maxNodeNum + 1;
    edgeIdCounter.current = maxEdgeNum + 1;

    setNodes(newNodes);
    setEdges(newEdges);
    setShowTemplateModal(false);

    // Reset simulation state
    setSimulationResults(null);
    setCurrentTick(0);
    setIsSimulationPlaying(false);

    // Reset architecture state (it's a new template-based architecture)
    setCurrentArchitectureId(null);
    setSaveTitle("");
    setSaveDescription("");
    setAutoSaveEnabled(false);
    setLastSavedAt(null);
    setHasUnsavedChanges(false);

    showInfo("Template loaded! Save it to enable auto-save.");
  };

  // Load saved architecture
  const handleLoadArchitecture = async (architectureId: string) => {
    try {
      const architecture =
        await architectureService.getArchitecture(architectureId);

      // Only warn if there are unsaved changes on an unsaved architecture
      // If auto-save is enabled, the current work is already saved!
      if (
        nodes.length > 0 &&
        !autoSaveEnabled &&
        !currentArchitectureId &&
        hasUnsavedChanges &&
        !confirm("You have unsaved work. Load different architecture anyway?")
      ) {
        return;
      }

      saveToHistory();

      // Load nodes and edges
      setNodes(architecture.canvas_data.nodes);
      setEdges(architecture.canvas_data.edges);
      setCurrentArchitectureId(architecture.id);
      setSaveTitle(architecture.title);
      setSaveDescription(architecture.description || "");
      setAutoSaveEnabled(true); // Enable auto-save
      setLastSavedAt(new Date(architecture.updated_at));
      setHasUnsavedChanges(false);

      // Update counters
      nodeIdCounter.current =
        Math.max(
          0,
          ...architecture.canvas_data.nodes.map((n: ReactFlowNode) => {
            const match = n.id.match(/node-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }),
        ) + 1;

      edgeIdCounter.current =
        Math.max(
          0,
          ...architecture.canvas_data.edges.map((e: Edge) => {
            const match = e.id.match(/edge-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }),
        ) + 1;

      // Reset simulation state
      setSimulationResults(null);
      setCurrentTick(0);
      setIsSimulationPlaying(false);

      showSuccess(`Loaded: ${architecture.title}`);
    } catch (error) {
      console.error("Failed to load architecture:", error);
      showError("Failed to load architecture");
    }
  };

  // Create new canvas
  const handleNewCanvas = () => {
    // Only warn if there are unsaved changes on an unsaved architecture
    // If auto-save is enabled, the work is already saved!
    if (
      nodes.length > 0 &&
      !autoSaveEnabled &&
      !currentArchitectureId &&
      hasUnsavedChanges &&
      !confirm("You have unsaved work. Create new canvas anyway?")
    ) {
      return;
    }

    saveToHistory();
    setNodes([]);
    setEdges([]);
    setCurrentArchitectureId(null);
    setSaveTitle("");
    setSaveDescription("");
    setAutoSaveEnabled(false);
    setLastSavedAt(null);
    setHasUnsavedChanges(false);
    setSimulationResults(null);
    setCurrentTick(0);
    setIsSimulationPlaying(false);
    
    // IMPORTANT: Disable collaboration and clear room when creating new canvas
    if (isCollaborationEnabled) {
      setIsCollaborationEnabled(false);
      setCollaborationRoomId(null);
      console.log('🔌 Disabled collaboration for new canvas');
    }
    
    // Clear room ID from URL if present
    if (roomId) {
      navigate('/canvas');
      console.log('🔌 Cleared room ID from URL');
    }

    showInfo("New canvas created. Your previous work is saved!");
  };

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Keyboard shortcuts
  useMemo(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" && selectedNode) {
        e.preventDefault();
        handleDeleteNode(selectedNode.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedNode]);

  // Add node
  const handleAddNode = useCallback(
    (nodeType: NodeTypeDefinition) => {
      saveToHistory();
      setHasUnsavedChanges(true);

      // Get hardware configuration defaults (NO performance calculation!)
      // Performance is calculated by simulation engine during load testing
      const defaultConfig = getDefaultConfig(nodeType.type);

      const newNode = {
        id: `node-${nodeIdCounter.current++}`,
        type: "custom",
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: nodeType.label,
          config: defaultConfig, // Only hardware specs
          nodeType: nodeType.type, // Store for validation
        },
      };

      setNodes((nds: ReactFlowNode[]) => [...nds, newNode]);
    },
    [setNodes, saveToHistory],
  );

  // Update node config
  const handleUpdateNode = useCallback(
    (
      nodeId: string,
      configUpdate: Partial<NodeConfig> & { label?: string },
    ) => {
      setHasUnsavedChanges(true);
      setNodes((nds: ReactFlowNode[]) => {
        const targetNode = nds.find((n: ReactFlowNode) => n.id === nodeId);
        if (!targetNode) return nds;

        const oldReplicas = targetNode.data.config.replicas || 1;
        const newReplicas =
          configUpdate.replicas !== undefined
            ? configUpdate.replicas
            : oldReplicas;

        // Update the main node config
        let updatedNodes = nds.map((node: ReactFlowNode) => {
          if (node.id === nodeId) {
            const { label, ...cleanConfig } = configUpdate;
            return {
              ...node,
              data: {
                ...node.data,
                label: label !== undefined ? label : node.data.label,
                config: {
                  ...node.data.config,
                  ...cleanConfig,
                },
              },
            };
          }
          return node;
        });

        // Handle replica visual duplication
        if (newReplicas !== oldReplicas) {
          const mainNode = updatedNodes.find(
            (n: ReactFlowNode) => n.id === nodeId,
          );

          // Remove old replica clones
          updatedNodes = updatedNodes.filter(
            (n: ReactFlowNode) =>
              !(n.data?.replicaGroup === nodeId && n.id !== nodeId),
          );

          // Create new replica clones
          if (newReplicas > 1 && mainNode) {
            const REPLICA_SPACING_X = 180;
            const REPLICA_SPACING_Y = 0;

            for (let i = 1; i < newReplicas; i++) {
              const replicaNode = {
                ...mainNode,
                id: `${nodeId}-replica-${i}`,
                position: {
                  x: mainNode.position.x + i * REPLICA_SPACING_X,
                  y: mainNode.position.y + i * REPLICA_SPACING_Y,
                },
                data: {
                  ...mainNode.data,
                  replicaGroup: nodeId, // Mark as replica of original
                  replicaIndex: i + 1, // 1-indexed (main node is 1, this is 2, 3, etc.)
                  totalReplicas: newReplicas,
                },
              };
              updatedNodes.push(replicaNode);
            }

            // Update main node to mark it as part of replica group
            updatedNodes = updatedNodes.map((n: ReactFlowNode) => {
              if (n.id === nodeId) {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    replicaGroup: nodeId, // Main node is its own group leader
                    replicaIndex: 1,
                    totalReplicas: newReplicas,
                  },
                };
              }
              return n;
            });
          }
        }

        return updatedNodes;
      });

      // Update edges to connect to all replicas
      if (configUpdate.replicas !== undefined && configUpdate.replicas > 1) {
        setTimeout(() => {
          setEdges((eds: Edge[]) => {
            const originalNodeEdges = eds.filter(
              (e: Edge) => e.source === nodeId || e.target === nodeId,
            );

            const newEdges = [...eds];

            // For each replica clone, duplicate the edges
            for (let i = 1; i < configUpdate.replicas!; i++) {
              const replicaId = `${nodeId}-replica-${i}`;

              originalNodeEdges.forEach((edge: Edge) => {
                if (edge.source === nodeId) {
                  // Outgoing edge: replica -> target
                  newEdges.push({
                    ...edge,
                    id: `${edge.id}-replica-${i}`,
                    source: replicaId,
                  });
                } else if (edge.target === nodeId) {
                  // Incoming edge: source -> replica
                  newEdges.push({
                    ...edge,
                    id: `${edge.id}-replica-${i}`,
                    target: replicaId,
                  });
                }
              });
            }

            return newEdges;
          });
        }, 50); // Small delay to ensure nodes are created first
      }
    },
    [setNodes, setEdges],
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      saveToHistory();
      setHasUnsavedChanges(true);

      // Find all replica clones of this node
      setNodes((nds: ReactFlowNode[]) => {
        const nodesToDelete = new Set([nodeId]);

        // If deleting a main node, also delete all its replicas
        nds.forEach((n: ReactFlowNode) => {
          if (n.data?.replicaGroup === nodeId && n.id !== nodeId) {
            nodesToDelete.add(n.id);
          }
        });

        // If deleting a replica clone, DON'T delete main node (just this replica)
        // Decrease replica count on main node instead
        const deletedNode = nds.find((n: ReactFlowNode) => n.id === nodeId);
        if (
          deletedNode?.data?.replicaGroup &&
          deletedNode.data.replicaGroup !== nodeId
        ) {
          // This is a replica clone, not the main node
          const mainNodeId = deletedNode.data.replicaGroup;
          const mainNode = nds.find((n: ReactFlowNode) => n.id === mainNodeId);
          if (mainNode) {
            const currentReplicas = mainNode.data.config.replicas || 1;
            // Update main node replica count
            setTimeout(() => {
              handleUpdateNode(mainNodeId, { replicas: currentReplicas - 1 });
            }, 0);
          }
        }

        return nds.filter((node: ReactFlowNode) => !nodesToDelete.has(node.id));
      });

      setEdges((eds: Edge[]) => {
        const nodesToDelete = new Set([nodeId]);
        // Also find replica nodes
        const allNodes = [...document.querySelectorAll("[data-id]")];
        allNodes.forEach((el) => {
          const id = el.getAttribute("data-id");
          if (id?.startsWith(`${nodeId}-replica-`)) {
            nodesToDelete.add(id);
          }
        });

        return eds.filter(
          (edge: Edge) =>
            !nodesToDelete.has(edge.source) && !nodesToDelete.has(edge.target),
        );
      });

      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode, saveToHistory, handleUpdateNode],
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      saveToHistory();
      setHasUnsavedChanges(true);
      setEdges((eds: Edge[]) => eds.filter((edge: Edge) => edge.id !== edgeId));
    },
    [setEdges, saveToHistory],
  );

  // ==================== KEYBOARD SHORTCUTS ====================
  const handleSelectAll = useCallback(() => {
    setNodes((nds) =>
      nds.map((n: ReactFlowNode) => ({ ...n, selected: true })),
    );
    setEdges((eds) => eds.map((e: Edge) => ({ ...e, selected: true })));
  }, [setNodes, setEdges]);

  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n: ReactFlowNode) => n.selected);
    const selectedEdges = edges.filter((e: Edge) => e.selected);

    if (selectedNodes.length > 0) {
      setClipboard({ nodes: selectedNodes, edges: selectedEdges });
    }
  }, [nodes, edges]);

  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return;

    saveToHistory();

    const offset = 50;
    const idMap = new Map<string, string>();

    const newNodes = clipboard.nodes.map((node) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true,
        data: {
          ...node.data,
          label: `${node.data.label} (Copy)`,
        },
      };
    });

    const newEdges = clipboard.edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map((edge) => ({
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: true,
      }));

    setNodes((nds) =>
      nds
        .map((n: ReactFlowNode) => ({ ...n, selected: false }))
        .concat(newNodes),
    );
    setEdges((eds) =>
      eds.map((e: Edge) => ({ ...e, selected: false })).concat(newEdges),
    );
  }, [clipboard, saveToHistory, setNodes, setEdges]);

  const handleKeyboardDelete = useCallback(() => {
    const selectedNodes = nodes.filter((n: ReactFlowNode) => n.selected);
    if (selectedNodes.length === 0) return;

    saveToHistory();
    setNodes((nds) => nds.filter((n: ReactFlowNode) => !n.selected));
    setEdges((eds) => eds.filter((e: Edge) => !e.selected));
    setSelectedNode(null);
  }, [nodes, saveToHistory, setNodes, setEdges]);

  useKeyboardShortcuts({
    onCopy: handleCopy,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onDelete: handleKeyboardDelete,
    onUndo: undo,
    onRedo: redo,
  });
  // ============================================================

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setEdgeContextMenu({
        x: event.clientX,
        y: event.clientY,
        edgeId: edge.id,
      });
    },
    [],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: ReactFlowNode) => {
      event.preventDefault();
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
      setSelectedNode(node);
      setIsConfigPanelOpen(false); // Do not open panel on right click
    },
    [],
  );

  const handleDuplicateNode = useCallback(() => {
    if (!selectedNode) return;
    saveToHistory();
    const newNode = {
      ...selectedNode,
      id: `node-${nodeIdCounter.current++}`,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50,
      },
      selected: true,
      data: {
        ...selectedNode.data,
        label: `${selectedNode.data.label} (Copy)`,
      },
    };
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false })).concat(newNode),
    );
    setSelectedNode(newNode);
    setNodeContextMenu(null);
  }, [selectedNode, setNodes, saveToHistory]);
  // On connect
  const onConnect = useCallback(
    (connection: Connection) => {
      // Get node types for validation
      const sourceNode = nodes.find(
        (n: ReactFlowNode) => n.id === connection.source,
      );
      const targetNode = nodes.find(
        (n: ReactFlowNode) => n.id === connection.target,
      );

      if (!sourceNode || !targetNode) return;

      const sourceType = sourceNode.data.nodeType || "unknown";
      const targetType = targetNode.data.nodeType || "unknown";
      const sourceConfig = sourceNode.data.config;

      // Validate connection
      if (!isValidConnection(sourceType, targetType, sourceConfig)) {
        showError(
          `Invalid connection: ${sourceNode.data.label} cannot connect to ${targetNode.data.label}`,
        );
        return;
      }

      // ⚠️ SRE WARNING: DB→Queue without CDC flag
      if (
        (sourceType === "database_sql" || sourceType === "database_nosql") &&
        (targetType === "queue" || targetType === "message_broker")
      ) {
        if (!sourceConfig?.cdcEnabled) {
          const enableCDC = confirm(
            `⚠️ SRE Warning: Database→Queue Connection\n\n` +
              `You're connecting a database to a queue without Change Data Capture (CDC) enabled.\n\n` +
              `Real-world best practice: Use CDC (Debezium/Maxwell) to stream database changes to queues.\n\n` +
              `Would you like to enable CDC for this database?\n` +
              `(You can also enable it later in the node configuration panel)`,
          );

          if (enableCDC) {
            // Enable CDC on the database node
            handleUpdateNode(connection.source!, { cdcEnabled: true });
          }
        }
      }

      saveToHistory();
      setHasUnsavedChanges(true);

      // Determine edge style based on node types (SRE Feature)
      const isDeploymentFlow =
        sourceType === "cicd_pipeline" ||
        sourceType === "container_registry" ||
        targetType === "container_registry";

      const newEdge: Edge = {
        ...connection,
        id: `edge-${edgeIdCounter.current++}`,
        type: "animated",
        animated: !isDeploymentFlow, // Deployment flows are static/dashed
        style: isDeploymentFlow
          ? { strokeDasharray: "5,5", stroke: "#ea580c" }
          : undefined, // Orange dashed for deployment
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      } as Edge;

      setEdges((eds: Edge[]) => addEdge(newEdge, eds));
    },
    [nodes, setEdges, saveToHistory, handleUpdateNode],
  );

  // On node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ReactFlowNode) => {
      // Check if node is locked by another user
      if (
        isCollaborationEnabled &&
        collaboration.isNodeLockedByOther(node.id)
      ) {
        const locker = collaboration.getNodeLocker(node.id);
        showWarning(
          `This node is currently being edited by ${locker?.name || "another user"}.`,
        );
        return;
      }

      // Lock the node if collaboration is enabled
      if (
        isCollaborationEnabled &&
        collaboration.isConnected &&
        isAuthenticated
      ) {
        collaboration.lockNode(node.id);
      }

      setSelectedNode(node);
      setIsConfigPanelOpen(true);
    },
    [isCollaborationEnabled, collaboration, isAuthenticated],
  );

  // On pane click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsConfigPanelOpen(false);
    setEdgeContextMenu(null);
    setNodeContextMenu(null);
  }, []);

  // Auto-play simulation playback when results are available
  useEffect(() => {
    if (simulationResults) {
      setCurrentTick(0);
      setIsSimulationPlaying(true);
    }
  }, [simulationResults]);

  // Simulation Playback Timer
  useEffect(() => {
    let timer: any; // Fix lint error
    if (isSimulationPlaying && simulationResults) {
      timer = setInterval(() => {
        setCurrentTick((prev) => {
          if (prev >= simulationResults.timeSeries.length - 1) {
            setIsSimulationPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500); // 500ms per tick
    }
    return () => clearInterval(timer);
  }, [isSimulationPlaying, simulationResults]);

  // IMMEDIATE auto-scaling visualization when simulation completes
  useEffect(() => {
    if (!simulationResults) return;

    // Collect all scaling events and apply the FINAL state immediately
    const finalReplicaCounts = new Map<string, number>();

    // Process all ticks to get final replica counts
    simulationResults.timeSeries.forEach((tick) => {
      tick.scalingEvents?.forEach((event) => {
        finalReplicaCounts.set(event.nodeId, event.newValue);
      });
    });

    if (finalReplicaCounts.size === 0) return;

    console.log(
      "🚀 Applying auto-scaling visualization:",
      Object.fromEntries(finalReplicaCounts),
    );

    // Apply all scaling changes to the canvas
    setNodes((nds: ReactFlowNode[]) => {
      let updatedNodes = [...nds];

      // Remove all existing auto-scaled replicas first
      updatedNodes = updatedNodes.filter(
        (n: ReactFlowNode) => !n.data?.isAutoScaled,
      );

      // Add replicas for each scaled node
      finalReplicaCounts.forEach((finalReplicas, nodeId) => {
        const mainNode = updatedNodes.find(
          (n: ReactFlowNode) => n.id === nodeId,
        );
        if (!mainNode) return;

        const REPLICA_SPACING_X = 180;
        const REPLICA_SPACING_Y = 20;

        // Create replica nodes (starting from index 1, since mainNode is index 0)
        for (let i = 1; i < finalReplicas; i++) {
          const replicaNode = {
            ...mainNode,
            id: `${nodeId}-autoscale-${i}`,
            position: {
              x: mainNode.position.x + i * REPLICA_SPACING_X,
              y: mainNode.position.y + i * REPLICA_SPACING_Y,
            },
            data: {
              ...mainNode.data,
              replicaGroup: nodeId,
              replicaIndex: i + 1,
              totalReplicas: finalReplicas,
              isAutoScaled: true,
            },
          };
          updatedNodes.push(replicaNode);
        }

        // Update main node metadata
        const mainNodeIndex = updatedNodes.findIndex(
          (n: ReactFlowNode) => n.id === nodeId,
        );
        if (mainNodeIndex !== -1) {
          updatedNodes[mainNodeIndex] = {
            ...updatedNodes[mainNodeIndex],
            data: {
              ...updatedNodes[mainNodeIndex].data,
              replicaGroup: nodeId,
              replicaIndex: 1,
              totalReplicas: finalReplicas,
            },
          };
        }
      });

      return updatedNodes;
    });

    // Add edges for all replicas
    setEdges((eds: Edge[]) => {
      let updatedEdges = [...eds];

      // Remove existing autoscale edges
      updatedEdges = updatedEdges.filter(
        (e: Edge) => !e.id.includes("-autoscale-"),
      );

      finalReplicaCounts.forEach((finalReplicas, nodeId) => {
        const nodeEdges = eds.filter(
          (e: Edge) => e.source === nodeId || e.target === nodeId,
        );

        // Create edges for each replica
        for (let i = 1; i < finalReplicas; i++) {
          const replicaId = `${nodeId}-autoscale-${i}`;

          nodeEdges.forEach((edge: Edge) => {
            if (edge.source === nodeId) {
              updatedEdges.push({
                ...edge,
                id: `${edge.id}-autoscale-${i}`,
                source: replicaId,
              });
            } else if (edge.target === nodeId) {
              updatedEdges.push({
                ...edge,
                id: `${edge.id}-autoscale-${i}`,
                target: replicaId,
              });
            }
          });
        }
      });

      return updatedEdges;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationResults]);

  // Handle auto-scaling events during playback (create TEMPORARY visual replicas)
  useEffect(() => {
    if (!simulationResults || currentTick < 0) return;

    const currentData = simulationResults.timeSeries[currentTick];
    if (!currentData?.scalingEvents || currentData.scalingEvents.length === 0)
      return;

    // Process each scaling event at this tick
    currentData.scalingEvents.forEach((event) => {
      const action =
        event.newValue > event.oldValue ? "🔼 SCALED UP" : "🔽 SCALED DOWN";
      console.log(
        `${action}: ${event.nodeId} (${event.oldValue}→${event.newValue}) - ${event.reason}`,
      );

      // Find the main node
      setNodes((nds: ReactFlowNode[]) => {
        const mainNode = nds.find((n: ReactFlowNode) => n.id === event.nodeId);
        if (!mainNode) return nds;

        const oldReplicas = event.oldValue;
        const newReplicas = event.newValue;

        let updatedNodes = [...nds];

        // SCALE UP: Add new replica clones
        if (newReplicas > oldReplicas) {
          const REPLICA_SPACING_X = 180;

          for (let i = oldReplicas; i < newReplicas; i++) {
            const replicaNode = {
              ...mainNode,
              id: `${event.nodeId}-autoscale-${i}`,
              position: {
                x: mainNode.position.x + i * REPLICA_SPACING_X,
                y: mainNode.position.y,
              },
              data: {
                ...mainNode.data,
                replicaGroup: event.nodeId,
                replicaIndex: i + 1,
                totalReplicas: newReplicas,
                isAutoScaled: true, // Mark as auto-scaled for visual effect
              },
            };
            updatedNodes.push(replicaNode);
          }

          // Update main node metadata
          updatedNodes = updatedNodes.map((n: ReactFlowNode) => {
            if (n.id === event.nodeId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  replicaGroup: event.nodeId,
                  replicaIndex: 1,
                  totalReplicas: newReplicas,
                },
              };
            }
            return n;
          });
        }

        // SCALE DOWN: Remove replica clones
        if (newReplicas < oldReplicas) {
          // Remove replicas beyond the new count
          updatedNodes = updatedNodes.filter((n: ReactFlowNode) => {
            if (n.id.startsWith(`${event.nodeId}-autoscale-`)) {
              const replicaIndex = n.data?.replicaIndex || 0;
              return replicaIndex <= newReplicas;
            }
            return true;
          });

          // Update remaining nodes' metadata
          updatedNodes = updatedNodes.map((n: ReactFlowNode) => {
            if (
              n.id === event.nodeId ||
              n.id.startsWith(`${event.nodeId}-autoscale-`)
            ) {
              return {
                ...n,
                data: {
                  ...n.data,
                  totalReplicas: newReplicas,
                },
              };
            }
            return n;
          });
        }

        return updatedNodes;
      });

      // Duplicate edges for new replicas
      if (event.newValue > event.oldValue) {
        setEdges((eds: Edge[]) => {
          const nodeEdges = eds.filter(
            (e: Edge) => e.source === event.nodeId || e.target === event.nodeId,
          );

          const newEdges = [...eds];

          for (let i = event.oldValue; i < event.newValue; i++) {
            const replicaId = `${event.nodeId}-autoscale-${i}`;

            nodeEdges.forEach((edge: Edge) => {
              if (edge.source === event.nodeId) {
                newEdges.push({
                  ...edge,
                  id: `${edge.id}-autoscale-${i}`,
                  source: replicaId,
                });
              } else if (edge.target === event.nodeId) {
                newEdges.push({
                  ...edge,
                  id: `${edge.id}-autoscale-${i}`,
                  target: replicaId,
                });
              }
            });
          }

          return newEdges;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationResults, currentTick]);

  // Update nodes and edges with traffic data from current simulation tick
  useEffect(() => {
    if (!simulationResults || currentTick < 0) return;

    const currentData = simulationResults.timeSeries[currentTick];
    if (!currentData) return;

    // Update nodes with activity data
    setNodes((nds: ReactFlowNode[]) =>
      nds.map((node: ReactFlowNode) => {
        const nodeMetrics = currentData.nodeMetrics?.[node.id];
        if (!nodeMetrics) return node;

        return {
          ...node,
          data: {
            ...node.data,
            activity: {
              rpsIn: nodeMetrics.rpsIn || 0,
              rpsOut: nodeMetrics.rpsOut || 0,
              cpu: nodeMetrics.cpuPercent || 0,
              memPercent: nodeMetrics.memPercent || 0, // NEW
              diskIOPercent: nodeMetrics.diskIOPercent || 0, // NEW
              networkPercent: nodeMetrics.networkPercent || 0, // NEW
              errors: nodeMetrics.errors || 0,
              status: nodeMetrics.status || "normal",
              successRate: nodeMetrics.successRate,
              bottleneck:
                (nodeMetrics as unknown as Record<string, string>).bottleneck ||
                "none", // NEW: Bottleneck indicator
            },
          },
        };
      }),
    );

    // Update edges with traffic data
    setEdges((eds: Edge[]) =>
      eds.map((edge: Edge) => {
        // Calculate traffic on this edge based on source/target node metrics
        const sourceMetrics = currentData.nodeMetrics?.[edge.source];
        const targetMetrics = currentData.nodeMetrics?.[edge.target];

        if (!sourceMetrics || !targetMetrics)
          return {
            ...edge,
            type: "animated",
          };

        // Estimate traffic flow
        const traffic = {
          rps: sourceMetrics.rpsOut || 0,
          latency: targetMetrics.latencyMs || currentData.latency?.p50 || 0,
          errorRate:
            (targetMetrics.errors || 0) / Math.max(targetMetrics.rpsIn || 1, 1),
        };

        // Color-code edge by latency (heatmap feature)
        let edgeColor = "#94a3b8"; // Default gray
        let edgeWidth = 2;

        if (traffic.latency > 0) {
          if (traffic.latency < 50) {
            edgeColor = "#22c55e"; // Green - fast
          } else if (traffic.latency < 150) {
            edgeColor = "#eab308"; // Yellow - moderate
            edgeWidth = 3;
          } else if (traffic.latency < 500) {
            edgeColor = "#f97316"; // Orange - slow
            edgeWidth = 4;
          } else {
            edgeColor = "#ef4444"; // Red - very slow
            edgeWidth = 5;
          }
        }

        return {
          ...edge,
          type: "animated",
          data: { traffic },
          style: {
            ...edge.style,
            stroke: edgeColor,
            strokeWidth: edgeWidth,
          },
        };
      }),
    );
  }, [simulationResults, currentTick, setNodes, setEdges]);

  // Clean up traffic data when simulation stops
  useEffect(() => {
    if (!isSimulationPlaying && simulationResults) {
      // Clear activity data from nodes
      setNodes((nds: ReactFlowNode[]) =>
        nds.map((node: ReactFlowNode) => ({
          ...node,
          data: {
            ...node.data,
            activity: undefined,
          },
        })),
      );

      // Clear traffic data from edges and reset to default style
      setEdges((eds: Edge[]) =>
        eds.map((edge: Edge) => ({
          ...edge,
          type: "animated",
          data: { traffic: undefined },
        })),
      );
    }
  }, [isSimulationPlaying, simulationResults, setNodes, setEdges]);

  // Clear simulation results and effects
  const handleClearSimulation = () => {
    setIsSimulationPlaying(false);
    setCurrentTick(0);
    setSimulationResults(null);
    setShowLatencyHeatmap(false);
    
    // Clear chaos effects from nodes
    setNodes((nds) => 
      nds.map(node => {
        if (node.data.chaosFailure) {
          return {
            ...node,
            data: {
              ...node.data,
              chaosFailure: undefined,
              chaosSeverity: undefined,
              chaosDuration: undefined
            }
          };
        }
        return node;
      })
    );
  };

  // Clear canvas handler
  const handleClearCanvas = () => {
    // Only confirm if there are unsaved changes on unsaved architecture
    if (
      nodes.length > 0 &&
      !autoSaveEnabled &&
      !currentArchitectureId &&
      hasUnsavedChanges &&
      !confirm("Clear canvas and lose unsaved work?")
    ) {
      return;
    }

    if (autoSaveEnabled && nodes.length > 0) {
      // Work is saved, just clear the canvas
      saveToHistory();
      setNodes([]);
      setEdges([]);
      setCurrentArchitectureId(null);
      setSaveTitle("");
      setSaveDescription("");
      setAutoSaveEnabled(false);
      setLastSavedAt(null);
      setHasUnsavedChanges(false);
      
      // Disable collaboration when clearing
      if (isCollaborationEnabled) {
        setIsCollaborationEnabled(false);
        setCollaborationRoomId(null);
      }
      if (roomId) {
        navigate('/canvas');
      }
      
      showInfo("Canvas cleared. Your previous work is saved!");
    } else if (nodes.length > 0) {
      // Clear without confirm (already checked above)
      saveToHistory();
      setNodes([]);
      setEdges([]);
      
      // Disable collaboration when clearing
      if (isCollaborationEnabled) {
        setIsCollaborationEnabled(false);
        setCollaborationRoomId(null);
      }
      if (roomId) {
        navigate('/canvas');
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#1e1e1e]">
      <BuilderHeader
        projectName={scenario?.title || "Architecture Builder"}
        onSave={handleShowSaveDialog}
        onUndo={undo}
        onRedo={redo}
        onClear={handleClearCanvas}
        onShowRequirements={!isFreeCanvas ? () => setIsScenarioPanelOpen(true) : undefined}
        onManageArchitectures={() => setShowArchitectureManager(true)}
        onViewAnalytics={currentArchitectureId ? () => navigate(`/analytics/${currentArchitectureId}`) : undefined}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        hasUnsavedChanges={hasUnsavedChanges}
        autoSaveEnabled={autoSaveEnabled}
        isCollaborationEnabled={isCollaborationEnabled}
        isCollaborationConnected={collaboration.isConnected}
        onToggleCollaboration={isFreeCanvas ? () => {
          if (!isAuthenticated) {
            showWarning("Please log in to use real-time collaboration");
            setShowAuthModal(true);
            return;
          }
          
          if (!isCollaborationEnabled) {
            // Enabling collaboration
            if (!roomId && !collaborationRoomId) {
              // Generate new room ID and navigate to room URL
              const newRoomId = generateRoomId();
              setCollaborationRoomId(newRoomId);
              
              // Navigate to room URL
              navigate(`/canvas/room/${newRoomId}`, { 
                state: { 
                  nodes, 
                  edges, 
                  isHost: true 
                } 
              });
              
              setIsCollaborationEnabled(true);
              setShowShareDialog(true); // Show share dialog
              showSuccess("Collaboration room created! Share the link with others.");
            } else {
              // Already have a room, just enable
              setIsCollaborationEnabled(true);
              setShowShareDialog(true);
              showSuccess("Real-time collaboration enabled!");
            }
          } else {
            // Disabling collaboration
            
            // If Host: End Session for Everyone
            if (location.state?.isHost || !roomId) {
                 collaboration.endSession();
                 showInfo("Requesting session shutdown...");
                 // We do NOT disable locally yet. We wait for the 'session_ended' event
                 // from the backend (handled in useCollaboration hook) to confirm,
                 // which will then trigger the local cleanup and navigation.
            } else {
               // If Guest: Just Leave (Local Disconnect)
               if (confirm("Leave the collaboration session?")) {
                 setIsCollaborationEnabled(false);
                 setCollaborationRoomId(null);
                 setShowShareDialog(false);
                 navigate('/canvas');
                 showInfo("Left collaboration session.");
               }
            }
          }
        } : undefined}
        onShowShareDialog={() => setShowShareDialog(true)}
        users={collaboration.users}
        currentUserId={user?.id}
        isHost={!roomId || !!location.state?.isHost}
      />

      <div className={isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-[#1e1e1e] flex overflow-hidden" : "flex-1 flex overflow-hidden relative"}>
        {/* Node Palette */}
        <div className="relative flex z-20">
          <div
            className={`transition-all duration-300 border-r border-gray-200 dark:border-[#3e3e3e] bg-white dark:bg-[#252526] overflow-hidden ${isSidebarOpen ? "w-64" : "w-0"}`}
          >
            <div className="w-64 h-full">
              <NodePalette onAddNode={handleAddNode} />
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e3e] rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-gray-100 dark:hover:bg-[#2d2d2d] z-30 text-xs text-gray-500 hover:text-gray-700 dark:text-[#d4d4d4] cursor-pointer transition-all duration-300 transform -translate-y-1/2 -translate-x-1/2"
            style={{ left: isSidebarOpen ? "256px" : "0px" }}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        {/* Canvas */}
        <div
          className="flex-1 relative"
          onMouseMove={(e) => {
            if (
              isCollaborationEnabled &&
              collaboration.isConnected &&
              isAuthenticated
            ) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              collaboration.sendCursorMove(x, y);
            }
          }}
        >
          <CanvasToolbar
            mode={interactionMode}
            onChangeMode={setInteractionMode}
          />

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-4 right-4 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#3e3e3e] rounded-lg p-2 shadow-sm hover:bg-gray-100 dark:hover:bg-[#2d2d2d] z-50 text-gray-700 dark:text-[#d4d4d4] transition-colors"
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          {/* Remote Cursors */}
          {isCollaborationEnabled &&
            collaboration.users
              .filter((u) => u.id !== user?.id)
              .map((remoteUser) => {
                const position = collaboration.cursorPositions[remoteUser.id];
                if (!position) return null;
                return (
                  <RemoteCursor
                    key={remoteUser.id}
                    user={remoteUser}
                    position={position}
                  />
                );
              })}
          <ReactFlow
            panOnDrag={interactionMode === "hand"}
            selectionOnDrag={interactionMode === "pointer"}
            panOnScroll={true}
            selectionMode={SelectionMode.Partial}
            onNodeContextMenu={handleNodeContextMenu}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onEdgeContextMenu={handleEdgeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            snapToGrid={true}
            snapGrid={snapGrid}
            minZoom={0.1}
            maxZoom={4}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <MiniMap nodeColor={() => "#3b82f6"} nodeStrokeWidth={3} />

            {/* Visual Feedback Overlays */}
            {isSimulationPlaying && simulationResults && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm shadow-xl z-30 animate-pulse border border-white/20">
                     🔴 Simulation Playback: Tick {currentTick + 1} / {simulationResults.timeSeries.length}
                </div>
            )}
            
            {/* Info Panel */}
          </ReactFlow>
        </div>
        {/* Hardware Config Panel */}
        {selectedNode && isConfigPanelOpen && (
          <HardwareConfigPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onClose={() => {
              // Unlock the node when closing config panel
              if (
                isCollaborationEnabled &&
                collaboration.isConnected &&
                isAuthenticated &&
                selectedNode
              ) {
                collaboration.unlockNode(selectedNode.id);
              }
              setIsConfigPanelOpen(false);
            }}
          />
        )}
        {/* Template Modal */}
        {showTemplateModal && (
          <TemplateModal
            onSelectTemplate={handleLoadTemplate}
            onClose={() => setShowTemplateModal(false)}
          />
        )}
        {/* Architecture Manager */}
        <ArchitectureManager
          isOpen={showArchitectureManager}
          onClose={() => setShowArchitectureManager(false)}
          onLoad={handleLoadArchitecture}
          onNew={handleNewCanvas}
          currentArchitectureId={currentArchitectureId}
          scenarioId={scenarioId}
          isFreeCanvas={isFreeCanvas}
        />
        {/* Node Context Menu */}
        {nodeContextMenu && (
          <NodeContextMenu
            x={nodeContextMenu.x}
            y={nodeContextMenu.y}
            onEdit={() => {
              const node = nodes.find((n) => n.id === nodeContextMenu.nodeId);
              if (node) {
                setSelectedNode(node);
                setIsConfigPanelOpen(true);
                setNodeContextMenu(null);
              }
            }}
            onDuplicate={handleDuplicateNode}
            onDelete={() => {
              setNodes((nds) =>
                nds.filter((n) => n.id !== nodeContextMenu.nodeId),
              );
              setEdges((eds) =>
                eds.filter(
                  (e) =>
                    e.source !== nodeContextMenu.nodeId &&
                    e.target !== nodeContextMenu.nodeId,
                ),
              );
              setSelectedNode(null);
              setNodeContextMenu(null);
            }}
            onClose={() => setNodeContextMenu(null)}
          />
        )}{" "}
        {/* Edge Context Menu */}
        {edgeContextMenu && (
          <EdgeContextMenu
            x={edgeContextMenu.x}
            y={edgeContextMenu.y}
            onDelete={() => handleDeleteEdge(edgeContextMenu.edgeId)}
            onClose={() => setEdgeContextMenu(null)}
          />
        )}
        {/* Scenario Info Panel */}
        {/* Scenario Info Panel - Only show for scenario-based builder */}
        {!isFreeCanvas && (
          <ScenarioInfoPanel
            scenario={scenario}
            isOpen={isScenarioPanelOpen}
            onToggle={() => setIsScenarioPanelOpen(!isScenarioPanelOpen)}
          />
        )}

        {/* Simulation Panel */}
        <SimulationPanel
          nodes={nodes}
          edges={edges}
          isOpen={isSimulationPanelOpen}
          onToggle={() => {
              if (isSimulationPanelOpen) {
                  // When closing, also clear simulation results and visual effects
                  handleClearSimulation();
                  setIsSimulationPanelOpen(false);
              } else {
                  setIsSimulationPanelOpen(true);
              }
          }}
          onSimulationComplete={handleSimulationComplete}
          scenario={scenario}
          onShowLatencyHeatmap={() => setShowLatencyHeatmap(true)}
          onPlaybackControl={{
            isPlaying: isSimulationPlaying,
            currentTick,
            onPlay: () => setIsSimulationPlaying(true),
            onPause: () => setIsSimulationPlaying(false),
            onSeek: (tick) => setCurrentTick(tick),
            onReset: handleClearSimulation,
          }}
        />
        {/* Chaos Engineering Panel - Modal only (button in footer) */}
        <ChaosPanel
          nodes={nodes}
          onInjectFailure={handleInjectFailure}
          externalTrigger={chaosExternalTrigger}
          onTriggerHandled={() => setChaosExternalTrigger(false)}
          hideButton={true}
        />
        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-[#252526] rounded-lg p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold mb-4">
                {currentArchitectureId
                  ? "Update Architecture"
                  : "Save Architecture"}
              </h3>

              {!currentArchitectureId && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 After saving, your work will auto-save every 3 seconds!
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                    placeholder="My Architecture Design"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d4d4d4] mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-[#1e1e1e] dark:text-[#d4d4d4]"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>

                <div className="text-sm text-gray-600 dark:text-[#9ca3af] bg-gray-50 dark:bg-[#1e1e1e] p-3 rounded border border-gray-200 dark:border-[#3e3e3e]">
                  <p className="font-medium mb-1">Canvas Stats:</p>
                  <p>• {nodes.length} components</p>
                  <p>• {edges.length} connections</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#3e3e3e] rounded-md text-gray-700 dark:text-[#d4d4d4] hover:bg-gray-100 dark:hover:bg-[#2d2d2d]"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !saveTitle.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? "Saving..."
                    : currentArchitectureId
                      ? "Update"
                      : "Save & Enable Auto-Save"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          message="Please sign in or create an account to save your architecture"
        />
        
        {/* Share Dialog */}
        {showShareDialog && (roomId || collaborationRoomId) && (
          <ShareDialog
            roomId={roomId || collaborationRoomId!}
            isOpen={showShareDialog}
            onClose={() => setShowShareDialog(false)}
          />
        )}

        {/* Publish to Gallery Dialog */}
        {showPublishDialog && currentArchitectureId && (
          <PublishDialog
            architectureId={currentArchitectureId}
            currentTitle={saveTitle}
            currentDescription={saveDescription}
            isOpen={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            onPublished={() => {
              showSuccess('Architecture published to gallery!');
            }}
          />
        )}

        {/* Export IaC Dialog */}
        <ExportDialog
          nodes={nodes}
          edges={edges}
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
        />
      </div>

      <BuilderFooter
        onTemplates={() => setShowTemplateModal(true)}
        onValidate={() => showInfo("Validation feature coming soon!")}
        onSimulate={() => setIsSimulationPanelOpen(true)}
        onChaos={() => setChaosExternalTrigger(true)}
        onPublish={() => {
          if (!isAuthenticated) {
            showWarning('Please sign in to publish architectures');
            setShowAuthModal(true);
            return;
          }
          if (!currentArchitectureId) {
            showWarning('Please save your architecture before publishing');
            return;
          }
          setShowPublishDialog(true);
        }}
        onExport={() => setShowExportDialog(true)}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        canPublish={isAuthenticated && !!currentArchitectureId}
      />

      {/* Latency Heatmap Modal */}
      <LatencyHeatmap
        isOpen={showLatencyHeatmap}
        onClose={() => setShowLatencyHeatmap(false)}
        simulationResults={simulationResults}
        currentTick={currentTick}
      />

      {/* Mobile Canvas Warning */}
      <MobileCanvasWarning isCanvas={true} />
    </div>
  );
};
