import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProfileProvider from './components/ProfileProvider.jsx';
import Layout from './components/Layout.jsx';
import PageState from './components/PageState.jsx';
import { Home, NotFound } from './pages/PortfolioPages.jsx';
import './App.css';
import './ocean-theme.css';
import './features/iceberg/mobile-journey.css';
import './styles/portfolio.css';
import './styles/inner-pages-theme.css';

const Projects = lazy(() => import('./pages/Projects.jsx'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const CV = lazy(() => import('./pages/CV.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));

const deferred = element => (
  <Suspense fallback={<PageState status="loading" body="Loading page…" />}>
    {element}
  </Suspense>
);

const router = createBrowserRouter([{
  element: <ProfileProvider><Layout /></ProfileProvider>,
  children: [
    { index: true, element: <Home /> },
    { path: 'projects', element: deferred(<Projects />) },
    { path: 'projects/:slug', element: deferred(<ProjectDetail />) },
    { path: 'about', element: deferred(<About />) },
    { path: 'cv', element: deferred(<CV />) },
    { path: 'contact', element: deferred(<Contact />) },
    { path: '*', element: <NotFound /> },
  ],
}]);
export default function App() { return <RouterProvider router={router} />; }
