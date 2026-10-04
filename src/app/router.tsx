import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const LandingPage = lazy(() =>
  import('../features/landing/LandingPage').then((m) => ({
    default: m.LandingPage,
  }))
);
const LibraryPage = lazy(() =>
  import('../features/library/LibraryPage').then((m) => ({
    default: m.LibraryPage,
  }))
);
const StudioPage = lazy(() =>
  import('../features/studio/StudioPage').then((m) => ({
    default: m.StudioPage,
  }))
);
const ArchitecturePage = lazy(() =>
  import('../features/architecture/ArchitecturePage').then((m) => ({
    default: m.ArchitecturePage,
  }))
);
const ProposalPage = lazy(() =>
  import('../features/proposal/ProposalPage').then((m) => ({
    default: m.ProposalPage,
  }))
);
const NotFoundPage = lazy(() =>
  import('../features/notfound/NotFoundPage').then((m) => ({
    default: m.NotFoundPage,
  }))
);

const RouteFallback: React.FC = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/studio',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LibraryPage />
      </Suspense>
    ),
  },
  {
    path: '/studio/:id',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <StudioPage />
      </Suspense>
    ),
  },
  {
    path: '/architecture',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <ArchitecturePage />
      </Suspense>
    ),
  },
  {
    path: '/proposal',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <ProposalPage />
      </Suspense>
    ),
  },
  {
    path: '/404',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
