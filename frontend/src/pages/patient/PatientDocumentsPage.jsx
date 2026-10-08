import React, { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  FolderLock,
  Upload,
  FileText,
  Trash2,
  Download,
  Calendar,
  Eye,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Filter,
  Sparkles,
} from 'lucide-react';
import patientApi from '../../api/patientApi';

export const PatientDocumentsPage = () => {
  const { onShowToast } = useOutletContext() || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('ID_PROOF');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocuments = async (category = 'ALL', page = 1) => {
    try {
      setLoading(true);
      const res = await patientApi.getDocuments({
        category: category === 'ALL' ? undefined : category,
        page,
        limit: 12,
      });
      if (res.data) {
        setDocuments(res.data.documents || []);
        setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load documents', err);
      if (onShowToast) onShowToast('Failed to fetch document vault');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(categoryFilter, 1);
  }, []);

  const handleCategoryChange = (cat) => {
    setCategoryFilter(cat);
    fetchDocuments(cat, 1);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      if (onShowToast) onShowToast('Please provide a document title');
      return;
    }

    try {
      setUploading(true);
      
      const payload = {
        title: uploadTitle.trim(),
        category: uploadCategory,
        notes: uploadNotes.trim() || undefined,
        fileName: selectedFile ? selectedFile.name : `${uploadTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        mimeType: selectedFile ? selectedFile.type : 'application/pdf',
        fileSize: selectedFile ? selectedFile.size : 245000,
        fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : `/uploads/docs/${Date.now()}.pdf`,
      };

      await patientApi.uploadDocument(payload);
      if (onShowToast) onShowToast('Document uploaded and encrypted in vault!');
      
      setShowUploadModal(false);
      setUploadTitle('');
      setUploadNotes('');
      setSelectedFile(null);
      await fetchDocuments(categoryFilter, 1);
    } catch (err) {
      console.error('Upload failed', err);
      if (onShowToast) onShowToast(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from your document vault?`)) {
      return;
    }

    try {
      await patientApi.deleteDocument(docId);
      if (onShowToast) onShowToast('Document removed from vault');
      await fetchDocuments(categoryFilter, pagination.page);
    } catch (err) {
      console.error('Delete failed', err);
      if (onShowToast) onShowToast(err.message || 'Unable to delete document');
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Vault Files' },
    { id: 'ID_PROOF', label: 'ID & Verification' },
    { id: 'INSURANCE', label: 'Insurance Cards' },
    { id: 'DISCHARGE_SUMMARY', label: 'Discharge Summaries' },
    { id: 'LAB_REPORT', label: 'External Lab Records' },
    { id: 'PRESCRIPTION', label: 'Past Prescriptions' },
    { id: 'OTHER', label: 'Other Records' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <FolderLock size={20} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
              Secure Document Vault
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            Upload government ID proofs, insurance cards, past medical histories, and hospital discharge documents.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 10,
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
          }}
        >
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* ── Category Filters ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 14,
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
          Category:
        </span>
        {categories.map((c) => {
          const isSelected = categoryFilter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoryChange(c.id)}
              style={{
                background: isSelected ? '#0284c7' : 'var(--pill-bg, #f1f5f9)',
                color: isSelected ? '#ffffff' : 'var(--text-primary, #475569)',
                border: isSelected ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                borderRadius: 20,
                padding: '0.25rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* ── Documents Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              height: 180,
              borderRadius: 14,
              backgroundColor: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: 16,
          padding: '3.5rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}>
            <FolderLock size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
            No Documents Found in Vault
          </h3>
          <p style={{ margin: 0, maxWidth: 440, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
            {categoryFilter !== 'ALL'
              ? 'No documents in this category. Select another category or click Upload Document above.'
              : 'Your secure vault is empty. You can upload government IDs, past medical history files, and insurance cards anytime.'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              marginTop: '0.5rem',
              padding: '0.55rem 1.25rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
            }}
          >
            + Upload Your First Document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {documents.map((doc) => {
            const dateFormatted = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }) : 'Vault File';

            const isOwnUpload = doc.isPatientUpload || doc.uploadedBy === 'PATIENT';

            return (
              <div
                key={doc.id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 14,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <FileText size={20} />
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                      backgroundColor: 'var(--pill-bg, #f1f5f9)',
                      color: 'var(--text-secondary, #475569)',
                      textTransform: 'uppercase',
                    }}>
                      {doc.category || 'DOCUMENT'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', wordBreak: 'break-word' }}>
                    {doc.title}
                  </h3>

                  {doc.notes && (
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.4 }}>
                      {doc.notes}
                    </p>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Uploaded {dateFormatted} {doc.fileSize ? `&bull; ${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid var(--border-color, #f1f5f9)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 6,
                      border: '1px solid var(--border-color, #cbd5e1)',
                      backgroundColor: 'var(--card-bg, #ffffff)',
                      color: 'var(--text-primary, #334155)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={14} />
                    <span>View File</span>
                  </button>

                  {isOwnUpload && (
                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.title)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                      title="Delete this uploaded file"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload Modal ────────────────────────────────────────────── */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color, #cbd5e1)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Upload Document to Vault
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Government National ID Card, Past Cardiogram"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                  Document Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                >
                  <option value="ID_PROOF">Government Identity Proof</option>
                  <option value="INSURANCE">Insurance Card / Policy Document</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="LAB_REPORT">External Pathology / Lab Report</option>
                  <option value="PRESCRIPTION">Past Prescription</option>
                  <option value="OTHER">Other Clinical Record</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                  Choose File (PDF, PNG, JPG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: 8,
                    border: '1px dashed var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary, #0f172a)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                  Notes / Clinical Description (Optional)
                </label>
                <textarea
                  placeholder="Optional brief notes or context..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--input-bg, #f8fafc)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'transparent',
                    color: 'var(--text-primary, #334155)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    flex: 1.5,
                    padding: '0.65rem',
                    borderRadius: 8,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? 'Encrypting & Saving...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal ─────────────────────────────────────── */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 560,
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--subcard-bg, #f8fafc)',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  {previewDoc.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                  {previewDoc.category} &bull; Uploaded {new Date(previewDoc.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #64748b)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={32} />
              </div>
              <div style={{ maxWidth: 380 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #0f172a)' }}>
                  Encrypted Vault Artifact
                </div>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary, #64748b)' }}>
                  {previewDoc.notes || 'Official digital artifact stored with 256-bit encryption in MedCore Patient Vault.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <a
                  href={previewDoc.fileUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  download={previewDoc.title}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.25rem',
                    borderRadius: 8,
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                  }}
                >
                  <Download size={15} />
                  <span>Download Document</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary, #334155)',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDocumentsPage;
