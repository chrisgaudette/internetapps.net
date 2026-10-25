CREATE TABLE request_logs (
    id TEXT PRIMARY KEY NOT NULL,
    recorded_at TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status INTEGER NOT NULL,
    client_ip TEXT,
    ip_sources TEXT NOT NULL,
    cf_context TEXT NOT NULL,
    user_agent TEXT,
    content_type TEXT,
    content_length TEXT
);

CREATE INDEX request_logs_recorded_at_idx ON request_logs (recorded_at DESC);
