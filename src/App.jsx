// Main Wholspace App with Firebase Integration
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  getFeaturedVibecoders, 
  getLatestProjects, 
  getPlatformStats,
  followUser,
  unfollowUser,
  isFollowing
} from './lib/firestore';
import MyProjects from './components/MyProjects';
import MyProfile from './components/MyProfile';

// Tool colors for badges
const toolColors = {
  'Lovable': '#FF6B35',
  'Bolt': '#00D4FF',
  'v0': '#FFFFFF',
  'Cursor': '#7C3AED',
  'Replit': '#F26207',
  'Claude': '#D4A574',
  'ChatGPT': '#10A37F',
  'GitHub Copilot': '#000000',
  'Other': '#888888'
};

const categories = [
  'All', 'SaaS', 'Landing Pages', 'Dashboards', 'E-commerce', 'Mobile Apps', 'AI Tools', 'Portfolios'
];

// ============================================
// VERIFICATION SCREEN COMPONENT
// ============================================
function VerificationScreen({ email, onLoginClick }) {
  return (
    <div style={verificationStyles.container}>
      <div style={verificationStyles.card}>
        <div style={verificationStyles.iconContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        
        <h1 style={verificationStyles.title}>Verify your email</h1>
        
        <p style={verificationStyles.message}>
          We have sent you a verification email to{' '}
          <span style={verificationStyles.email}>{email}</span>.
          <br />
          Please verify it and log in.
        </p>
        
        <button style={verificationStyles.loginButton} onClick={onLoginClick}>
          Login
        </button>
        
        <p style={verificationStyles.hint}>
          Didn't receive the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
}

// ============================================
// AUTH MODAL COMPONENT
// ============================================
function AuthModal({ onClose }) {
  const { 
    signInWithGoogle, 
    signInWithGithub, 
    registerWithEmail,
    signInWithEmail,
    error 
  } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLocalError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setLocalError(err.message);
    }
    setIsLoading(false);
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    setLocalError('');
    try {
      await signInWithGithub();
      onClose();
    } catch (err) {
      setLocalError(err.message);
    }
    setIsLoading(false);
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await registerWithEmail(email, password);
      setVerificationEmail(result.email);
      setVerificationSent(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setLocalError('An account with this email already exists. Please login instead.');
      } else {
        setLocalError(err.message);
      }
    }
    setIsLoading(false);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);
    
    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (err) {
      if (err.message.includes('verify your email')) {
        setVerificationEmail(email);
        setVerificationSent(true);
      } else if (err.code === 'auth/user-not-found') {
        setLocalError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setLocalError('Incorrect password. Please try again.');
      } else {
        setLocalError(err.message);
      }
    }
    setIsLoading(false);
  };

  // Show verification sent screen
  if (verificationSent) {
    return (
      <div style={authStyles.overlay} onClick={onClose}>
        <div style={authStyles.modal} onClick={(e) => e.stopPropagation()}>
          <button style={authStyles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div style={authStyles.verificationContent}>
            <div style={authStyles.verificationIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            
            <h2 style={authStyles.verificationTitle}>Verify your email</h2>
            
            <p style={authStyles.verificationMessage}>
              We have sent you a verification email to{' '}
              <span style={authStyles.verificationEmail}>{verificationEmail}</span>.
              <br />
              Please verify it and log in.
            </p>
            
            <button 
              style={authStyles.verificationLoginBtn}
              onClick={() => {
                setVerificationSent(false);
                setMode('login');
                setPassword('');
              }}
            >
              Login
            </button>
            
            <p style={authStyles.verificationHint}>
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={authStyles.overlay} onClick={onClose}>
      <div style={authStyles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={authStyles.closeBtn} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div style={authStyles.logoContainer}>
          <img src="/logo.png" alt="Wholspace" style={authStyles.modalLogoImg} />
        </div>

        <h1 style={authStyles.modalTitle}>
          {mode === 'login' ? 'Welcome back.' : 'Create account.'}
        </h1>
        <p style={authStyles.modalSubtitle}>
          {mode === 'login' ? 'Log in to your account' : 'Join the Wholspace community'}
        </p>

        {(localError || error) && (
          <div style={authStyles.errorMessage}>
            {localError || error}
          </div>
        )}

        {/* Social login buttons */}
        <div style={authStyles.authButtons}>
          <button 
            style={authStyles.authButton} 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button 
            style={authStyles.authButton} 
            onClick={handleGithubSignIn}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div style={authStyles.divider}>
          <span style={authStyles.dividerLine} />
          <span style={authStyles.dividerText}>OR</span>
          <span style={authStyles.dividerLine} />
        </div>

        {/* Email/Password form */}
        <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailRegister}>
          <div style={authStyles.inputGroup}>
            <label style={authStyles.inputLabel}>EMAIL</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={authStyles.input}
              required
            />
          </div>

          <div style={authStyles.inputGroup}>
            <label style={authStyles.inputLabel}>PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={authStyles.input}
              required
              minLength={6}
            />
          </div>

          {mode === 'register' && (
            <div style={authStyles.inputGroup}>
              <label style={authStyles.inputLabel}>CONFIRM PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={authStyles.input}
                required
                minLength={6}
              />
            </div>
          )}

          <button 
            type="submit"
            style={authStyles.submitButton}
            disabled={isLoading}
          >
            {isLoading 
              ? 'Please wait...' 
              : mode === 'login' 
                ? 'Log in' 
                : 'Create account'
            }
          </button>
        </form>

        <div style={authStyles.switchMode}>
          <span style={authStyles.switchText}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button 
            style={authStyles.switchButton}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setLocalError('');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>

        <p style={authStyles.footerNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ============================================
// USER MENU COMPONENT
// ============================================
function UserMenu({ onLogout, onNavigate }) {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleMenuClick = (page) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(page);
  };

  return (
    <div style={userMenuStyles.container}>
      <button style={userMenuStyles.avatarBtn} onClick={() => setIsOpen(!isOpen)}>
        {userProfile?.photoURL || user.photoURL ? (
          <img src={userProfile?.photoURL || user.photoURL} alt="" style={userMenuStyles.avatarImg} />
        ) : (
          <div style={userMenuStyles.avatarFallback}>
            {user.displayName?.[0] || user.email?.[0] || '?'}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div style={userMenuStyles.backdrop} onClick={() => setIsOpen(false)} />
          <div style={userMenuStyles.dropdown}>
            <div style={userMenuStyles.userInfo}>
              <p style={userMenuStyles.userName}>
                {userProfile?.displayName || user.displayName || 'Wholspace'}
              </p>
              <p style={userMenuStyles.userEmail}>{user.email}</p>
            </div>
            <div style={userMenuStyles.divider} />
            <button style={userMenuStyles.menuItem} onClick={() => handleMenuClick('profile')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              My Profile
            </button>
            <button style={userMenuStyles.menuItem} onClick={() => handleMenuClick('projects')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              My Projects
            </button>
            <div style={userMenuStyles.divider} />
            <button style={userMenuStyles.logoutItem} onClick={() => { setIsOpen(false); onLogout(); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// MAIN MARKETPLACE COMPONENT
// ============================================
function MarketplaceContent() {
  const { user, loading, logout, pendingVerification, clearPendingVerification } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'projects' | 'profile' | 'settings'
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Data states
  const [vibecoders, setVibecoders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedVibecoders, { projects: fetchedProjects }, fetchedStats] = await Promise.all([
          getFeaturedVibecoders(6),
          getLatestProjects(6),
          getPlatformStats()
        ]);
        
        setVibecoders(fetchedVibecoders);
        setProjects(fetchedProjects);
        setStats(fetchedStats);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
      setDataLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    setCurrentPage('home');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <img src="/logo.png" alt="Wholspace" style={styles.loadingLogoImg} />
        <p>Loading...</p>
      </div>
    );
  }

  // Show verification screen if user has pending verification
  if (pendingVerification) {
    return (
      <VerificationScreen 
        email={pendingVerification.email} 
        onLoginClick={() => {
          clearPendingVerification();
          setShowAuth(true);
        }}
      />
    );
  }

  // Render different pages based on currentPage
  if (currentPage === 'projects' && user) {
    return <MyProjects onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'profile' && user) {
    return <MyProfile onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div style={styles.container}>
      {/* Grid overlay */}
      <div style={styles.gridOverlay} />
      
      {/* Navigation */}
      <nav style={{
        ...styles.nav,
        backgroundColor: scrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}>
        <div style={styles.navContent}>
          <div style={styles.logo} onClick={() => setCurrentPage('home')} role="button">
            <img src="/logo.png" alt="Wholspace" style={styles.logoImg} />
            <span style={styles.logoText}>wholspace</span>
          </div>
          
          <div style={styles.navLinks}>
            <a href="#" style={styles.navLink}>Explore</a>
            <a href="#" style={styles.navLink}>Builders</a>
            <a href="#" style={styles.navLink}>Tools</a>
            <a href="#" style={styles.navLink}>Resources</a>
          </div>
          
          <div style={styles.navActions}>
            {user ? (
              <UserMenu onLogout={handleLogout} onNavigate={handleNavigate} />
            ) : (
              <>
                <button style={styles.loginBtn} onClick={() => setShowAuth(true)}>Log in</button>
                <button style={styles.signupBtn} onClick={() => setShowAuth(true)}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={styles.badgeNew}>NEW</span>
            <span>The home for AI-native builders</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>

          <h1 style={styles.headline}>
            <span style={styles.headlineWithUnderline}>
              Ship fast.
              <svg style={styles.wavyUnderline} viewBox="0 0 200 12" preserveAspectRatio="none">
                <path d="M0,6 Q25,0 50,6 T100,6 T150,6 T200,6" stroke="#3B82F6" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            <br />
            <span style={styles.headlineWhite}>Get discovered.</span>
          </h1>
          
          <p style={styles.subheadline}>
            The marketplace for builders. Showcase your AI-built projects,<br />
            connect with builders, and find your next collaborator.
          </p>

          <div style={{
            ...styles.searchContainer,
            boxShadow: searchFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" style={{ marginRight: 12 }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search builders, projects, or tools..."
              style={styles.searchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div style={styles.searchShortcut}>
              <kbd style={styles.kbd}>⌘</kbd>
              <kbd style={styles.kbd}>K</kbd>
            </div>
          </div>

          {/* Stats */}
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statNumber}>100+</span>
              <span style={styles.statLabel}>Builders</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statNumber}>{stats.totalProjects > 0 ? stats.totalProjects.toLocaleString() : '50'}+</span>
              <span style={styles.statLabel}>Projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={styles.categoriesSection}>
        <div style={styles.categoriesScroll}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                ...styles.categoryBtn,
                backgroundColor: activeCategory === category ? '#3B82F6' : 'transparent',
                color: activeCategory === category ? '#fff' : '#888',
                borderColor: activeCategory === category ? '#3B82F6' : '#333',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Vibecoders */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Featured Builders</h2>
            <p style={styles.sectionSubtitle}>Top builders shipping incredible projects</p>
          </div>
          <a href="#" style={styles.viewAllLink}>
            View all
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        <div style={styles.vibecodersGrid}>
          {dataLoading ? (
            <p style={{ color: '#666' }}>Loading builders...</p>
          ) : vibecoders.length > 0 ? (
            vibecoders.map((coder) => (
              <div key={coder.id} style={styles.vibecoderCard}>
                <div style={styles.vibecoderHeader}>
                  {coder.photoURL ? (
                    <img src={coder.photoURL} alt="" style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatar}>
                      {coder.displayName?.[0] || '?'}
                    </div>
                  )}
                  <div style={styles.vibecoderInfo}>
                    <h3 style={styles.vibecoderName}>{coder.displayName}</h3>
                    <span style={styles.vibecoderHandle}>@{coder.handle || 'builder'}</span>
                  </div>
                  <button style={styles.followBtn}>Follow</button>
                </div>
                
                <p style={styles.vibecoderTagline}>{coder.tagline || coder.bio || 'Building something awesome'}</p>
                
                <div style={styles.vibecoderMeta}>
                  <span style={styles.projectCount}>{coder.projectCount || 0} projects</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#666' }}>Be the first builder to join!</p>
          )}
        </div>
      </section>

      {/* Latest Projects - Site Previews */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Latest Projects</h2>
            <p style={styles.sectionSubtitle}>Fresh builds from the community</p>
          </div>
          <a href="#" style={styles.viewAllLink}>
            View all
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        <div style={styles.projectsGrid}>
          {dataLoading ? (
            <p style={{ color: '#666' }}>Loading projects...</p>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} style={styles.projectCard}>
                {/* Site Preview / Thumbnail */}
                <div style={styles.projectPreview}>
                  {project.thumbnailUrl ? (
                    <img 
                      src={project.thumbnailUrl} 
                      alt={project.title}
                      style={styles.projectPreviewImg}
                    />
                  ) : (
                    <div style={styles.projectPreviewPlaceholder}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <path d="M3 9h18"/>
                        <path d="M9 21V9"/>
                      </svg>
                      <span>No preview</span>
                    </div>
                  )}
                  {/* Tool Badge */}
                  <div style={{
                    ...styles.projectToolBadge,
                    backgroundColor: toolColors[project.tool] || '#888'
                  }}>
                    {project.tool}
                  </div>
                </div>

                {/* Project Info */}
                <div style={styles.projectInfo}>
                  <h3 style={styles.projectTitle}>{project.title}</h3>
                  <p style={styles.projectDesc}>
                    {project.shortDescription || project.description?.substring(0, 80) || 'No description'}
                  </p>
                  
                  <div style={styles.projectFooter}>
                    <div style={styles.projectStats}>
                      <span style={styles.projectStat}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {project.likes || 0}
                      </span>
                      <span style={styles.projectStat}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {project.views || 0}
                      </span>
                    </div>
                    {project.demoUrl && (
                      <a 
                        href={project.demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={styles.visitBtn}
                      >
                        Visit
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyProjects}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
              <p>No projects yet. Be the first to showcase your build!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to showcase your builds?</h2>
          <p style={styles.ctaSubtitle}>
            Join thousands of builders shipping incredible projects with AI.
          </p>
          <button style={styles.ctaButton} onClick={() => setShowAuth(true)}>
            Start vibecoding now
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 10 }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLogo}>
            <img src="/logo.png" alt="Wholspace" style={styles.logoImg} />
            <span style={styles.logoText}>wholspace</span>
          </div>
          <div style={styles.footerLinks}>
            <a href="#" style={styles.footerLink}>About</a>
            <a href="#" style={styles.footerLink}>Blog</a>
            <a href="#" style={styles.footerLink}>Twitter</a>
            <a href="#" style={styles.footerLink}>Discord</a>
          </div>
          <p style={styles.footerCopy}>© 2025 Wholspace. Ship fast, get discovered.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================
// APP WITH PROVIDER
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <MarketplaceContent />
    </AuthProvider>
  );
}

// ============================================
// STYLES
// ============================================

const verificationStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: '"Outfit", sans-serif',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: '60px 40px',
    width: '100%',
    maxWidth: 480,
    textAlign: 'center',
    border: '1px solid #222',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  message: {
    fontSize: 16,
    color: '#888',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  email: {
    color: '#3B82F6',
    fontWeight: 600,
  },
  loginButton: {
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '16px 48px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#555',
  },
};

const authStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    fontFamily: '"Outfit", sans-serif',
  },
  modal: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: '40px',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    border: '1px solid #222',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    background: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: 4,
  },
  logoContainer: {
    marginBottom: 24,
  },
  modalLogo: {
    fontSize: 40,
    display: 'block',
  },
  modalLogoImg: {
    height: 48,
    width: 'auto',
    display: 'block',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 8,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  authButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  authButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '14px 24px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#222',
  },
  dividerText: {
    fontSize: 12,
    color: '#555',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #333',
    color: '#fff',
    padding: '14px 16px',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  },
  submitButton: {
    width: '100%',
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '14px 24px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 8,
  },
  switchMode: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchButton: {
    background: 'transparent',
    border: 'none',
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#555',
    marginTop: 20,
  },
  // Verification content in modal
  verificationContent: {
    textAlign: 'center',
    padding: '20px 0',
  },
  verificationIcon: {
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  verificationMessage: {
    fontSize: 15,
    color: '#888',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  verificationEmail: {
    color: '#3B82F6',
    fontWeight: 600,
  },
  verificationLoginBtn: {
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '14px 40px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: 20,
  },
  verificationHint: {
    fontSize: 13,
    color: '#555',
  },
};

const userMenuStyles = {
  container: {
    position: 'relative',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #333',
    background: 'transparent',
    cursor: 'pointer',
    overflow: 'hidden',
    padding: 0,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    background: '#3B82F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 600,
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 240,
    background: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    padding: '8px',
    zIndex: 1000,
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  userInfo: {
    padding: '12px',
  },
  userName: {
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 2,
  },
  userEmail: {
    color: '#666',
    fontSize: 12,
  },
  divider: {
    height: 1,
    background: '#222',
    margin: '8px 0',
  },
  menuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 8,
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  logoutItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 8,
    fontFamily: 'inherit',
    textAlign: 'left',
  },
};

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontFamily: '"Outfit", sans-serif',
  },
  loadingLogo: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingLogoImg: {
    height: 56,
    width: 'auto',
    marginBottom: 16,
  },
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: '"Outfit", sans-serif',
    position: 'relative',
  },
  gridOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15,
    pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    zIndex: 1,
  },
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '16px 0',
    transition: 'all 0.3s ease',
  },
  navContent: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: 24,
  },
  logoImg: {
    height: 28,
    width: 'auto',
    display: 'block',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
    letterSpacing: '-0.02em',
  },
  navLinks: {
    display: 'flex',
    gap: 32,
  },
  navLink: {
    color: '#888',
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  loginBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  signupBtn: {
    background: '#fff',
    border: 'none',
    color: '#000',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  hero: {
    padding: '180px 40px 80px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  heroContent: {
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid #222',
    borderRadius: 100,
    padding: '8px 16px',
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  badgeNew: {
    background: '#3B82F6',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
  },
  headline: {
    fontSize: 'clamp(48px, 8vw, 88px)',
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
    marginBottom: 24,
  },
  headlineWithUnderline: {
    position: 'relative',
    display: 'inline-block',
  },
  wavyUnderline: {
    position: 'absolute',
    bottom: '-5px',
    left: 0,
    width: '100%',
    height: '12px',
  },
  headlineWhite: {
    color: '#ffffff',
  },
  subheadline: {
    fontSize: 18,
    color: '#888',
    lineHeight: 1.6,
    marginBottom: 48,
    maxWidth: 600,
    margin: '0 auto 48px',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 12,
    padding: '16px 20px',
    maxWidth: 600,
    margin: '0 auto 40px',
    transition: 'all 0.2s ease',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: 16,
    fontFamily: 'inherit',
  },
  searchShortcut: {
    display: 'flex',
    gap: 4,
  },
  kbd: {
    background: '#222',
    border: '1px solid #333',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 12,
    color: '#666',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statDivider: {
    width: 1,
    height: 40,
    background: '#222',
  },
  categoriesSection: {
    padding: '0 40px 60px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  categoriesScroll: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  categoryBtn: {
    padding: '10px 20px',
    borderRadius: 100,
    border: '1px solid',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  section: {
    padding: '0 40px 80px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  viewAllLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#888',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
  vibecodersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 20,
  },
  vibecoderCard: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: 16,
    padding: 24,
  },
  vibecoderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#3B82F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  vibecoderInfo: {
    flex: 1,
  },
  vibecoderName: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 2,
  },
  vibecoderHandle: {
    fontSize: 14,
    color: '#666',
  },
  followBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#fff',
    padding: '6px 16px',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  vibecoderTagline: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  vibecoderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectCount: {
    fontSize: 13,
    color: '#666',
  },
  // Project Grid Styles
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 24,
  },
  projectCard: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
  },
  projectPreview: {
    position: 'relative',
    height: 200,
    background: '#0a0a0a',
    overflow: 'hidden',
  },
  projectPreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  projectPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
    color: '#444',
    fontSize: 13,
  },
  projectToolBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  projectInfo: {
    padding: 20,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  projectDesc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 1.5,
    marginBottom: 16,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  projectFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: '1px solid #1a1a1a',
  },
  projectStats: {
    display: 'flex',
    gap: 16,
  },
  projectStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#666',
  },
  visitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  emptyProjects: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    color: '#555',
    gap: 16,
  },
  ctaSection: {
    padding: '80px 40px',
    background: '#0f0f0f',
    borderTop: '1px solid #1a1a1a',
    borderBottom: '1px solid #1a1a1a',
  },
  ctaContent: {
    maxWidth: 600,
    margin: '0 auto',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  ctaButton: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '16px 32px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  // Project card styles
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 24,
  },
  projectCard: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
  },
  projectPreview: {
    position: 'relative',
    height: 200,
    background: '#0a0a0a',
    overflow: 'hidden',
  },
  projectPreviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  projectPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
    color: '#444',
    fontSize: 13,
  },
  projectToolBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  projectInfo: {
    padding: 20,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: '"Space Grotesk", sans-serif',
    color: '#fff',
  },
  projectDesc: {
    fontSize: 14,
    color: '#888',
    lineHeight: 1.5,
    marginBottom: 16,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  projectFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: '1px solid #1a1a1a',
  },
  projectStats: {
    display: 'flex',
    gap: 16,
  },
  projectStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#666',
  },
  visitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#3B82F6',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'background 0.2s ease',
  },
  emptyProjects: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#444',
    textAlign: 'center',
    gap: 16,
  },
  footer: {
    padding: '60px 40px',
  },
  footerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerLinks: {
    display: 'flex',
    gap: 32,
  },
  footerLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: 14,
  },
  footerCopy: {
    fontSize: 13,
    color: '#444',
  },
};
