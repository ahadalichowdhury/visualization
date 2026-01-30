# 🌙 Dark Mode Implementation Plan

## 🎯 Scope
Implement dark mode across the **entire application**:
1. Canvas background
2. All components (nodes, edges, panels)
3. Headers, sidebars, modals
4. Forms and inputs
5. All pages (Dashboard, Builder, Login, etc.)

## 🎨 Dark Theme Colors

### **Base Colors:**
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Card: `#334155` (slate-700)
- Border: `#475569` (slate-600)

### **Text:**
- Primary: `#f1f5f9` (slate-100)
- Secondary: `#cbd5e1` (slate-300)
- Muted: `#94a3b8` (slate-400)

### **Accent Colors:**
- Keep vibrant node colors (they look great on dark!)
- Adjust edge colors for better contrast
- Brighten interactive elements

## 📋 Implementation Steps

### **Phase 1: Global Styles** (index.css)
- Update Tailwind base layer with dark colors
- Add dark mode CSS variables

### **Phase 2: Canvas & Builder**
- Dark background for ReactFlow
- Update node styles for dark mode
- Adjust edge colors
- Dark panels and sidebars

### **Phase 3: Components**
- Headers, footers
- Modals, dialogs
- Forms, inputs
- Buttons (already vibrant, just adjust hover states)

### **Phase 4: Pages**
- Dashboard
- Login/Auth pages
- Scenario pages

## 🚀 Let's Start!
