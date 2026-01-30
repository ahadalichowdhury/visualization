# Frontend

React-based frontend application with interactive canvas and real-time graphs.

## Structure

```
src/
├── components/         # React components
│   ├── canvas/        # React Flow canvas components
│   ├── graphs/        # Recharts graph components
│   ├── common/        # Reusable UI components
│   ├── auth/          # Authentication components
│   └── layout/        # Layout components
├── hooks/             # Custom React hooks
├── store/             # Zustand state management
├── services/          # API and WebSocket services
├── utils/             # Utility functions
├── styles/            # Global styles and Tailwind config
├── types/             # TypeScript type definitions
└── pages/             # Page components
```

## Key Technologies

- **React Flow**: Interactive node-based canvas
- **Recharts**: Data visualization charts
- **Zustand**: Lightweight state management
- **TailwindCSS**: Utility-first CSS framework
- **WebSocket**: Real-time data streaming

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
