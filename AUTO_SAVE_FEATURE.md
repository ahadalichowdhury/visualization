# Auto-Save Feature Documentation

## Overview

The Architecture Builder now includes an auto-save feature similar to VS Code and Excalidraw, providing a seamless saving experience for users.

## How It Works

### 1. **First-Time Save Flow**

When a user starts creating a new architecture:

- User adds nodes/edges to the canvas
- After ~5 seconds of work (or when clicking "Save"), a dialog appears asking for:
  - **Title** (required)
  - **Description** (optional)
- After saving, the user sees: "Architecture saved successfully! Auto-save is now enabled."

### 2. **Auto-Save Behavior**

Once the initial save is complete:

- **Auto-save interval**: Every 3 seconds when there are unsaved changes
- **Silent operation**: No popups or interruptions
- **Status indicator**: Shows in the header:
  - 🟢 "Saved X seconds/minutes ago" - All changes saved
  - 🟡 "Unsaved changes" - Changes pending
  - 🔵 "Saving..." - Currently saving

### 3. **Manual Save Options**

The "Save" button behavior changes after auto-save is enabled:

- **Before first save**: "Save" - Opens save dialog
- **After first save**: "Save As..." - Allows creating a copy with new name/description
- **Auto-save**: Happens automatically in background

### 4. **Change Detection**

The system tracks unsaved changes when:

- Adding new nodes
- Updating node configurations
- Deleting nodes
- Creating connections
- Deleting connections
- Moving nodes (through ReactFlow's onNodesChange)

### 5. **Loading Existing Architectures**

When loading a saved architecture:

- Auto-save is automatically enabled
- Last saved timestamp is set to the architecture's `updated_at`
- User can continue working with auto-save active

## UI Components

### Header Status Indicator

Located in the top-right of the header, shows:

```
[Icon] Status Text
```

States:

1. **Saving**: Spinning icon + "Saving..."
2. **Unsaved**: Yellow pulse dot + "Unsaved changes"
3. **Saved**: Green checkmark + "Saved X ago"

### Save Dialog Improvements

- Auto-focus on title field
- Info box explaining auto-save will be enabled
- Better visual hierarchy
- Dark mode support
- Button text changes: "Save & Enable Auto-Save" for first save

## Technical Implementation

### Key State Variables

```typescript
const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
```

### Auto-Save Logic

```typescript
useEffect(() => {
  if (!autoSaveEnabled || !hasUnsavedChanges) return;

  const autoSaveInterval = setInterval(() => {
    handleAutoSave();
  }, 3000); // 3 seconds

  return () => clearInterval(autoSaveInterval);
}, [autoSaveEnabled, hasUnsavedChanges, nodes, edges]);
```

### Change Detection

```typescript
useEffect(() => {
  if (currentArchitectureId && autoSaveEnabled) {
    setHasUnsavedChanges(true);
  }
}, [nodes, edges]);
```

## User Benefits

1. **No Data Loss**: Work is automatically saved every 3 seconds
2. **Non-Intrusive**: Silent saves without popups
3. **Visual Feedback**: Always know the save status
4. **Familiar UX**: Similar to VS Code, Figma, Excalidraw
5. **First-Save Flow**: Clear onboarding for new architectures

## Future Enhancements

Possible improvements:

- Adjustable auto-save interval in settings
- Offline support with local storage fallback
- Conflict resolution for concurrent edits
- Version history / undo across sessions
- "Recovering unsaved changes" on browser crash
