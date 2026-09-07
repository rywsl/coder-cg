package i18n

import (
	"embed"
	"encoding/json"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"golang.org/x/xerrors"

	"github.com/coder/coder/v2/codersdk"
)

//go:embed catalog/*.json
var catalogFS embed.FS

type catalog struct {
	Messages  map[string]string `json:"messages"`
	Templates []templateEntry   `json:"templates"`
}

type templateEntry struct {
	Source      string `json:"source"`
	Translation string `json:"translation"`
	pattern     *regexp.Regexp
	variables   int
}

var catalogs = map[Locale]catalog{
	LocaleEnglish:           mustLoadCatalog(LocaleEnglish),
	LocaleSimplifiedChinese: mustLoadCatalog(LocaleSimplifiedChinese),
}

var regexpTemplateVariable = regexp.MustCompile(`\{\{[0-9]+\}\}`)

func mustLoadCatalog(locale Locale) catalog {
	data, err := catalogFS.ReadFile("catalog/" + string(locale) + ".json")
	if err != nil {
		panic(fmt.Sprintf("read %s message catalog: %v", locale, err))
	}
	var result catalog
	if err := json.Unmarshal(data, &result); err != nil {
		panic(fmt.Sprintf("parse %s message catalog: %v", locale, err))
	}
	for index := range result.Templates {
		entry := &result.Templates[index]
		entry.pattern, entry.variables, err = compileFormat(entry.Source)
		if err != nil {
			panic(fmt.Sprintf("compile %s message template %q: %v", locale, entry.Source, err))
		}
	}
	sort.Slice(result.Templates, func(i, j int) bool {
		return len(result.Templates[i].Source) > len(result.Templates[j].Source)
	})
	return result
}

// Translate returns a localized server-owned message. Unknown messages and all
// English requests are returned unchanged.
func Translate(locale Locale, message string) string {
	if locale != LocaleSimplifiedChinese || message == "" {
		return message
	}
	catalog := catalogs[locale]
	if translated, ok := catalog.Messages[message]; ok {
		return translated
	}
	for _, entry := range catalog.Templates {
		matches := entry.pattern.FindStringSubmatch(message)
		if matches == nil {
			continue
		}
		return renderTemplate(entry.Translation, matches[1:])
	}
	return message
}

// LocalizeResponse copies supported SDK response values before translating
// their user-facing fields. Technical details and unknown response types are
// deliberately left unchanged.
func LocalizeResponse(locale Locale, response any) any {
	switch value := response.(type) {
	case codersdk.Response:
		return localizeSDKResponse(locale, value)
	case *codersdk.Response:
		if value == nil {
			return nil
		}
		localized := localizeSDKResponse(locale, *value)
		return &localized
	case codersdk.OAuth2Error:
		value.ErrorDescription = Translate(locale, value.ErrorDescription)
		return value
	case *codersdk.OAuth2Error:
		if value == nil {
			return nil
		}
		localized := *value
		localized.ErrorDescription = Translate(locale, localized.ErrorDescription)
		return &localized
	default:
		return response
	}
}

func localizeSDKResponse(locale Locale, response codersdk.Response) codersdk.Response {
	response.Message = Translate(locale, response.Message)
	if len(response.Validations) == 0 {
		return response
	}
	response.Validations = append([]codersdk.ValidationError(nil), response.Validations...)
	for index := range response.Validations {
		response.Validations[index].Detail = Translate(locale, response.Validations[index].Detail)
	}
	return response
}

func compileFormat(format string) (*regexp.Regexp, int, error) {
	var pattern strings.Builder
	_ = pattern.WriteByte('^')
	variables := 0
	for index := 0; index < len(format); {
		if format[index] != '%' {
			start := index
			for index < len(format) && format[index] != '%' {
				index++
			}
			_, _ = pattern.WriteString(regexp.QuoteMeta(format[start:index]))
			continue
		}
		if index+1 < len(format) && format[index+1] == '%' {
			_, _ = pattern.WriteString("%")
			index += 2
			continue
		}
		end, ok := formatVerbEnd(format, index)
		if !ok {
			return nil, 0, xerrors.Errorf("invalid formatting directive at byte %d", index)
		}
		_, _ = pattern.WriteString("(.*?)")
		variables++
		index = end
	}
	_ = pattern.WriteByte('$')
	compiled, err := regexp.Compile(pattern.String())
	return compiled, variables, err
}

func formatVerbEnd(format string, start int) (int, bool) {
	for index := start + 1; index < len(format); index++ {
		character := format[index]
		if (character >= 'a' && character <= 'z') || (character >= 'A' && character <= 'Z') {
			return index + 1, true
		}
	}
	return 0, false
}

func renderTemplate(template string, values []string) string {
	return regexpTemplateVariable.ReplaceAllStringFunc(template, func(token string) string {
		index, err := strconv.Atoi(token[2 : len(token)-2])
		if err != nil || index >= len(values) {
			return token
		}
		return values[index]
	})
}
