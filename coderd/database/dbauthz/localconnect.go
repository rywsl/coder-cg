package dbauthz

import (
	"context"

	"github.com/google/uuid"

	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/rbac"
	"github.com/coder/coder/v2/coderd/rbac/policy"
)

// Device credentials are deliberately not accepted as general API sessions.
// The feature endpoints establish identity and authorize each workspace first.
func (q *querier) InsertWorkspaceLocalConnector(ctx context.Context, arg database.InsertWorkspaceLocalConnectorParams) (database.WorkspaceLocalConnector, error) {
	if err := q.authorizeContext(ctx, policy.ActionCreate, rbac.ResourceSystem); err != nil {
		return database.WorkspaceLocalConnector{}, err
	}
	return q.db.InsertWorkspaceLocalConnector(ctx, arg)
}

func (q *querier) GetWorkspaceLocalConnectorByID(ctx context.Context, id uuid.UUID) (database.WorkspaceLocalConnector, error) {
	if err := q.authorizeContext(ctx, policy.ActionRead, rbac.ResourceSystem); err != nil {
		return database.WorkspaceLocalConnector{}, err
	}
	return q.db.GetWorkspaceLocalConnectorByID(ctx, id)
}

func (q *querier) GetWorkspaceLocalConnectorsByOwner(ctx context.Context, arg database.GetWorkspaceLocalConnectorsByOwnerParams) ([]database.WorkspaceLocalConnector, error) {
	if err := q.authorizeContext(ctx, policy.ActionRead, rbac.ResourceSystem); err != nil {
		return nil, err
	}
	return q.db.GetWorkspaceLocalConnectorsByOwner(ctx, arg)
}

func (q *querier) UpdateWorkspaceLocalConnectorDesired(ctx context.Context, arg database.UpdateWorkspaceLocalConnectorDesiredParams) (database.WorkspaceLocalConnector, error) {
	if err := q.authorizeContext(ctx, policy.ActionUpdate, rbac.ResourceSystem); err != nil {
		return database.WorkspaceLocalConnector{}, err
	}
	return q.db.UpdateWorkspaceLocalConnectorDesired(ctx, arg)
}

func (q *querier) UpdateWorkspaceLocalConnectorReported(ctx context.Context, arg database.UpdateWorkspaceLocalConnectorReportedParams) (database.WorkspaceLocalConnector, error) {
	if err := q.authorizeContext(ctx, policy.ActionUpdate, rbac.ResourceSystem); err != nil {
		return database.WorkspaceLocalConnector{}, err
	}
	return q.db.UpdateWorkspaceLocalConnectorReported(ctx, arg)
}
