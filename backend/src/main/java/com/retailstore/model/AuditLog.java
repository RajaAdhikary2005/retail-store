package com.retailstore.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String user;
    private String action;
    private String target;
    private String severity; // info, warning, critical
    private String iconStr;
    private LocalDateTime timestamp;

    public AuditLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getIconStr() { return iconStr; }
    public void setIconStr(String iconStr) { this.iconStr = iconStr; }
    public LocalDateTime getTimestamp() { return timestamp; }

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
