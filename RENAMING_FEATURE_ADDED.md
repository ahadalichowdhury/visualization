# 🏷️ Component Renaming Feature - IMPLEMENTED

## ✅ Feature Overview
The **Component Renaming** feature is now fully implemented and integrated into the Builder UI.
Users can now set custom names for any component (e.g., specific service names like "Order Service", "User DB") instead of using the generic type names.

## 🛠️ Implementation Details

### 1. **Hardware Configuration Panel** (`HardwareConfigPanel.tsx`)
- **New Input Field:** Added a "Component Name" text input at the top of the panel.
- **Dynamic State:** The input is initialized with the current node label.
- **Live Updates:** Typing in the field immediately triggers `onUpdateNode`, updating the specific node's data.

### 2. **Builder Logic** (`Builder.tsx`)
- **Enhanced Update Handler:** The `handleUpdateNode` function was upgraded to accept a `{ label }` property alongside the standard configuration object.
- **State Management:** It now efficiently updates both the `data.config` and the `data.label` of the target node in the React Flow state.

### 3. **Node Rendering** (`CustomNode.tsx`)
- **Visual Feedback:** The custom node component already renders `{data.label}`, so changes in the panel are **instantly reflected** on the canvas.

## 🔄 Simulation Integration
- **Persisted Identity:** When running a simulation, the updated node definitions (including the new labels) are passed to the simulation engine.
- **Result Mapping:** Any results mapped back to these nodes in the frontend (graphs, heatmaps) will display the new custom names.
