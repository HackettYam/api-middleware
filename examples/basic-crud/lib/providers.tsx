'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
// import { TaskProvider } from './context/TaskContext';

const TaskProvider = dynamic(() => import('./context/TaskContext').then((mod) => mod.TaskProvider), { ssr: false });
  

// This component will be responsible for providing all client-side
// React context providers
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskProvider>
        {children}
      </TaskProvider>
    </Suspense>
  );
}
