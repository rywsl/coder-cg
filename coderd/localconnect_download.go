package coderd

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"regexp"

	"github.com/go-chi/chi/v5"

	"github.com/coder/coder/v2/coderd/httpapi"
	"github.com/coder/coder/v2/codersdk"
)

var localConnectorArtifactName = regexp.MustCompile(`^coder-local-(linux|windows|darwin)-(amd64|arm64)(\.exe)?$`)

// @Summary Get local connector release manifest
// @ID get-local-connector-release-manifest
// @Tags SSH
// @Produce json
// @Success 200 {object} codersdk.LocalConnectorRelease
// @Router /api/v2/local-connect/release [get]
func (*API) localConnectorRelease(rw http.ResponseWriter, r *http.Request) {
	executable, err := os.Executable()
	if err != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	contents, err := os.ReadFile(filepath.Join(filepath.Dir(executable), "local-connect", "manifest.json"))
	if err != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	var release codersdk.LocalConnectorRelease
	if err := json.Unmarshal(contents, &release); err != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	httpapi.Write(r.Context(), rw, http.StatusOK, release)
}

// @Summary Download local connector artifact
// @ID download-local-connector-artifact
// @Tags SSH
// @Produce application/octet-stream
// @Param artifact path string true "Release artifact name"
// @Success 200 {file} file
// @Router /api/v2/local-connect/download/{artifact} [get]
func (*API) localConnectorDownload(rw http.ResponseWriter, r *http.Request) {
	name := chi.URLParam(r, "artifact")
	if !localConnectorArtifactName.MatchString(name) && name != "code-server.sha256" && name != "code-server-local-4.137.0-linux-amd64.tar.gz" && name != "install-code-server.sh" && name != "code-server-module-1.5.0-local.tar.gz" {
		httpapi.ResourceNotFound(rw)
		return
	}
	executable, err := os.Executable()
	if err != nil {
		httpapi.ResourceNotFound(rw)
		return
	}
	rw.Header().Set("Content-Type", "application/octet-stream")
	rw.Header().Set("Content-Disposition", `attachment; filename="`+name+`"`)
	rw.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeFile(rw, r, filepath.Join(filepath.Dir(executable), "local-connect", name))
}
