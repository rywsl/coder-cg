package i18n //nolint:testpackage // Verifies package-private embedded catalogs.

import (
	"fmt"
	"reflect"
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
	}
	for _, entry := range chinese.Templates {
		require.NotEmpty(t, entry.Translation, entry.Source)
		require.NotContains(t, entry.Translation, "zxqplaceholder", entry.Source)
		require.NotContains(t, entry.Translation, "ZXQTERM", entry.Source)
		englishEntry := findTemplate(t, english, entry.Source)
		require.Equal(t, templateVariables(englishEntry.Translation), templateVariables(entry.Translation), entry.Source)
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
