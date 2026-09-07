package i18n_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/coder/coder/v2/coderd/i18n"
)

func TestFromRequest(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		cookie         string
		acceptLanguage string
		want           i18n.Locale
	}{
		{name: "default", want: i18n.LocaleEnglish},
		{name: "Chinese cookie", cookie: "zh-CN", want: i18n.LocaleSimplifiedChinese},
		{name: "English cookie overrides header", cookie: "en", acceptLanguage: "zh-CN", want: i18n.LocaleEnglish},
		{name: "invalid cookie uses header", cookie: "fr", acceptLanguage: "zh-CN", want: i18n.LocaleSimplifiedChinese},
		{name: "quality weight", acceptLanguage: "en;q=0.4, zh-CN;q=0.9", want: i18n.LocaleSimplifiedChinese},
		{name: "English region", acceptLanguage: "en-US", want: i18n.LocaleEnglish},
		{name: "generic Chinese", acceptLanguage: "zh", want: i18n.LocaleSimplifiedChinese},
		{name: "traditional Chinese is unsupported", acceptLanguage: "zh-TW", want: i18n.LocaleEnglish},
		{name: "unsupported language", acceptLanguage: "fr-FR", want: i18n.LocaleEnglish},
		{name: "malformed header", acceptLanguage: "not a language", want: i18n.LocaleEnglish},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if test.cookie != "" {
				r.AddCookie(&http.Cookie{Name: i18n.LocaleCookieName, Value: test.cookie})
			}
			if test.acceptLanguage != "" {
				r.Header.Set("Accept-Language", test.acceptLanguage)
			}
			require.Equal(t, test.want, i18n.FromRequest(r))
		})
	}
}

func TestMiddleware(t *testing.T) {
	t.Parallel()

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("Accept-Language", "zh-CN")
	rw := httptest.NewRecorder()
	rw.Header().Add("Vary", "Origin")
	handler := i18n.Middleware(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		require.Equal(t, i18n.LocaleSimplifiedChinese, i18n.FromContext(r.Context()))
		rw.WriteHeader(http.StatusNoContent)
	}))

	handler.ServeHTTP(rw, r)

	require.Equal(t, "zh-CN", rw.Header().Get("Content-Language"))
	require.ElementsMatch(t, []string{"Origin", "Accept-Language", "Cookie"}, rw.Header().Values("Vary"))
}

func TestFromResponse(t *testing.T) {
	t.Parallel()

	rw := httptest.NewRecorder()
	rw.Header().Set("Content-Language", "zh-CN")
	require.Equal(t, i18n.LocaleSimplifiedChinese, i18n.FromResponse(context.Background(), rw))
}
