package coderd

import (
	"database/sql"
	"sync"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/coderd/database/dbgen"
	"github.com/coder/coder/v2/coderd/database/dbtestutil"
	"github.com/coder/coder/v2/provisionersdk/proto"
)

func TestAllocateWorkspacePublicPort(t *testing.T) {
	t.Parallel()
	rows := make([]database.WorkspacePublicPortMapping, 0, publicPortLast-publicPortFirst)
	for port := publicPortFirst; port < publicPortLast; port++ {
		rows = append(rows, database.WorkspacePublicPortMapping{PublicPort: port})
	}
	port, ok := allocateWorkspacePublicPort(rows)
	require.True(t, ok)
	require.Equal(t, publicPortLast, port)
	rows = append(rows, database.WorkspacePublicPortMapping{PublicPort: publicPortLast})
	_, ok = allocateWorkspacePublicPort(rows)
	require.False(t, ok)
}

func TestAllocateWorkspacePublicPortConcurrentCandidates(t *testing.T) {
	t.Parallel()
	db, _, sqlDB := dbtestutil.NewDBWithSQLDB(t)
	sqlDB.SetMaxOpenConns(8)
	org := dbgen.Organization(t, db, database.Organization{})
	user := dbgen.User(t, db, database.User{})
	build := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{OrganizationID: org.ID, OwnerID: user.ID}).WithAgent(func(agents []*proto.Agent) []*proto.Agent { return agents }).Do()
	const workers = 100
	ports := make(chan int32, workers)
	ids := make(chan database.WorkspacePublicPortMapping, workers)
	errs := make(chan error, workers)
	var wg sync.WaitGroup
	for i := int32(0); i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			row, err := reserveWorkspacePublicPort(t.Context(), db, database.InsertWorkspacePublicPortMappingParams{
				OrganizationID: build.Workspace.OrganizationID, WorkspaceID: build.Workspace.ID, WorkspaceAgentID: build.Agents[0].ID,
				AgentName: build.Agents[0].Name, RemotePort: 5000 + i, Protocol: "http", CreatedBy: build.Workspace.OwnerID,
			}, nil)
			if err != nil {
				errs <- err
				return
			}
			ports <- row.PublicPort
			ids <- row
		}()
	}
	wg.Wait()
	close(ports)
	close(errs)
	for err := range errs {
		require.NoError(t, err)
	}
	seen := make(map[int32]bool)
	for port := range ports {
		require.GreaterOrEqual(t, port, publicPortFirst)
		require.LessOrEqual(t, port, publicPortLast)
		require.False(t, seen[port])
		seen[port] = true
	}
	require.Len(t, seen, workers)
	row := <-ids
	params := database.InsertWorkspacePublicPortMappingParams{OrganizationID: row.OrganizationID, WorkspaceID: row.WorkspaceID, WorkspaceAgentID: row.WorkspaceAgentID, AgentName: row.AgentName, RemotePort: 9999, Protocol: "http", CreatedBy: row.CreatedBy}
	_, err := reserveWorkspacePublicPort(t.Context(), db, params, nil)
	require.ErrorIs(t, err, errPublicPortPoolExhausted)
	require.NoError(t, db.DeleteWorkspacePublicPortMapping(t.Context(), row.ID))
	replacement, err := reserveWorkspacePublicPort(t.Context(), db, params, nil)
	require.NoError(t, err)
	require.Equal(t, row.PublicPort, replacement.PublicPort)
	_, err = reserveWorkspacePublicPort(t.Context(), db, params, nil)
	require.ErrorIs(t, err, errPublicPortDuplicate)
}

func TestAllocateWorkspacePublicPortPublicationRollback(t *testing.T) {
	t.Parallel()
	db, _ := dbtestutil.NewDB(t)
	org := dbgen.Organization(t, db, database.Organization{})
	user := dbgen.User(t, db, database.User{})
	build := dbfake.WorkspaceBuild(t, db, database.WorkspaceTable{OrganizationID: org.ID, OwnerID: user.ID}).WithAgent(func(agents []*proto.Agent) []*proto.Agent { return agents }).Do()
	params := database.InsertWorkspacePublicPortMappingParams{
		OrganizationID: org.ID, WorkspaceID: build.Workspace.ID, WorkspaceAgentID: build.Agents[0].ID,
		AgentName: build.Agents[0].Name, RemotePort: 5173, Protocol: "http", CreatedBy: user.ID,
	}
	failed := xerrors.New("ingress unavailable")
	row, err := reserveWorkspacePublicPort(t.Context(), db, params, func(row database.WorkspacePublicPortMapping) error {
		// Pending publication cannot be served by another replica.
		_, lookupErr := db.GetWorkspacePublicPortMapping(t.Context(), row.ID)
		require.ErrorIs(t, lookupErr, sql.ErrNoRows)
		return failed
	})
	require.ErrorIs(t, err, failed)
	_, err = db.GetWorkspacePublicPortMapping(t.Context(), row.ID)
	require.ErrorIs(t, err, sql.ErrNoRows)
	replacement, err := reserveWorkspacePublicPort(t.Context(), db, params, nil)
	require.NoError(t, err)
	require.Equal(t, row.PublicPort, replacement.PublicPort)
}
