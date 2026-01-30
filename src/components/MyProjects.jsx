// My Projects Page Component
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProjectsByUser, deleteProject, TOOLS, CATEGORIES } from '../lib/firestore';
import AddProjectModal from './AddProjectModal';

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

export default function MyProjects({ onBack }) {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const userProjects = await getProjectsByUser(user.uid, true);
        setProjects(userProjects);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject(projectId, user.uid);
      setProjects(projects.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleProjectAdded = (newProject) => {
    setProjects([newProject, ...projects]);
    setShowAddProject(false);
  };

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
        <h1 style={styles.title}>My Projects</h1>
        <button style={styles.addBtn} onClick={() => setShowAddProject(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Project
        </button>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{projects.length}</span>
          <span style={styles.statLabel}>Projects</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>
            {projects.reduce((sum, p) => sum + (p.likes || 0), 0)}
          </span>
          <span style={styles.statLabel}>Total Likes</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>
            {projects.reduce((sum, p) => sum + (p.views || 0), 0)}
          </span>
          <span style={styles.statLabel}>Total Views</span>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <p>Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 style={styles.emptyTitle}>No projects yet</h2>
          <p style={styles.emptyText}>
            Start showcasing your vibecoded projects to the world!
          </p>
          <button style={styles.emptyBtn} onClick={() => setShowAddProject(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Your First Project
          </button>
        </div>
      ) : (
        <div style={styles.projectsGrid}>
          {projects.map((project) => (
            <div key={project.id} style={styles.projectCard}>
              {/* Thumbnail */}
              <div style={styles.projectThumbnail}>
                {project.thumbnailUrl ? (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.title} 
                    style={styles.thumbnailImg}
                  />
                ) : (
                  <div style={styles.thumbnailPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                {/* Tool Badge */}
                <div style={{
                  ...styles.toolBadge,
                  backgroundColor: toolColors[project.tool] || '#888'
                }}>
                  {project.tool}
                </div>
                {/* Status Badge */}
                {!project.isPublished && (
                  <div style={styles.draftBadge}>Draft</div>
                )}
              </div>

              {/* Content */}
              <div style={styles.projectContent}>
                <h3 style={styles.projectTitle}>{project.title}</h3>
                <p style={styles.projectDesc}>
                  {project.shortDescription || project.description?.substring(0, 80) + '...' || 'No description'}
                </p>
                
                {/* Stats */}
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
                  <span style={styles.projectCategory}>{project.category}</span>
                </div>

                {/* Actions */}
                <div style={styles.projectActions}>
                  {project.demoUrl && (
                    <a 
                      href={project.demoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={styles.actionBtn}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Visit
                    </a>
                  )}
                  <button 
                    style={styles.actionBtnDanger}
                    onClick={() => setDeleteConfirm(project.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Project?</h3>
            <p style={styles.confirmText}>
              This action cannot be undone. The project and all its data will be permanently deleted.
            </p>
            <div style={styles.confirmActions}>
              <button 
                style={styles.cancelBtn}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.deleteBtn}
                onClick={() => handleDeleteProject(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <AddProjectModal 
          onClose={() => setShowAddProject(false)}
          onProjectAdded={handleProjectAdded}
        />
      )}

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
    maxWidth: 1200,
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  statsBar: {
    display: 'flex',
    gap: 40,
    justifyContent: 'center',
    marginBottom: 40,
    padding: '20px 0',
    borderTop: '1px solid #1a1a1a',
    borderBottom: '1px solid #1a1a1a',
    maxWidth: 1200,
    margin: '0 auto 40px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: 60,
    color: '#666',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 12,
    fontFamily: '"Space Grotesk", sans-serif',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  emptyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 24,
    maxWidth: 1200,
    margin: '0 auto',
  },
  projectCard: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    transition: 'border-color 0.2s ease',
  },
  projectThumbnail: {
    position: 'relative',
    height: 180,
    background: '#0a0a0a',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
  },
  toolBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },
  draftBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: '#333',
    color: '#888',
  },
  projectContent: {
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
  },
  projectStats: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  projectStat: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#666',
  },
  projectCategory: {
    fontSize: 12,
    color: '#666',
    background: '#1a1a1a',
    padding: '4px 10px',
    borderRadius: 100,
    marginLeft: 'auto',
  },
  projectActions: {
    display: 'flex',
    gap: 10,
    borderTop: '1px solid #1a1a1a',
    paddingTop: 16,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'none',
  },
  actionBtnDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginLeft: 'auto',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmModal: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    textAlign: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    lineHeight: 1.5,
  },
  confirmActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    padding: '10px 24px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  deleteBtn: {
    background: '#ef4444',
    border: 'none',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
