INSERT INTO workspace_ssh_keys (
    id, user_id, organization_id, device_name, public_key, fingerprint,
    created_at, last_used_at
) VALUES (
    '59000001-0000-4000-8000-000000000001',
    '30095c71-380b-457a-8995-97b8ee6e5307',
    'bb640d07-ca8a-4869-b6bc-ae61ebb2fda1',
    '开发设备',
    'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1Ea',
    'SHA256:bbXpuKG6zhzdmnxq256TlqzFBzRl2f6OOg722cYNbU8',
    '2026-09-01 10:00:00+00',
    '2026-09-01 10:02:00+00'
);

INSERT INTO workspace_ssh_key_enrollments (
    id, token_hash, user_id, organization_id, workspace_agent_id, locale,
    created_at, expires_at, consumed_at, workspace_ssh_key_id
) VALUES (
    '59000002-0000-4000-8000-000000000001',
    decode(repeat('01', 32), 'hex'),
    '30095c71-380b-457a-8995-97b8ee6e5307',
    'bb640d07-ca8a-4869-b6bc-ae61ebb2fda1',
    '45e89705-e09d-4850-bcec-f9a937f5d78d',
    'zh-CN',
    '2026-09-01 10:00:00+00',
    '2026-09-01 10:10:00+00',
    '2026-09-01 10:01:00+00',
    '59000001-0000-4000-8000-000000000001'
), (
    '59000002-0000-4000-8000-000000000002',
    decode(repeat('02', 32), 'hex'),
    '30095c71-380b-457a-8995-97b8ee6e5307',
    'bb640d07-ca8a-4869-b6bc-ae61ebb2fda1',
    '45e89705-e09d-4850-bcec-f9a937f5d78d',
    'en',
    '2026-09-01 11:00:00+00',
    '2026-09-01 11:10:00+00',
    NULL,
    NULL
);
