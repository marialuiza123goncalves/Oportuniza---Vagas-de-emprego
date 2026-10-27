import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminOpportunitiesPage from './pages/AdminOpportunitiesPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OpportunityDetailPage from './pages/OpportunityDetailPage.jsx';
import OpportunityFormPage from './pages/OpportunityFormPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import AdminCoursesPage from './pages/AdminCoursesPage.jsx';
import CourseFormPage from './pages/CourseFormPage.jsx';
import AboutPage from './pages/AboutPage.jsx';

function NotFoundPage() {
  return (
    <main className="page-shell empty-page">
      <span className="eyebrow">404 · Página não encontrada</span>
      <h1>Este caminho não leva a uma oportunidade.</h1>
      <a className="button button-primary" href="/">Voltar ao início</a>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cursos" element={<CoursesPage />} />
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/oportunidades/:id" element={<OpportunityDetailPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/oportunidades" element={<AdminOpportunitiesPage />} />
          <Route path="/admin/oportunidades/nova" element={<OpportunityFormPage />} />
          <Route path="/admin/oportunidades/:id/editar" element={<OpportunityFormPage />} />
          <Route path="/admin/cursos" element={<AdminCoursesPage />} />
          <Route path="/admin/cursos/novo" element={<CourseFormPage />} />
          <Route path="/admin/cursos/:id/editar" element={<CourseFormPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SiteFooter />
    </>
  );
}
