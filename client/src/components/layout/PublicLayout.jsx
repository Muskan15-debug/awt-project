import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

const PublicLayout = () => (
  <>
    <Navbar />
    <main><Outlet /></main>
    <Footer />
  </>
);

export default PublicLayout;
