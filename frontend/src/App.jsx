import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProfileProvider from './components/ProfileProvider.jsx';
import Layout from './components/Layout.jsx';
import { Home, NotFound } from './pages/PortfolioPages.jsx';
import Projects from './pages/Projects.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import About from './pages/About.jsx';
import CV from './pages/CV.jsx';
import Contact from './pages/Contact.jsx';
import './App.css';
import './ocean-theme.css';
import './features/iceberg/mobile-journey.css';
import './styles/portfolio.css';
import './styles/inner-pages-theme.css';

const router = createBrowserRouter([{
  element: <ProfileProvider><Layout /></ProfileProvider>,
  children: [
    { index: true, element: <Home /> },
    { path: 'projects', element: <Projects /> },
    { path: 'projects/:slug', element: <ProjectDetail /> },
    { path: 'about', element: <About /> },
    { path: 'cv', element: <CV /> },
    { path: 'contact', element: <Contact /> },
    { path: '*', element: <NotFound /> },
  ],
}]);
export default function App() { return <RouterProvider router={router} />; }
