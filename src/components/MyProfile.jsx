// My Profile Page Component - View and Edit Profile
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, isHandleAvailable, TOOLS } from '../lib/firestore';
import { uploadAvatar } from '../lib/firebase';

export default function MyProfile({ onBack }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [formData, setFormData] = useState({
    displayName: '',
    handle: '',
    bio: '',
    tagline: '',
    website: '',
    tools: [],
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
      youtube: ''
    }
  });

  // Load current profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        handle: userProfile.handle || '',
        bio: userProfile.bio || '',
        tagline: userProfile.tagline || '',
        website: userProfile.website || '',
        tools: userProfile.tools || [],
        socialLinks: {
          twitter: userProfile.socialLinks?.twitter || '',
          github: userProfile.socialLinks?.github || '',
          linkedin: userProfile.socialLinks?.linkedin || '',
          youtube: userProfile.socialLinks?.youtube || ''
        }
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToolToggle = (tool) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Validate handle if changed
      if (formData.handle && formData.handle !== userProfile?.handle) {
        const handleAvailable = await isHandleAvailable(formData.handle);
        if (!handleAvailable) {
          setError('This handle is already taken');
          setIsLoading(false);
          return;
        }
      }

      // Upload avatar if changed
      let photoURL = userProfile?.photoURL || '';
      if (avatarFile) {
        photoURL = await uploadAvatar(user.uid, avatarFile);
      }

      // Update profile
      await updateUserProfile(user.uid, {
        ...formData,
        photoURL,
        isProfileComplete: !!(formData.displayName && formData.handle)
      });

      await refreshProfile();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    }

    setIsLoading(false);
  };

  const currentAvatar = avatarPreview || userProfile?.photoURL || user?.photoURL;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h1 style={styles.title}>My Profile</h1>
        <div style={styles.headerActions}>
          {isEditing ? (
            <>
              <button 
                style={styles.cancelBtn} 
                onClick={() => {
                  setIsEditing(false);
                  setAvatarPreview(null);
                  setAvatarFile(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                style={styles.saveBtn} 
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button style={styles.editBtn} onClick={() => setIsEditing(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div style={styles.errorMsg}>{error}</div>}
      {success && <div style={styles.successMsg}>{success}</div>}

      {/* Profile Content */}
      <div style={styles.content}>
        {/* Left Column - Avatar & Stats */}
        <div style={styles.leftColumn}>
          {/* Avatar */}
          <div style={styles.avatarSection}>
            <div 
              style={{
                ...styles.avatarContainer,
                cursor: isEditing ? 'pointer' : 'default'
              }}
              onClick={() => isEditing && fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                if (isEditing) {
                  e.currentTarget.querySelector('.overlay').style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (isEditing) {
                  e.currentTarget.querySelector('.overlay').style.opacity = '0';
                }
              }}
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" style={styles.avatar} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {formData.displayName?.[0] || user?.email?.[0] || '?'}
                </div>
              )}
              {isEditing && (
                <div className="overlay" style={styles.avatarOverlay}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Change</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Stats */}
          <div style={styles.statsCard}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{userProfile?.projectCount || 0}</span>
              <span style={styles.statLabel}>Projects</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{userProfile?.followerCount || 0}</span>
              <span style={styles.statLabel}>Followers</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{userProfile?.totalLikes || 0}</span>
              <span style={styles.statLabel}>Likes</span>
            </div>
          </div>

          {/* Profile URL */}
          {formData.handle && (
            <div style={styles.profileUrl}>
              <span style={styles.urlLabel}>Your Profile URL</span>
              <div style={styles.urlBox}>
                wholspace.com/@{formData.handle}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Form */}
        <div style={styles.rightColumn}>
          {/* Basic Info */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Display Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Your name"
                  style={styles.input}
                />
              ) : (
                <p style={styles.value}>{formData.displayName || '—'}</p>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Handle / Username</label>
              {isEditing ? (
                <div style={styles.handleInput}>
                  <span style={styles.handlePrefix}>@</span>
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setFormData(prev => ({ ...prev, handle: val }));
                    }}
                    placeholder="yourhandle"
                    style={styles.inputWithPrefix}
                  />
                </div>
              ) : (
                <p style={styles.value}>@{formData.handle || '—'}</p>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Tagline</label>
              {isEditing ? (
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="Building the future with AI"
                  style={styles.input}
                  maxLength={60}
                />
              ) : (
                <p style={styles.value}>{formData.tagline || '—'}</p>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  style={styles.textarea}
                  rows={4}
                />
              ) : (
                <p style={styles.value}>{formData.bio || '—'}</p>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Website</label>
              {isEditing ? (
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  style={styles.input}
                />
              ) : (
                <p style={styles.value}>
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      {formData.website}
                    </a>
                  ) : '—'}
                </p>
              )}
            </div>
          </div>

          {/* Tools */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Tools You Use</h3>
            <p style={styles.sectionDesc}>Select the AI tools you build with</p>
            
            <div style={styles.toolsGrid}>
              {TOOLS.map(tool => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => isEditing && handleToolToggle(tool)}
                  disabled={!isEditing}
                  style={{
                    ...styles.toolBtn,
                    ...(formData.tools.includes(tool) ? styles.toolBtnActive : {}),
                    cursor: isEditing ? 'pointer' : 'default',
                    opacity: isEditing ? 1 : (formData.tools.includes(tool) ? 1 : 0.4)
                  }}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Social Links</h3>
            
            <div style={styles.socialGrid}>
              {[
                { key: 'twitter', label: 'Twitter / X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { key: 'github', label: 'GitHub', icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z' },
                { key: 'linkedin', label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                { key: 'youtube', label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' }
              ].map(social => (
                <div key={social.key} style={styles.inputGroup}>
                  <label style={styles.label}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
                      <path d={social.icon}/>
                    </svg>
                    {social.label}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name={`social_${social.key}`}
                      value={formData.socialLinks[social.key]}
                      onChange={handleChange}
                      placeholder="username"
                      style={styles.input}
                    />
                  ) : (
                    <p style={styles.value}>{formData.socialLinks[social.key] || '—'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email (read-only) */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Account</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <p style={styles.value}>{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: '"Outfit", sans-serif',
    padding: '40px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    maxWidth: 1000,
    margin: '0 auto 40px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  headerActions: {
    display: 'flex',
    gap: 12,
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    background: '#22c55e',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorMsg: {
    maxWidth: 1000,
    margin: '0 auto 20px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 14,
  },
  successMsg: {
    maxWidth: 1000,
    margin: '0 auto 20px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 14,
  },
  content: {
    display: 'flex',
    gap: 40,
    maxWidth: 1000,
    margin: '0 auto',
  },
  leftColumn: {
    width: 260,
    flexShrink: 0,
  },
  rightColumn: {
    flex: 1,
  },
  avatarSection: {
    marginBottom: 24,
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: '50%',
    overflow: 'hidden',
    margin: '0 auto',
    position: 'relative',
    border: '4px solid #222',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 56,
    fontWeight: 700,
    color: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    color: '#fff',
    fontSize: 12,
  },
  statsCard: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  profileUrl: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    padding: 16,
  },
  urlLabel: {
    display: 'block',
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  urlBox: {
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#3B82F6',
  },
  section: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 15,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 15,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 100,
  },
  value: {
    fontSize: 15,
    color: '#ccc',
    margin: 0,
  },
  link: {
    color: '#3B82F6',
    textDecoration: 'none',
  },
  handleInput: {
    display: 'flex',
    alignItems: 'center',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  handlePrefix: {
    padding: '12px 0 12px 16px',
    color: '#666',
    fontSize: 15,
  },
  inputWithPrefix: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '12px 16px 12px 4px',
    fontSize: 15,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
  },
  toolsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolBtn: {
    padding: '8px 16px',
    borderRadius: 100,
    border: '1px solid #333',
    background: 'transparent',
    color: '#888',
    fontSize: 13,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  toolBtnActive: {
    background: '#3B82F6',
    borderColor: '#3B82F6',
    color: '#fff',
  },
  socialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
};
