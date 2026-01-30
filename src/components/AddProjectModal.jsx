// Add Project Modal Component
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createProject, updateProject, TOOLS, CATEGORIES } from '../lib/firestore';
import { uploadProjectImage } from '../lib/firebase';

export default function AddProjectModal({ onClose, onProjectAdded }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    demoUrl: '',
    githubUrl: '',
    tool: '',
    category: '',
    tags: ''
  });
  
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setError('');
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError('Project title is required');
      return;
    }
    
    if (!formData.tool) {
      setError('Please select a tool');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    setIsLoading(true);
    setUploadProgress(10);
    
    try {
      // Prepare project data
      const projectData = {
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        demoUrl: formData.demoUrl.trim(),
        githubUrl: formData.githubUrl.trim(),
        tool: formData.tool,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        thumbnailUrl: ''
      };

      setUploadProgress(30);

      // Create project in Firestore first to get the ID
      const newProject = await createProject(user.uid, projectData);
      
      setUploadProgress(50);

      // Upload thumbnail if provided
      if (thumbnail) {
        try {
          const thumbnailUrl = await uploadProjectImage(user.uid, newProject.id, thumbnail, 0);
          
          // Update project with thumbnail URL
          await updateProject(newProject.id, { thumbnailUrl });
          newProject.thumbnailUrl = thumbnailUrl;
          
          setUploadProgress(90);
        } catch (uploadError) {
          console.error('Error uploading thumbnail:', uploadError);
          // Project was created but thumbnail failed - still notify parent
        }
      }

      setUploadProgress(100);
      
      // Notify parent component
      onProjectAdded(newProject);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Add New Project</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Thumbnail Upload */}
          <div style={styles.thumbnailSection}>
            <label style={styles.label}>Project Thumbnail</label>
            <div 
              style={styles.thumbnailUpload}
              onClick={() => fileInputRef.current?.click()}
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" style={styles.thumbnailPreview} />
              ) : (
                <div style={styles.thumbnailPlaceholder}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Click to upload image</span>
                  <span style={styles.thumbnailHint}>PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Title */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Project Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="My Awesome Project"
              style={styles.input}
              required
            />
          </div>

          {/* Short Description */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Short Description</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="A brief one-liner about your project"
              style={styles.input}
              maxLength={100}
            />
          </div>

          {/* Full Description */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your project in detail..."
              style={styles.textarea}
              rows={4}
            />
          </div>

          {/* Tool & Category Row */}
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Built With *</label>
              <select
                name="tool"
                value={formData.tool}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select tool...</option>
                {TOOLS.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select category...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* URLs Row */}
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Demo URL</label>
              <input
                type="url"
                name="demoUrl"
                value={formData.demoUrl}
                onChange={handleChange}
                placeholder="https://myproject.com"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>GitHub URL</label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/user/repo"
                style={styles.input}
              />
            </div>
          </div>

          {/* Tags */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="react, saas, dashboard (comma separated)"
              style={styles.input}
            />
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
            </div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button 
              type="button" 
              style={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
    overflowY: 'auto',
  },
  modal: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    fontFamily: '"Outfit", sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px',
    borderBottom: '1px solid #222',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    fontFamily: '"Space Grotesk", sans-serif',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: 4,
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '12px 32px',
    fontSize: 14,
  },
  form: {
    padding: '24px 32px 32px',
  },
  thumbnailSection: {
    marginBottom: 24,
  },
  thumbnailUpload: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    border: '2px dashed #333',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s ease',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#666',
    fontSize: 14,
  },
  thumbnailHint: {
    fontSize: 12,
    color: '#444',
  },
  inputGroup: {
    marginBottom: 20,
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 15,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 15,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 100,
  },
  select: {
    width: '100%',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 15,
    color: '#fff',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    gap: 16,
  },
  progressBar: {
    height: 4,
    background: '#222',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#3B82F6',
    transition: 'width 0.3s ease',
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    padding: '12px 24px',
    borderRadius: 10,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  submitBtn: {
    background: '#3B82F6',
    border: 'none',
    color: '#fff',
    padding: '12px 32px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
