# 🎯 Toast Notifications - Quick Reference

## Import
```typescript
import { showSuccess, showError, showWarning, showInfo, showLoading, showPromise } from '../utils/toast';
```

## Basic Usage

### Success ✅
```typescript
showSuccess("Architecture saved successfully!");
showSuccess("Export completed!");
```

### Error ❌
```typescript
showError("Failed to save architecture");
showError("Simulation failed: Network timeout");
```

### Warning ⚠️
```typescript
showWarning("Please login to save");
showWarning("At least one region is required");
```

### Info ℹ️
```typescript
showInfo("Validation feature coming soon!");
showInfo("Chaos injection started");
```

## Advanced Usage

### Loading Toast
```typescript
const toastId = showLoading("Saving...");
// ... do work ...
dismissToast(toastId);
```

### Promise Toast (Recommended for Async)
```typescript
await showPromise(
  apiCall(),
  {
    loading: "Saving...",
    success: "Saved successfully!",
    error: "Failed to save!"
  }
);
```

## Toast Colors
- ✅ Success: Green
- ❌ Error: Red
- ⚠️ Warning: Amber
- ℹ️ Info: Blue
- ⏳ Loading: Gray

## Durations
- Success: 4s
- Error: 5s
- Warning: 4s
- Info: 3.5s
- Loading: Until dismissed

## Position
All toasts appear in **top-right corner**

## Files Using Toasts
1. `Builder.tsx` - Main canvas operations
2. `ExportPanel.tsx` - IaC export
3. `SimulationPanel.tsx` - Simulation engine
4. `ChaosPanel.tsx` - Chaos engineering
5. `useCollaboration.ts` - Real-time collab
6. `exportUtils.ts` - Utility exports

## Common Patterns

### Save Operation
```typescript
try {
  await save();
  showSuccess("Saved!");
} catch (error) {
  showError("Save failed!");
}
```

### Validation
```typescript
if (!isValid) {
  showWarning("Invalid input!");
  return;
}
```

### Info Message
```typescript
showInfo("Coming soon!");
```

## That's it! 🎉
Simple, beautiful, and production-ready.
