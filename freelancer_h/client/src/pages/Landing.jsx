import { useNavigate } from 'react-router-dom';
import { HiOutlineBriefcase, HiOutlineShieldCheck, HiOutlineCash, HiOutlineLightningBolt, HiOutlineUserGroup, HiOutlineGlobe } from 'react-icons/hi';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="hero">
        <h1>
          Find & Hire<br />
          <span className="highlight">Top Freelancers</span><br />
          With Confidence
        </h1>
        <p>
          Post projects, discover talent, manage milestones, and release payments — all on one platform built for modern teams.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
            Get Started Free →
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/talent')}>
            Browse Talent
          </button>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-value">10K+</div><div className="hero-stat-label">Freelancers</div></div>
          <div><div className="hero-stat-value">5K+</div><div className="hero-stat-label">Projects Completed</div></div>
          <div><div className="hero-stat-value">98%</div><div className="hero-stat-label">Client Satisfaction</div></div>
          <div><div className="hero-stat-value">₹2Cr+</div><div className="hero-stat-label">Paid to Freelancers</div></div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>Everything You Need to Succeed</h2>
          <p>Powerful tools for every stage of the freelancing workflow</p>
        </div>
        <div className="grid-3">
          {[
            { icon: HiOutlineBriefcase, title: 'Smart Project Matching', desc: 'Post projects with skill requirements and let our platform match you with the best talent.' },
            { icon: HiOutlineShieldCheck, title: 'Secure Escrow Payments', desc: 'Funds are held securely in escrow and released only when milestones are approved.' },
            { icon: HiOutlineCash, title: 'Milestone Tracking', desc: 'Break projects into milestones, track progress, and approve deliverables with ease.' },
            { icon: HiOutlineLightningBolt, title: 'Real-time Messaging', desc: 'Communicate instantly with your team through built-in chat with file sharing.' },
            { icon: HiOutlineUserGroup, title: 'Agency Management', desc: 'Build and manage your agency, invite team members, and bid on projects together.' },
            { icon: HiOutlineGlobe, title: 'Dispute Resolution', desc: 'Fair and transparent dispute resolution process with admin mediation support.' },
          ].map((feat, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon"><feat.icon size={24} /></div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>From project posting to payment — in four simple steps</p>
        </div>
        <div className="steps-grid">
          {[
            { num: '1', title: 'Post a Project', desc: 'Define your requirements, budget, and timeline. Publish when ready.' },
            { num: '2', title: 'Hire Talent', desc: 'Review applications, shortlist candidates, and send invites to the best fit.' },
            { num: '3', title: 'Track Progress', desc: 'Manage milestones, assign tasks, review deliverables, and communicate in real-time.' },
            { num: '4', title: 'Release Payment', desc: 'Approve milestones to trigger automatic escrow release. Simple and secure.' },
          ].map((step, i) => (
            <div className="step" key={i}>
              <div className="step-number">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of freelancers and businesses already on FreelanceHub.</p>
        <div className="flex justify-center gap-md">
          <button className="btn btn-lg" style={{ background: 'white', color: 'var(--primary-700)' }} onClick={() => navigate('/register')}>
            Create Free Account
          </button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
