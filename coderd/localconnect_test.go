package coderd_test

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/ssh"

	"github.com/coder/coder/v2/coderd/coderdtest"
	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbfake"
	"github.com/coder/coder/v2/codersdk"
	"github.com/coder/coder/v2/provisionersdk/proto"
)

func TestLocalConnectorAuthorizationAndRevocation(t *testing.T) {
	t.Parallel()
	_, hostKey := workspaceSSHHostKey(t)
	values := coderdtest.DeploymentValues(t)
	require.NoError(t, values.WorkspaceSSHGateway.Enabled.Set("true"))
	require.NoError(t, values.WorkspaceSSHGateway.ListenAddress.Set(reserveWorkspaceSSHAddress(t)))
	require.NoError(t, values.WorkspaceSSHGateway.AdvertiseHost.Set("127.0.0.1"))
	require.NoError(t, values.WorkspaceSSHGateway.AdvertisePort.Set("2222"))
	require.NoError(t, values.WorkspaceSSHGateway.HostKeyFile.Set(hostKey))
	client, _, api := coderdtest.NewWithAPI(t, &coderdtest.Options{DeploymentValues: values, AccessURL: &url.URL{Scheme: "https", Host: "coder.example.test"}})
	owner := coderdtest.CreateFirstUser(t, client)
	other, _ := coderdtest.CreateAnotherUser(t, client, owner.OrganizationID)
	build := dbfake.WorkspaceBuild(t, api.Database, database.WorkspaceTable{OwnerID: owner.UserID, OrganizationID: owner.OrganizationID}).WithAgent(func(agents []*proto.Agent) []*proto.Agent {
		agents[0].OperatingSystem = "linux"
		return agents
	}).Do()
	agent := build.Agents[0]
	setWorkspaceSSHAgentState(t, api.Database, agent.ID, "/home/coder", workspaceSSHAgentState{connected: true, ready: true})
	request := func(client *codersdk.Client, method, path string, input, output any, code int, token string) {
		t.Helper()
		resp, err := client.Request(t.Context(), method, path, input, func(r *http.Request) {
			if token != "" {
				r.Header.Set("Authorization", "Bearer "+token)
			}
		})
		require.NoError(t, err)
		defer resp.Body.Close()
		require.Equal(t, code, resp.StatusCode)
		if output != nil {
			require.NoError(t, json.NewDecoder(resp.Body).Decode(output))
		}
	}
	var enrollment codersdk.LocalConnectorEnrollment
	request(client, http.MethodPost, fmt.Sprintf("/api/v2/workspaceagents/%s/local-connect-bootstrap", agent.ID), nil, &enrollment, http.StatusCreated, "")
	secret := make([]byte, 32)
	_, _ = rand.Read(secret)
	token := base64.RawURLEncoding.EncodeToString(secret)
	register := codersdk.LocalConnectorRegister{DeviceName: "开发电脑", PublicKey: string(ssh.MarshalAuthorizedKey(newWorkspaceSSHClientSigner(t).PublicKey())), Token: token}
	var registration codersdk.LocalConnectorRegistration
	path := "/api/v2/local-connect/enrollments/" + enrollment.EnrollmentID.String()
	request(client, http.MethodPost, path, register, &registration, http.StatusCreated, enrollment.Token)
	device := registration.Device
	require.NotEmpty(t, registration.Gateway.HostPublicKey)
	request(client, http.MethodPost, path, register, nil, http.StatusNotFound, enrollment.Token)
	var status codersdk.WorkspaceSSHEnrollmentStatusResponse
	request(client, http.MethodGet, "/api/v2/workspace-ssh/enrollments/"+enrollment.EnrollmentID.String(), nil, &status, http.StatusOK, "")
	require.Equal(t, device.WorkspaceSSHKeyID, *status.WorkspaceSSHKeyID)
	devicePath := fmt.Sprintf("/api/v2/organizations/%s/local-connectors/%s", owner.OrganizationID, device.ID)
	update := codersdk.LocalConnectorUpdate{Revision: device.Revision, Desired: []codersdk.LocalConnectorWorkspace{{WorkspaceID: build.Workspace.ID, AgentName: agent.Name, Ports: []uint16{5173}}}}
	request(other, http.MethodPut, devicePath, update, nil, http.StatusNotFound, "")
	request(client, http.MethodPut, devicePath, update, &device, http.StatusOK, "")
	request(client, http.MethodPut, devicePath, update, nil, http.StatusConflict, "")
	syncPath := "/api/v2/local-connect/devices/" + device.ID.String() + "/sync"
	var response codersdk.LocalConnectorSync
	request(client, http.MethodPost, syncPath, codersdk.LocalConnectorSyncRequest{}, nil, http.StatusNotFound, base64.RawURLEncoding.EncodeToString(make([]byte, 32)))
	request(client, http.MethodPost, syncPath, codersdk.LocalConnectorSyncRequest{}, &response, http.StatusOK, token)
	require.True(t, response.Gateway.Enabled)
	require.False(t, response.Gateway.ChatGPTDesktopAvailable)
	require.Len(t, response.Targets, 1)
	require.Equal(t, []uint16{5173}, response.Targets[0].Ports)
	report := codersdk.LocalConnectorSyncRequest{Revision: device.Revision, Reported: []codersdk.LocalConnectorPort{{WorkspaceID: build.Workspace.ID, AgentName: agent.Name, RemotePort: 5173, LocalPort: 5174, Protocol: "http"}}}
	request(client, http.MethodPost, syncPath, report, &response, http.StatusOK, token)
	var devices []codersdk.LocalConnector
	listPath := fmt.Sprintf("/api/v2/organizations/%s/local-connectors", owner.OrganizationID)
	request(client, http.MethodGet, listPath, nil, &devices, http.StatusOK, "")
	require.Len(t, devices, 1)
	require.Len(t, devices[0].Reported, 1)
	request(client, http.MethodPut, devicePath, codersdk.LocalConnectorUpdate{Revision: device.Revision, Desired: []codersdk.LocalConnectorWorkspace{}}, &device, http.StatusOK, "")
	request(client, http.MethodPost, syncPath, report, &response, http.StatusOK, token)
	request(client, http.MethodGet, listPath, nil, &devices, http.StatusOK, "")
	require.Empty(t, devices[0].Reported, "old reports must not restore a stopped mapping")
	request(other, http.MethodGet, listPath, nil, &devices, http.StatusOK, "")
	require.Empty(t, devices)
	browserOnly := func(http.ResponseWriter) bool { return true }
	api.WorkspaceClientCoordinateOverride.Store(&browserOnly)
	request(client, http.MethodPost, syncPath, report, nil, http.StatusNotFound, token)
	request(client, http.MethodPost, fmt.Sprintf("/api/v2/workspaceagents/%s/local-connect-bootstrap", agent.ID), nil, nil, http.StatusConflict, "")
	api.WorkspaceClientCoordinateOverride.Store(nil)
	require.NoError(t, client.DeleteWorkspaceSSHKey(t.Context(), owner.OrganizationID.String(), device.WorkspaceSSHKeyID))
	request(client, http.MethodPost, syncPath, codersdk.LocalConnectorSyncRequest{}, nil, http.StatusNotFound, token)
}
