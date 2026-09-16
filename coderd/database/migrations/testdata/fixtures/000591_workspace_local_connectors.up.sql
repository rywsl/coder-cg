INSERT INTO workspace_local_connectors (
    id, organization_id, user_id, workspace_ssh_key_id, token_hash, name,
    desired, revision, reported, created_at, last_seen_at
) VALUES (
    '59100001-0000-4000-8000-000000000001',
    'bb640d07-ca8a-4869-b6bc-ae61ebb2fda1',
    '30095c71-380b-457a-8995-97b8ee6e5307',
    '59000001-0000-4000-8000-000000000001',
    decode(repeat('03', 32), 'hex'),
    '本地开发设备',
    '[]'::jsonb,
    1,
    '[]'::jsonb,
    '2026-09-16 10:00:00+00',
    '2026-09-16 10:01:00+00'
);
