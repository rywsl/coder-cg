package dbauthz_test

import (
	"github.com/brianvoe/gofakeit/v7"
	"go.uber.org/mock/gomock"

	"github.com/coder/coder/v2/coderd/database"
	"github.com/coder/coder/v2/coderd/database/dbmock"
	"github.com/coder/coder/v2/coderd/rbac"
	"github.com/coder/coder/v2/coderd/rbac/policy"
	"github.com/coder/coder/v2/testutil"
)

func (s *MethodTestSuite) TestWorkspacePublicPorts() {
	for _, method := range []string{"GetWorkspacePublicPortMapping", "GetWorkspacePublicPortMappingByPublicPort", "GetWorkspacePublicPortMappingByWorkspaceAgentPort", "ListWorkspacePublicPortMappings", "DeleteWorkspacePublicPortMapping"} {
		s.Run(method, s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
			workspace := testutil.Fake(s.T(), faker, database.Workspace{})
			row := testutil.Fake(s.T(), faker, database.WorkspacePublicPortMapping{})
			row.WorkspaceID, row.OrganizationID = workspace.ID, workspace.OrganizationID
			store.EXPECT().GetWorkspaceByID(gomock.Any(), workspace.ID).Return(workspace, nil).AnyTimes()
			switch method {
			case "GetWorkspacePublicPortMapping":
				store.EXPECT().GetWorkspacePublicPortMapping(gomock.Any(), row.ID).Return(row, nil).AnyTimes()
				check.Args(row.ID).Asserts(workspace, policy.ActionRead).Returns(row)
			case "GetWorkspacePublicPortMappingByPublicPort":
				store.EXPECT().GetWorkspacePublicPortMappingByPublicPort(gomock.Any(), row.PublicPort).Return(row, nil).AnyTimes()
				check.Args(row.PublicPort).Asserts(workspace, policy.ActionRead).Returns(row)
			case "GetWorkspacePublicPortMappingByWorkspaceAgentPort":
				params := database.GetWorkspacePublicPortMappingByWorkspaceAgentPortParams{WorkspaceID: workspace.ID, AgentName: row.AgentName, RemotePort: row.RemotePort}
				store.EXPECT().GetWorkspacePublicPortMappingByWorkspaceAgentPort(gomock.Any(), params).Return(row, nil).AnyTimes()
				check.Args(params).Asserts(workspace, policy.ActionRead).Returns(row)
			case "ListWorkspacePublicPortMappings":
				store.EXPECT().ListWorkspacePublicPortMappings(gomock.Any(), workspace.ID).Return([]database.WorkspacePublicPortMapping{row}, nil).AnyTimes()
				check.Args(workspace.ID).Asserts(workspace, policy.ActionRead).Returns([]database.WorkspacePublicPortMapping{row})
			case "DeleteWorkspacePublicPortMapping":
				store.EXPECT().GetWorkspacePublicPortMapping(gomock.Any(), row.ID).Return(row, nil).AnyTimes()
				store.EXPECT().DeleteWorkspacePublicPortMapping(gomock.Any(), row.ID).Return(nil).AnyTimes()
				check.Args(row.ID).Asserts(workspace, policy.ActionApplicationConnect).Returns()
			}
		}))
	}
	s.Run("ListWorkspacePublicPortMappingsAll", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		rows := []database.WorkspacePublicPortMapping{testutil.Fake(s.T(), faker, database.WorkspacePublicPortMapping{})}
		store.EXPECT().ListWorkspacePublicPortMappingsAll(gomock.Any()).Return(rows, nil).AnyTimes()
		check.Args().Asserts(rbac.ResourceSystem, policy.ActionRead).Returns(rows)
	}))
	s.Run("InsertWorkspacePublicPortMapping", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		workspace := testutil.Fake(s.T(), faker, database.Workspace{})
		agent := testutil.Fake(s.T(), faker, database.WorkspaceAgent{})
		agent.Deleted = false
		params := testutil.Fake(s.T(), faker, database.InsertWorkspacePublicPortMappingParams{})
		params.WorkspaceID, params.OrganizationID, params.WorkspaceAgentID, params.AgentName = workspace.ID, workspace.OrganizationID, agent.ID, agent.Name
		row := testutil.Fake(s.T(), faker, database.WorkspacePublicPortMapping{})
		store.EXPECT().GetWorkspaceByID(gomock.Any(), workspace.ID).Return(workspace, nil).AnyTimes()
		store.EXPECT().GetWorkspaceAgentsInLatestBuildByWorkspaceID(gomock.Any(), workspace.ID).Return([]database.WorkspaceAgent{agent}, nil).AnyTimes()
		store.EXPECT().InsertWorkspacePublicPortMapping(gomock.Any(), params).Return(row, nil).AnyTimes()
		check.Args(params).Asserts(workspace, policy.ActionApplicationConnect).Returns(row)
	}))
}
