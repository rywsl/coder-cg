package database_test

import (
	"database/sql"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/coderd/database/dbgen"
	"github.com/coder/coder/v2/coderd/database/dbtestutil"
	"github.com/coder/coder/v2/coderd/database/dbtime"
	"github.com/coder/coder/v2/testutil"
)

func TestWorkspaceSSHKeysOrganizationIsolationAndRevocation(t *testing.T) {
	t.Parallel()
	store, _ := dbtestutil.NewDB(t)
	ctx := testutil.Context(t, testutil.WaitMedium)
	user := dbgen.User(t, store, database.User{})
	firstOrganization := dbgen.Organization(t, store, database.Organization{})
	secondOrganization := dbgen.Organization(t, store, database.Organization{})
	now := dbtime.Now()

	firstKey, err := store.InsertWorkspaceSSHKey(ctx, database.InsertWorkspaceSSHKeyParams{
		ID:             uuid.New(),
		UserID:         user.ID,
		OrganizationID: firstOrganization.ID,
		DeviceName:     "first device",
		PublicKey:      "ssh-ed25519 first",
		Fingerprint:    "SHA256:shared-fingerprint",
		CreatedAt:      now,
	})
	require.NoError(t, err)

	_, err = store.InsertWorkspaceSSHKey(ctx, database.InsertWorkspaceSSHKeyParams{
		ID:             uuid.New(),
		UserID:         user.ID,
		OrganizationID: firstOrganization.ID,
		DeviceName:     "duplicate",
		PublicKey:      "ssh-ed25519 duplicate",
		Fingerprint:    firstKey.Fingerprint,
		CreatedAt:      now.Add(time.Second),
	})
	require.Error(t, err)
	require.True(t, database.IsUniqueViolation(err, database.UniqueWorkspaceSshKeysOrganizationIDFingerprintKey))

	secondKey, err := store.InsertWorkspaceSSHKey(ctx, database.InsertWorkspaceSSHKeyParams{
		ID:             uuid.New(),
		UserID:         user.ID,
		OrganizationID: secondOrganization.ID,
		DeviceName:     "second device",
		PublicKey:      "ssh-ed25519 second",
		Fingerprint:    firstKey.Fingerprint,
		CreatedAt:      now.Add(2 * time.Second),
	})
	require.NoError(t, err)

	keys, err := store.GetWorkspaceSSHKeysByUserAndOrganization(ctx, database.GetWorkspaceSSHKeysByUserAndOrganizationParams{
		UserID:         user.ID,
		OrganizationID: firstOrganization.ID,
	})
	require.NoError(t, err)
	require.Equal(t, []database.WorkspaceSshKey{firstKey}, keys)

	_, err = store.DeleteWorkspaceSSHKeyByID(ctx, database.DeleteWorkspaceSSHKeyByIDParams{
		ID:             firstKey.ID,
		UserID:         user.ID,
		OrganizationID: secondOrganization.ID,
	})
	require.ErrorIs(t, err, sql.ErrNoRows)

	deleted, err := store.DeleteWorkspaceSSHKeyByID(ctx, database.DeleteWorkspaceSSHKeyByIDParams{
		ID:             firstKey.ID,
		UserID:         user.ID,
		OrganizationID: firstOrganization.ID,
	})
	require.NoError(t, err)
	require.Equal(t, firstKey, deleted)

	_, err = store.GetWorkspaceSSHKeyByID(ctx, firstKey.ID)
	require.ErrorIs(t, err, sql.ErrNoRows)
	_, err = store.GetWorkspaceSSHKeyByID(ctx, secondKey.ID)
	require.NoError(t, err)
}

