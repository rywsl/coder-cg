package coderd_test

import (
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/coder/coder/v2/agent/agenttest"
	"github.com/coder/coder/v2/coderd/coderdtest"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/provisionersdk/proto"
	"github.com/coder/coder/v2/testutil"
)

func TestWorkspacePublicPortAPI(t *testing.T) {
	t.Parallel()
	ctx := testutil.Context(t, testutil.WaitLong)
	values := coderdtest.DeploymentValues(t)
	require.NoError(t, values.WorkspacePublicPortsEnabled.Set("true"))
	admin, _, api := coderdtest.NewWithAPI(t, &coderdtest.Options{DeploymentValues: values})
	first := coderdtest.CreateFirstUser(t, admin)
	owner, user := coderdtest.CreateAnotherUser(t, admin, first.OrganizationID)
	denied, _ := coderdtest.CreateAnotherUser(t, admin, first.OrganizationID)
	build := dbfake.WorkspaceBuild(t, api.Database, database.WorkspaceTable{OrganizationID: first.OrganizationID, OwnerID: user.ID}).WithAgent(func(agents []*proto.Agent) []*proto.Agent { agents[0].OperatingSystem = "linux"; return agents }).Do()
	listener, err := net.Listen("tcp6", "[::1]:0")
	require.NoError(t, err)
	service := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, "workspace:"+r.URL.RequestURI())
	}))
	service.Listener = listener
	service.Start()
	t.Cleanup(service.Close)
	_, remote, err := net.SplitHostPort(listener.Addr().String())
	require.NoError(t, err)
	port, err := strconv.ParseInt(remote, 10, 32)
	require.NoError(t, err)
	_ = agenttest.New(t, admin.URL, build.AgentToken)
	coderdtest.NewWorkspaceAgentWaiter(t, owner, build.Workspace.ID).WaitFor(coderdtest.AgentsReady)
	agent := build.Agents[0]
	setWorkspaceSSHAgentState(t, api.Database, agent.ID, "/home/coder", workspaceSSHAgentState{connected: true, ready: true})
	require.EventuallyWithT(t, func(c *assert.CollectT) {
		ports, err := owner.WorkspaceAgentListeningPorts(ctx, agent.ID)
		if !assert.NoError(c, err) {
			return
		}
		found := false
		for _, p := range ports.Ports {
			if int64(p.Port) == port {
				found = true
			}
		}
		assert.True(c, found)
	}, testutil.WaitLong, testutil.IntervalFast)
	request := codersdk.CreateWorkspacePublicPortMappingRequest{AgentName: agent.Name, Protocol: "http", ShareLevel: "public"}
	if port >= 1 && port <= 65535 {
		request.RemotePort = int32(port)
	}
	require.NotZero(t, request.RemotePort)
	checkError := func(err error, status int) {
		t.Helper()
		var sdkErr *codersdk.Error
		require.ErrorAs(t, err, &sdkErr)
		require.Equal(t, status, sdkErr.StatusCode())
	}
	_, err = denied.CreateWorkspacePublicPortMapping(ctx, build.Workspace.ID, request)
	checkError(err, http.StatusNotFound)
	invalid := request
	invalid.ShareLevel = ""
	_, err = owner.CreateWorkspacePublicPortMapping(ctx, build.Workspace.ID, invalid)
	checkError(err, http.StatusBadRequest)
	invalid = request
	invalid.RemotePort = 2222
	_, err = owner.CreateWorkspacePublicPortMapping(ctx, build.Workspace.ID, invalid)
	checkError(err, http.StatusBadRequest)
	row, err := owner.CreateWorkspacePublicPortMapping(ctx, build.Workspace.ID, request)
	require.NoError(t, err)
	require.Equal(t, first.OrganizationID, row.OrganizationID)
	require.Equal(t, "public", row.ShareLevel)
	publicURL := "http://127.0.0.1:" + strconv.Itoa(int(row.PublicPort)) + "/assets/app.js?q=1"
	httpClient := &http.Client{Timeout: 5 * time.Second}
	get, err := http.NewRequestWithContext(ctx, http.MethodGet, publicURL, nil)
	require.NoError(t, err)
	response, err := httpClient.Do(get.Clone(ctx))
	require.NoError(t, err)
	body, err := io.ReadAll(response.Body)
	_ = response.Body.Close()
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, response.StatusCode)
	require.Equal(t, "workspace:/assets/app.js?q=1", string(body))
	_, err = owner.CreateWorkspacePublicPortMapping(ctx, build.Workspace.ID, request)
	checkError(err, http.StatusConflict)
	browserOnly := func(http.ResponseWriter) bool { return true }
	api.WorkspaceClientCoordinateOverride.Store(&browserOnly)
	response, err = httpClient.Do(get.Clone(ctx))
	if err == nil {
		_ = response.Body.Close()
		require.Equal(t, http.StatusServiceUnavailable, response.StatusCode)
	}
	_, err = owner.CreateWorkspacePublicPortMapping(ctx, build.Workspace.ID, request)
	checkError(err, http.StatusConflict)
	require.NoError(t, owner.DeleteWorkspacePublicPortMapping(ctx, build.Workspace.ID, row.ID))
	api.WorkspaceClientCoordinateOverride.Store(nil)
	response, err = httpClient.Do(get.Clone(ctx))
	if response != nil {
		_ = response.Body.Close()
	}
	require.Error(t, err)
	list, err := owner.GetWorkspacePublicPortMappings(ctx, build.Workspace.ID)
	require.NoError(t, err)
	require.Empty(t, list.Mappings)
}
