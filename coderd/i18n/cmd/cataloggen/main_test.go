package main

import (
	"bytes"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"testing"
)

func TestExtractExplicitTranslation(t *testing.T) {
	t.Parallel()

	parsed, err := parser.ParseFile(token.NewFileSet(), "example.go", `package example

import "github.com/coder/coder/v2/coderd/i18n"

func translate() string {
	return i18n.Translate(i18n.LocaleEnglish, "The access token has expired")
}
`, 0)
	if err != nil {
		t.Fatal(err)
	}
	messages, templates := extract([]sourceFile{{
		file:      parsed,
		imports:   imports(parsed),
		constants: constants(parsed),
	}})
	if _, ok := messages["The access token has expired"]; !ok {
		t.Fatal("explicit translation was not extracted")
	}
	if len(templates) != 0 {
		t.Fatalf("unexpected templates: %v", templates)
	}
}

func TestCatalogsSynchronized(t *testing.T) {
	t.Parallel()

	root, err := moduleRoot()
	if err != nil {
		t.Fatal(err)
	}
	files, err := parseSource(root)
	if err != nil {
		t.Fatal(err)
	}
	messages, templates := extract(files)
	for _, test := range []struct {
		locale  string
		chinese bool
	}{
		{locale: "en"},
		{locale: "zh-CN", chinese: true},
	} {
		test := test
		t.Run(test.locale, func(t *testing.T) {
			t.Parallel()
			path := filepath.Join(root, "coderd/i18n/catalog", test.locale+".json")
			existing, err := readCatalog(path)
			if err != nil {
				t.Fatal(err)
			}
			if !test.chinese {
				existing = catalog{}
			}
			expected, err := marshalCatalog(synchronize(existing, messages, templates))
			if err != nil {
				t.Fatal(err)
			}
			actual, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(expected, actual) {
				t.Fatalf("%s is out of date; run go generate ./coderd/i18n", path)
			}
		})
	}
}
