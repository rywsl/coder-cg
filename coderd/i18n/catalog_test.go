package i18n //nolint:testpackage // Verifies package-private embedded catalogs.

import (
	"fmt"
	"reflect"
	"regexp"
	"sort"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/coder/coder/v2/codersdk"
)

func TestTranslate(t *testing.T) {
	t.Parallel()

	require.Equal(t, "Forbidden.", Translate(LocaleEnglish, "Forbidden."))
	require.Equal(t, "禁止访问。", Translate(LocaleSimplifiedChinese, "Forbidden."))
	require.Equal(t, "Unknown upstream error", Translate(LocaleSimplifiedChinese, "Unknown upstream error"))
	require.Equal(t, "缺少必需参数：client_id", Translate(LocaleSimplifiedChinese, fmt.Sprintf("Missing required parameter: %s", "client_id")))
	require.Equal(t, "标签 \"required\" 的值 \"\" 验证失败", Translate(LocaleSimplifiedChinese, fmt.Sprintf("Validation failed for tag %q with value: \"%v\"", "required", "")))
	for _, test := range []struct {
		source string
		want   string
	}{
		{"Agent must be connected before configuring ChatGPT Desktop.", "配置 ChatGPT Desktop 前，Agent 必须已连接。"},
		{"Agent must be ready before configuring ChatGPT Desktop.", "配置 ChatGPT Desktop 前，Agent 必须已就绪。"},
		{"Agent must belong to the latest workspace build.", "Agent 必须属于工作区的最新构建。"},
		{"A template with this name already exists in the organization.", "组织中已存在同名模板。"},
		{"Failed to get workspace.", "获取工作区失败。"},
		{"Unknown base template.", "未知基础模板。"},
		{"Invalid enrollment form.", "设备注册表单无效。"},
		{"Platform must be bash or powershell.", "平台必须是 bash 或 PowerShell。"},
		{"device name must contain between 1 and 255 characters", "设备名称必须包含 1 至 255 个字符"},
		{"public key must be Ed25519", "公钥必须使用 Ed25519 算法"},
		{"public key must be one valid OpenSSH public key", "公钥必须是一个有效的 OpenSSH 公钥。"},
		{"This SSH key is already registered in the organization.", "此 SSH 密钥已在该组织中注册。"},
		{"Workspace SSH gateway currently supports Linux agents only.", "工作区 SSH 网关目前仅支持 Linux Agent。"},
		{"Workspace SSH gateway is disabled.", "工作区 SSH 网关未启用。"},
		{"Workspace SSH key ID must be a UUID.", "工作区 SSH 密钥 ID 必须是 UUID。"},
		{"Workspace must be running before configuring ChatGPT Desktop.", "配置 ChatGPT Desktop 前，工作区必须处于运行状态。"},
	} {
		require.Equal(t, test.want, Translate(LocaleSimplifiedChinese, test.source))
	}
}

func TestLocalizeResponse(t *testing.T) {
	t.Parallel()

	original := codersdk.Response{
		Message: "Validation failed.",
		Detail:  "database: connection refused",
		Validations: []codersdk.ValidationError{
			{Field: "name", Detail: "Validation failed for tag \"required\" with value: \"\""},
		},
	}
	localized, ok := LocalizeResponse(LocaleSimplifiedChinese, original).(codersdk.Response)
	require.True(t, ok)
	require.Equal(t, "验证失败。", localized.Message)
	require.Equal(t, original.Detail, localized.Detail)
	require.Equal(t, "标签 \"required\" 的值 \"\" 验证失败", localized.Validations[0].Detail)
	require.Equal(t, "Validation failed.", original.Message)
	require.Equal(t, "Validation failed for tag \"required\" with value: \"\"", original.Validations[0].Detail)
}

func TestLocalizeOAuth2Error(t *testing.T) {
	t.Parallel()

	original := &codersdk.OAuth2Error{
		Error:            codersdk.OAuth2ErrorCodeInvalidRequest,
		ErrorDescription: "Missing required parameter: client_id",
		ErrorURI:         "https://example.com/error",
	}
	localized, ok := LocalizeResponse(LocaleSimplifiedChinese, original).(*codersdk.OAuth2Error)
	require.True(t, ok)
	require.NotSame(t, original, localized)
	require.Equal(t, original.Error, localized.Error)
	require.Equal(t, original.ErrorURI, localized.ErrorURI)
	require.Equal(t, "缺少必需参数：client_id", localized.ErrorDescription)
	require.Equal(t, "Missing required parameter: client_id", original.ErrorDescription)
}

func TestCatalogsMatch(t *testing.T) {
	t.Parallel()

	english := catalogs[LocaleEnglish]
	chinese := catalogs[LocaleSimplifiedChinese]
	require.Equal(t, sortedKeys(english.Messages), sortedKeys(chinese.Messages))
	require.Equal(t, templateShapes(english), templateShapes(chinese))
	for key, value := range chinese.Messages {
		require.NotEmpty(t, value, key)
		require.NotContains(t, value, "zxqplaceholder", key)
		assertLocalizedProductTerms(t, key, value)
		require.NotContains(t, value, "碱基", key)
	}
	for _, entry := range chinese.Templates {
		require.NotEmpty(t, entry.Translation, entry.Source)
		require.NotContains(t, entry.Translation, "zxqplaceholder", entry.Source)
		require.NotContains(t, entry.Translation, "ZXQTERM", entry.Source)
		assertLocalizedProductTerms(t, entry.Source, entry.Translation)
		require.NotContains(t, entry.Translation, "碱基", entry.Source)
		englishEntry := findTemplate(t, english, entry.Source)
		require.Equal(t, templateVariables(englishEntry.Translation), templateVariables(entry.Translation), entry.Source)
	}
}

func assertLocalizedProductTerms(t *testing.T, source, translation string) {
	t.Helper()
	for _, term := range []struct {
		source       *regexp.Regexp
		untranslated *regexp.Regexp
		translation  string
	}{
		{regexp.MustCompile(`(?i)\bworkspaces?\b`), regexp.MustCompile(`(?i)\bworkspaces?\b`), "工作区"},
		{regexp.MustCompile(`(?i)\btemplates?\b`), regexp.MustCompile(`(?i)\btemplates?\b`), "模板"},
	} {
		if !term.source.MatchString(source) {
			continue
		}
		require.Contains(t, translation, term.translation, source)
		require.NotRegexp(t, term.untranslated, translation, source)
	}
}

func sortedKeys(values map[string]string) []string {
	keys := reflect.ValueOf(values).MapKeys()
	result := make([]string, 0, len(keys))
	for _, key := range keys {
		result = append(result, key.String())
	}
	sort.Strings(result)
	return result
}

func templateShapes(value catalog) map[string]int {
	result := make(map[string]int, len(value.Templates))
	for _, entry := range value.Templates {
		result[entry.Source] = entry.variables
	}
	return result
}

func templateVariables(value string) []string {
	result := regexpTemplateVariable.FindAllString(value, -1)
	sort.Strings(result)
	return result
}

func findTemplate(t *testing.T, value catalog, source string) templateEntry {
	t.Helper()
	for _, entry := range value.Templates {
		if entry.Source == source {
			return entry
		}
	}
	t.Fatalf("template %q not found", source)
	return templateEntry{}
}
