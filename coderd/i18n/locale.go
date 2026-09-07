package i18n

import (
	"context"
	"net/http"
	"strings"

	"golang.org/x/text/language"
)

// Locale is a supported locale for user-facing server messages.
type Locale string

const (
	LocaleEnglish           Locale = "en"
	LocaleSimplifiedChinese Locale = "zh-CN"
	LocaleCookieName               = "coder_locale"
	contentLanguageHeader          = "Content-Language"
)

type localeContextKey struct{}

// FromContext returns the locale selected for the request. Requests without
// locale middleware remain in English for CLI and third-party compatibility.
func FromContext(ctx context.Context) Locale {
	if ctx == nil {
		return LocaleEnglish
	}
	locale, ok := ctx.Value(localeContextKey{}).(Locale)
	if !ok {
		return LocaleEnglish
	}
	return locale
}

// WithLocale records a supported locale in a context.
func WithLocale(ctx context.Context, locale Locale) context.Context {
	if !locale.supported() {
		locale = LocaleEnglish
	}
	return context.WithValue(ctx, localeContextKey{}, locale)
}

// FromRequest selects a locale from a valid browser cookie, then from the
// Accept-Language header. Requests that declare neither remain in English.
func FromRequest(r *http.Request) Locale {
	if cookie, err := r.Cookie(LocaleCookieName); err == nil {
		if locale, ok := parseLocale(cookie.Value); ok {
			return locale
		}
	}
	return fromAcceptLanguage(r.Header.Get("Accept-Language"))
}

// FromResponse returns the request locale. The response header fallback keeps
// older httpapi helpers that do not accept a request context localizable.
func FromResponse(ctx context.Context, rw http.ResponseWriter) Locale {
	if value := rw.Header().Get(contentLanguageHeader); value != "" {
		if locale, ok := parseLocale(value); ok {
			return locale
		}
	}
	return FromContext(ctx)
}

// Middleware negotiates the request locale and describes the representation
// variance to HTTP caches.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		locale := FromRequest(r)
		addVary(rw.Header(), "Accept-Language")
		addVary(rw.Header(), "Cookie")
		rw.Header().Set(contentLanguageHeader, string(locale))
		next.ServeHTTP(rw, r.WithContext(WithLocale(r.Context(), locale)))
	})
}

func (l Locale) supported() bool {
	return l == LocaleEnglish || l == LocaleSimplifiedChinese
}

func parseLocale(value string) (Locale, bool) {
	switch strings.TrimSpace(value) {
	case string(LocaleEnglish):
		return LocaleEnglish, true
	case string(LocaleSimplifiedChinese):
		return LocaleSimplifiedChinese, true
	default:
		return "", false
	}
}

func fromAcceptLanguage(value string) Locale {
	tags, _, err := language.ParseAcceptLanguage(value)
	if err != nil {
		return LocaleEnglish
	}
	for _, tag := range tags {
		base, _ := tag.Base()
		switch base.String() {
		case "en":
			return LocaleEnglish
		case "zh":
			script, _ := tag.Script()
			if script.String() == "Hans" {
				return LocaleSimplifiedChinese
			}
		}
	}
	return LocaleEnglish
}

func addVary(header http.Header, name string) {
	for _, value := range header.Values("Vary") {
		for _, existing := range strings.Split(value, ",") {
			if strings.EqualFold(strings.TrimSpace(existing), name) {
				return
			}
		}
	}
	header.Add("Vary", name)
}
