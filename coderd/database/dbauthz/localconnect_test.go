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

func (s *MethodTestSuite) TestLocalConnectors() {
	s.Run("InsertWorkspaceLocalConnector", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		arg := testutil.Fake(s.T(), faker, database.InsertWorkspaceLocalConnectorParams{})
		row := testutil.Fake(s.T(), faker, database.WorkspaceLocalConnector{})
		store.EXPECT().InsertWorkspaceLocalConnector(gomock.Any(), arg).Return(row, nil).AnyTimes()
		check.Args(arg).Asserts(rbac.ResourceSystem, policy.ActionCreate).Returns(row)
	}))
	s.Run("GetWorkspaceLocalConnectorByID", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		row := testutil.Fake(s.T(), faker, database.WorkspaceLocalConnector{})
		store.EXPECT().GetWorkspaceLocalConnectorByID(gomock.Any(), row.ID).Return(row, nil).AnyTimes()
		check.Args(row.ID).Asserts(rbac.ResourceSystem, policy.ActionRead).Returns(row)
	}))
	s.Run("GetWorkspaceLocalConnectorsByOwner", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		arg := testutil.Fake(s.T(), faker, database.GetWorkspaceLocalConnectorsByOwnerParams{})
		rows := []database.WorkspaceLocalConnector{testutil.Fake(s.T(), faker, database.WorkspaceLocalConnector{})}
		store.EXPECT().GetWorkspaceLocalConnectorsByOwner(gomock.Any(), arg).Return(rows, nil).AnyTimes()
		check.Args(arg).Asserts(rbac.ResourceSystem, policy.ActionRead).Returns(rows)
	}))
	s.Run("UpdateWorkspaceLocalConnectorDesired", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		arg := testutil.Fake(s.T(), faker, database.UpdateWorkspaceLocalConnectorDesiredParams{})
		row := testutil.Fake(s.T(), faker, database.WorkspaceLocalConnector{})
		store.EXPECT().UpdateWorkspaceLocalConnectorDesired(gomock.Any(), arg).Return(row, nil).AnyTimes()
		check.Args(arg).Asserts(rbac.ResourceSystem, policy.ActionUpdate).Returns(row)
	}))
	s.Run("UpdateWorkspaceLocalConnectorReported", s.Mocked(func(store *dbmock.MockStore, faker *gofakeit.Faker, check *expects) {
		arg := testutil.Fake(s.T(), faker, database.UpdateWorkspaceLocalConnectorReportedParams{})
		row := testutil.Fake(s.T(), faker, database.WorkspaceLocalConnector{})
		store.EXPECT().UpdateWorkspaceLocalConnectorReported(gomock.Any(), arg).Return(row, nil).AnyTimes()
		check.Args(arg).Asserts(rbac.ResourceSystem, policy.ActionUpdate).Returns(row)
	}))
}
