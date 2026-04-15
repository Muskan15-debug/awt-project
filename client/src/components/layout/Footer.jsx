const Footer = () => (
  <footer className="footer">
    <div className="footer-grid">
      <div>
        <div className="footer-brand">FreelanceHub</div>
        <p style={{ maxWidth: 300, lineHeight: 1.7, fontSize: '0.875rem' }}>
          Connect with top freelancers and agencies. Post projects, manage milestones,
          and build amazing products together.
        </p>
      </div>
      <div>
        <h4>Platform</h4>
        <ul className="footer-links">
          <li><a href="/talent">Find Talent</a></li>
          <li><a href="/projects">Browse Projects</a></li>
          <li><a href="/register">Get Started</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul className="footer-links">
          <li><a href="#">About Us</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Blog</a></li>
        </ul>
      </div>
      <div>
        <h4>Support</h4>
        <ul className="footer-links">
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      © {new Date().getFullYear()} FreelanceHub. All rights reserved.
    </div>
  </footer>
);

export default Footer;
