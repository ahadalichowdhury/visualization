# ✨ UI INTERACTION FIX

## 🐛 The Bug
Previously, **Right-Clicking** a node would:
1.  Open the Context Menu (correct).
2.  **ALSO open the Hardware Config Panel** (incorrect/annoying).

This happened because right-clicking visually selects the node, which triggered the panel to open.

## 🛠️ The Fix
I implemented a separate visibility state for the Hardware Config Panel:
1.  **State:** Added `isConfigPanelOpen` boolean state.
2.  **Left Click:** Sets selection AND opens panel (`isConfigPanelOpen = true`).
3.  **Right Click:** Sets selection (for visual feedback) but **KEEPS PANEL CLOSED** (`isConfigPanelOpen = false`).
4.  **Canvas Click:** Deselects node and closes panel.

## 🎯 Result
- **Left Click:** Opens Hardware Config.
- **Right Click:** Opens Context Menu (Settings, Duplicate, Delete). The panel stays hidden.
- **Visuals:** Node is still highlighted on right-click, confirming which node you are acting on.

Your interactions are now conflict-free! 🚀