func TestWorkspaceSSHKeyEnrollmentExpirationAndConcurrentConsumption(t *testing.T) {
	t.Parallel()
	store, _ := dbtestutil.NewDB(t)
	ctx := testutil.Context(t, testutil.WaitMedium)
	user := dbgen.User(t, store, database.User{})
	organization := dbgen.Organization(t, store, database.Organization{})
	workspaceBuild := dbfake.WorkspaceBuild(t, store, database.WorkspaceTable{
		OrganizationID: organization.ID,
		OwnerID:        user.ID,
	}).WithAgent().Do()
	agent := workspaceBuild.Agents[0]
	now := dbtime.Now()

	expiredHash := make([]byte, 32)
	expiredHash[0] = 1
	expiredID := uuid.New()
	_, err := store.InsertWorkspaceSSHKeyEnrollment(ctx, database.InsertWorkspaceSSHKeyEnrollmentParams{
		ID:               expiredID,
		TokenHash:        expiredHash,
		UserID:           user.ID,
		OrganizationID:   organization.ID,
		WorkspaceAgentID: agent.ID,
		Locale:           "zh-CN",
		CreatedAt:        now.Add(-2 * time.Minute),
		ExpiresAt:        now.Add(-time.Minute),
	})
	require.NoError(t, err)
	err = store.InTx(func(tx database.Store) error {
		_, err := tx.GetWorkspaceSSHKeyEnrollmentForUpdate(ctx, database.GetWorkspaceSSHKeyEnrollmentForUpdateParams{
			ID:        expiredID,
			TokenHash: expiredHash,
			Now:       now,
		})
		return err
	}, nil)
	require.ErrorIs(t, err, sql.ErrNoRows)
	require.NoError(t, store.DeleteExpiredWorkspaceSSHKeyEnrollments(ctx, now))
	_, err = store.InsertWorkspaceSSHKeyEnrollment(ctx, database.InsertWorkspaceSSHKeyEnrollmentParams{
		ID:               uuid.New(),
		TokenHash:        expiredHash,
		UserID:           user.ID,
		OrganizationID:   organization.ID,
		WorkspaceAgentID: agent.ID,
		Locale:           "zh-CN",
		CreatedAt:        now,
		ExpiresAt:        now.Add(time.Minute),
	})
	require.NoError(t, err)

	activeHash := make([]byte, 32)
	activeHash[0] = 2
	active, err := store.InsertWorkspaceSSHKeyEnrollment(ctx, database.InsertWorkspaceSSHKeyEnrollmentParams{
		ID:               uuid.New(),
		TokenHash:        activeHash,
		UserID:           user.ID,
		OrganizationID:   organization.ID,
		WorkspaceAgentID: agent.ID,
		Locale:           "zh-CN",
		CreatedAt:        now,
		ExpiresAt:        now.Add(10 * time.Minute),
	})
	require.NoError(t, err)

	const consumers = 8
	start := make(chan struct{})
	keyID := uuid.New()
	type consumeResult struct {
		key uuid.NullUUID
		err error
	}
	results := make(chan consumeResult, consumers)
	var waitGroup sync.WaitGroup
	waitGroup.Add(consumers)
	for range consumers {
		go func() {
			defer waitGroup.Done()
			<-start
			var consumed database.WorkspaceSshKeyEnrollment
			consumeErr := store.InTx(func(tx database.Store) error {
				locked, err := tx.GetWorkspaceSSHKeyEnrollmentForUpdate(ctx, database.GetWorkspaceSSHKeyEnrollmentForUpdateParams{
					ID:        active.ID,
					TokenHash: activeHash,
					Now:       now,
				})
				if err != nil {
					return err
				}
				consumed, err = tx.CompleteWorkspaceSSHKeyEnrollment(ctx, database.CompleteWorkspaceSSHKeyEnrollmentParams{
					ID:                locked.ID,
					ConsumedAt:        sql.NullTime{Time: now, Valid: true},
					WorkspaceSshKeyID: uuid.NullUUID{UUID: keyID, Valid: true},
				})
				return err
			}, nil)
			results <- consumeResult{key: consumed.WorkspaceSshKeyID, err: consumeErr}
		}()
	}
	close(start)
	waitGroup.Wait()
	close(results)

	successes := 0
	for result := range results {
		if result.err == nil {
			require.Equal(t, uuid.NullUUID{UUID: keyID, Valid: true}, result.key)
			successes++
			continue
		}
		require.ErrorIs(t, result.err, sql.ErrNoRows)
	}
	require.Equal(t, 1, successes)
}

func TestWorkspaceSSHQueriesExcludeSoftDeletedAgents(t *testing.T) {
	t.Parallel()
	store, _ := dbtestutil.NewDB(t)
	ctx := testutil.Context(t, testutil.WaitMedium)
	user := dbgen.User(t, store, database.User{})
	organization := dbgen.Organization(t, store, database.Organization{})
	build := dbfake.WorkspaceBuild(t, store, database.WorkspaceTable{
		OrganizationID: organization.ID,
		OwnerID:        user.ID,
		Name:           "soft-deleted-agent-workspace",
	}).WithAgent().Do()
	agent := build.Agents[0]
	now := dbtime.Now()
	require.NoError(t, store.UpdateWorkspaceAgentStartupByID(ctx, database.UpdateWorkspaceAgentStartupByIDParams{
		ID:                agent.ID,
		Version:           "test",
		ExpandedDirectory: "/workspace",
	}))
	require.NoError(t, store.UpdateWorkspaceAgentLifecycleStateByID(ctx, database.UpdateWorkspaceAgentLifecycleStateByIDParams{
		ID:             agent.ID,
		LifecycleState: database.WorkspaceAgentLifecycleStateReady,
		StartedAt:      sql.NullTime{Time: now, Valid: true},
		ReadyAt:        sql.NullTime{Time: now, Valid: true},
	}))
	require.NoError(t, store.UpdateWorkspaceAgentConnectionByID(ctx, database.UpdateWorkspaceAgentConnectionByIDParams{
		ID:               agent.ID,
		FirstConnectedAt: sql.NullTime{Time: now, Valid: true},
		LastConnectedAt:  sql.NullTime{Time: now, Valid: true},
		UpdatedAt:        now,
	}))
	require.NoError(t, store.SoftDeletePriorWorkspaceAgents(ctx, database.SoftDeletePriorWorkspaceAgentsParams{
		WorkspaceID:    build.Workspace.ID,
		CurrentBuildID: uuid.New(),
	}))

	_, err := store.GetWorkspaceSSHGatewayTarget(ctx, database.GetWorkspaceSSHGatewayTargetParams{
		OwnerUsername: user.Username,
		WorkspaceName: build.Workspace.Name,
		AgentName:     agent.Name,
	})
	require.ErrorIs(t, err, sql.ErrNoRows)
	_, err = store.GetWorkspaceSSHBootstrapTargetByAgentID(ctx, agent.ID)
	require.ErrorIs(t, err, sql.ErrNoRows)
}
