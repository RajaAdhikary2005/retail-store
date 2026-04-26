import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface BulkUploadProps {
  type: 'products' | 'customers' | 'orders';
  onClose: () => void;
  onSuccess: () => void;
  onUpload: (data: any[]) => Promise<void>;
}

export default function BulkUpload({ type, onClose, onSuccess, onUpload }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const parseCSV = (text: string) => {
    // Basic CSV parser
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('File must contain a header row and at least one data row.');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const rowStr = lines[i];
      // Regex to split by comma, ignoring commas inside double quotes
      const match = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const cols = match ? match.map(c => c.replace(/^"|"$/g, '').trim()) : rowStr.split(',').map(c => c.trim());
      
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        if (cols[j] !== undefined) {
          obj[headers[j]] = cols[j];
        }
      }
      data.push(obj);
    }
    return data;
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    try {
      const text = await file.text();
      const data = parseCSV(text);
      if (data.length === 0) throw new Error('No data found in file.');
      
      await onUpload(data);
      setSuccessMsg(`Successfully uploaded ${data.length} records!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to parse and upload file. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3>Mass Entry: Upload {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
          <button className="btn btn-icon btn-secondary btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Please upload a valid CSV file. Ensure the headers match the standard export format for {type}.
          </p>
          
          <div 
            style={{ 
              border: '2px dashed var(--border-color)', borderRadius: 8, padding: 30, 
              textAlign: 'center', cursor: 'pointer', background: 'var(--bg-primary)',
              transition: 'all 0.2s'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <Upload size={32} style={{ color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
            {file ? (
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Click to browse</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CSV files only</div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 6, background: 'var(--accent-red-light)', color: 'var(--accent-red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMsg && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 6, background: 'var(--accent-green-light)', color: 'var(--accent-green)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpload} disabled={!file || loading}>
              {loading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
