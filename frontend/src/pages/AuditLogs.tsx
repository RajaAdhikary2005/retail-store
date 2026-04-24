import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Info, Shield, Edit, Trash2, Plus, LogIn, LogOut, Settings, Clock } from 'lucide-react';
import { fetchAuditLogs, type LogEntry } from '../services/api';

const ICONS: Record<string, React.ReactNode> = {
  Edit: <Edit size={14} />,
  Trash2: <Trash2 size={14} />,
  LogIn: <LogIn size={14} />,
  Plus: <Plus size={14} />,
  Shield: <Shield size={14} />,
  Settings: <Settings size={14} />,
  FileText: <FileText size={14} />,
  LogOut: <LogOut size={14} />
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAuditLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return { color: 'var(--accent-red)', bg: 'var(--accent-red-light)' };
      case 'warning': return { color: 'var(--accent-orange)', bg: 'var(--accent-orange-light)' };
      default: return { color: 'var(--accent-blue)', bg: 'var(--accent-blue-light)' };
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Audit Logs</h2>
        <p>Real-time security and operational trail of all system actions.</p>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>Loading system logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No logs found. Actions will appear here as you use the system.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.user}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ICONS[log.iconStr] || <FileText size={14} />}
                        {log.action}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{log.target}</td>
                    <td>
                      <span className="badge" style={{ 
                        background: getSeverityStyle(log.severity).bg, 
                        color: getSeverityStyle(log.severity).color,
                        textTransform: 'capitalize'
                      }}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
