# 🚀 Implementation Plan: Traffic Animation + Keyboard Controls + Multi-Select

## ✅ User Requirements Understood

### 1. **Lightweight Traffic Animation**
- User wants **lightweight** animation when traffic flows
- **Decision:** Use React Flow's built-in `animated` property + CSS animations
- **Why:** Much lighter than custom particle systems, better performance
- **Implementation:** Simple stroke-dasharray animation on edges when traffic > 0

### 2. **Complete Keyboard Controls**
- Implement ALL standard shortcuts:
  - `Ctrl/Cmd + C` → Copy selected nodes
  - `Ctrl/Cmd + V` → Paste copied nodes
  - `Ctrl/Cmd + A` → Select all
  - `Ctrl/Cmd + D` → Duplicate selected
  - `Ctrl/Cmd + Z` → Undo
  - `Ctrl/Cmd + Y` / `Shift + Z` → Redo
  - `Delete` / `Backspace` → Delete selected

### 3. **Multi-Select with Connected Edges**
- User can select **multiple components** (not just all)
- When moving selected nodes, **connected edges automatically follow**
- This is React Flow's DEFAULT behavior, just need to ensure it's enabled

---

## 📋 Implementation Steps

### **Phase 1: Lightweight Edge Animation** ⚡
**File:** `AnimatedEdge.tsx`
- Remove heavy particle system
- Use CSS `stroke-dasharray` + `stroke-dashoffset` animation
- Color edges based on traffic (green → yellow → red)
- Width based on RPS volume
- **Performance:** 60 FPS even with 100+ edges

### **Phase 2: Keyboard Shortcuts** ⌨️
**Files:** `useKeyboardShortcuts.ts` (already created), `Builder.tsx`
- Implement Copy/Paste with clipboard state
- Implement Select All
- Implement Delete (override default if needed)
- Wire up existing Undo/Redo
- **Edge Case:** Don't trigger when typing in inputs

### **Phase 3: Multi-Select Behavior** 🎯
**File:** `Builder.tsx`
- Verify `multiSelectionKeyCode` is enabled (Shift key)
- Verify `selectionOnDrag` works (already implemented)
- Edges automatically follow selected nodes (React Flow default)
- **Test:** Select 2-3 nodes + drag → edges should stretch

---

## 🎨 Animation Choice: React Flow Built-in

**Why NOT custom particles:**
- Heavy on performance (100+ edges = lag)
- Complex state management
- Overkill for "lightweight" requirement

**Why YES to CSS animations:**
- Native browser optimization
- Zero JavaScript overhead
- Smooth 60 FPS
- Simple `animated={true}` + CSS class

**Implementation:**
```typescript
// Edge gets animated: true when traffic > 0
edge.animated = traffic.rps > 0;
edge.style = {
  stroke: getTrafficColor(traffic),
  strokeWidth: getTrafficWidth(traffic)
};
```

---

## ✅ Ready to Implement

All requirements are clear. Proceeding with implementation now.
