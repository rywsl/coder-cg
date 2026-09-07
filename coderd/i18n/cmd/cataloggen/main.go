package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"golang.org/x/xerrors"
)

type catalog struct {
	Messages  map[string]string `json:"messages"`
	Templates []templateEntry   `json:"templates"`
}

type templateEntry struct {
	Source      string `json:"source"`
	Translation string `json:"translation"`
}

type sourceFile struct {
	file       *ast.File
	imports    map[string]string
	constants  map[string]string
	path       string
	packageDir string
}

type catalogMode int

const (
	catalogModeCheck catalogMode = iota
	catalogModeWrite
)

func main() {
	write := flag.Bool("write", false, "write synchronized catalogs")
	flag.Parse()

	mode := catalogModeCheck
	if *write {
		mode = catalogModeWrite
	}
	if err := run(mode); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(mode catalogMode) error {
	root, err := moduleRoot()
	if err != nil {
		return err
	}
	files, err := parseSource(root)
	if err != nil {
		return err
	}
	messages, templates := extract(files)

	enPath := filepath.Join(root, "coderd/i18n/catalog/en.json")
	zhPath := filepath.Join(root, "coderd/i18n/catalog/zh-CN.json")
	chinese, err := readCatalog(zhPath)
	if err != nil {
		return err
	}
	english := synchronize(catalog{}, messages, templates)
	chinese = synchronize(chinese, messages, templates)

	if mode == catalogModeWrite {
		if err := writeCatalog(enPath, english); err != nil {
			return err
		}
		return writeCatalog(zhPath, chinese)
	}
	if err := checkCatalog(enPath, english); err != nil {
		return err
	}
	return checkCatalog(zhPath, chinese)
}

func moduleRoot() (string, error) {
	directory, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(directory, "go.mod")); err == nil {
			return directory, nil
		}
		parent := filepath.Dir(directory)
		if parent == directory {
			return "", xerrors.New("go.mod not found")
		}
		directory = parent
	}
}

func parseSource(root string) ([]sourceFile, error) {
	var result []sourceFile
	for _, sourceRoot := range []string{filepath.Join(root, "coderd"), filepath.Join(root, "enterprise/coderd")} {
		err := filepath.WalkDir(sourceRoot, func(path string, entry os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if entry.IsDir() {
				return nil
			}
			if !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") || strings.Contains(path, "/i18n/catalog/") {
				return nil
			}
			set := token.NewFileSet()
			parsed, err := parser.ParseFile(set, path, nil, 0)
			if err != nil {
				return err
			}
			result = append(result, sourceFile{
				file:       parsed,
				imports:    imports(parsed),
				constants:  constants(parsed),
				path:       path,
				packageDir: filepath.Dir(path),
			})
			return nil
		})
		if err != nil {
			return nil, err
		}
	}
	return result, nil
}

func imports(file *ast.File) map[string]string {
	result := make(map[string]string)
	for _, spec := range file.Imports {
		path, err := strconv.Unquote(spec.Path.Value)
		if err != nil {
			continue
		}
		name := filepath.Base(path)
		if spec.Name != nil {
			name = spec.Name.Name
		}
		result[name] = path
	}
	return result
}

func constants(file *ast.File) map[string]string {
	result := make(map[string]string)
	for _, declaration := range file.Decls {
		general, ok := declaration.(*ast.GenDecl)
		if !ok || general.Tok != token.CONST {
			continue
		}
		for _, spec := range general.Specs {
			value, ok := spec.(*ast.ValueSpec)
			if !ok {
				continue
			}
			for index, name := range value.Names {
				if index >= len(value.Values) {
					continue
				}
				if text, ok := stringExpression(value.Values[index], result); ok {
					result[name.Name] = text
				}
			}
		}
	}
	return result
}

func extract(files []sourceFile) (messages, templates map[string]struct{}) {
	messages = make(map[string]struct{})
	templates = make(map[string]struct{})
	for _, source := range files {
		ast.Inspect(source.file, func(node ast.Node) bool {
			switch value := node.(type) {
			case *ast.CompositeLit:
				typeName, packageName := expressionType(value.Type)
				packagePath := source.imports[packageName]
				if packagePath != "github.com/coder/coder/v2/codersdk" {
					return true
				}
				field := ""
				switch typeName {
				case "Response":
					field = "Message"
				case "ValidationError":
					field = "Detail"
				default:
					return true
				}
				extractCompositeField(value, field, source.constants, messages, templates)
			case *ast.CallExpr:
				selector, ok := value.Fun.(*ast.SelectorExpr)
				if !ok {
					return true
				}
				packageName, ok := selector.X.(*ast.Ident)
				if !ok {
					return true
				}
				packagePath := source.imports[packageName.Name]
				switch {
				case selector.Sel.Name == "WriteOAuth2Error" && packagePath == "github.com/coder/coder/v2/coderd/httpapi" && len(value.Args) >= 5:
					addExpression(value.Args[4], source.constants, messages, templates)
				case selector.Sel.Name == "Translate" && packagePath == "github.com/coder/coder/v2/coderd/i18n" && len(value.Args) >= 2:
					addExpression(value.Args[1], source.constants, messages, templates)
				}
			}
			return true
		})
	}
	return messages, templates
}

func extractCompositeField(composite *ast.CompositeLit, field string, constants map[string]string, messages, templates map[string]struct{}) {
	for _, element := range composite.Elts {
		if nested, ok := element.(*ast.CompositeLit); ok {
			extractCompositeField(nested, field, constants, messages, templates)
			continue
		}
		keyValue, ok := element.(*ast.KeyValueExpr)
		if !ok || identifierName(keyValue.Key) != field {
			continue
		}
		addExpression(keyValue.Value, constants, messages, templates)
	}
}

func addExpression(expression ast.Expr, constants map[string]string, messages, templates map[string]struct{}) {
	if call, ok := expression.(*ast.CallExpr); ok && isFormatCall(call) && len(call.Args) > 0 {
		if value, ok := stringExpression(call.Args[0], constants); ok && strings.TrimSpace(value) != "" {
			templates[value] = struct{}{}
		}
		return
	}
	if value, ok := stringExpression(expression, constants); ok && strings.TrimSpace(value) != "" {
		messages[value] = struct{}{}
	}
}

func isFormatCall(call *ast.CallExpr) bool {
	selector, ok := call.Fun.(*ast.SelectorExpr)
	if !ok || (selector.Sel.Name != "Sprintf" && selector.Sel.Name != "Errorf") {
		return false
	}
	packageName, ok := selector.X.(*ast.Ident)
	return ok && (packageName.Name == "fmt" || packageName.Name == "xerrors")
}

func stringExpression(expression ast.Expr, constants map[string]string) (string, bool) {
	switch value := expression.(type) {
	case *ast.BasicLit:
		if value.Kind != token.STRING {
			return "", false
		}
		text, err := strconv.Unquote(value.Value)
		return text, err == nil
	case *ast.Ident:
		text, ok := constants[value.Name]
		return text, ok
	case *ast.ParenExpr:
		return stringExpression(value.X, constants)
	case *ast.BinaryExpr:
		if value.Op != token.ADD {
			return "", false
		}
		left, leftOK := stringExpression(value.X, constants)
		right, rightOK := stringExpression(value.Y, constants)
		return left + right, leftOK && rightOK
	default:
		return "", false
	}
}

func expressionType(expression ast.Expr) (typeName, packageName string) {
	switch value := expression.(type) {
	case *ast.SelectorExpr:
		identifier, ok := value.X.(*ast.Ident)
		if ok {
			return value.Sel.Name, identifier.Name
		}
	case *ast.StarExpr:
		return expressionType(value.X)
	case *ast.ArrayType:
		return expressionType(value.Elt)
	}
	return "", ""
}

func identifierName(expression ast.Expr) string {
	identifier, ok := expression.(*ast.Ident)
	if !ok {
		return ""
	}
	return identifier.Name
}

func synchronize(existing catalog, messages, templates map[string]struct{}) catalog {
	result := catalog{Messages: make(map[string]string, len(messages))}
	for source := range messages {
		translation := source
		if existingTranslation, ok := existing.Messages[source]; ok {
			translation = existingTranslation
		}
		result.Messages[source] = translation
	}
	existingTemplates := make(map[string]string, len(existing.Templates))
	for _, entry := range existing.Templates {
		existingTemplates[entry.Source] = entry.Translation
	}
	for source := range templates {
		translation := placeholderFormat(source)
		if existingTranslation, ok := existingTemplates[source]; ok {
			translation = existingTranslation
		}
		result.Templates = append(result.Templates, templateEntry{Source: source, Translation: translation})
	}
	sort.Slice(result.Templates, func(i, j int) bool {
		return result.Templates[i].Source < result.Templates[j].Source
	})
	return result
}

func placeholderFormat(value string) string {
	var result strings.Builder
	variable := 0
	for index := 0; index < len(value); {
		if value[index] != '%' {
			_ = result.WriteByte(value[index])
			index++
			continue
		}
		if index+1 < len(value) && value[index+1] == '%' {
			_, _ = result.WriteString("%%")
			index += 2
			continue
		}
		end := index + 1
		for end < len(value) && !isLetter(value[end]) {
			end++
		}
		if end == len(value) {
			_, _ = result.WriteString(value[index:])
			break
		}
		_, _ = result.WriteString("{{")
		_, _ = result.WriteString(strconv.Itoa(variable))
		_, _ = result.WriteString("}}")
		variable++
		index = end + 1
	}
	return result.String()
}

func isLetter(value byte) bool {
	return (value >= 'a' && value <= 'z') || (value >= 'A' && value <= 'Z')
}

func readCatalog(path string) (catalog, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return catalog{}, xerrors.Errorf("read catalog %s: %w", path, err)
	}
	var value catalog
	if err := json.Unmarshal(data, &value); err != nil {
		return catalog{}, xerrors.Errorf("parse catalog %s: %w", path, err)
	}
	return value, nil
}

func writeCatalog(path string, value catalog) error {
	data, err := marshalCatalog(value)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}

func checkCatalog(path string, expected catalog) error {
	actual, err := os.ReadFile(path)
	if err != nil {
		return xerrors.Errorf("read catalog %s: %w", path, err)
	}
	generated, err := marshalCatalog(expected)
	if err != nil {
		return err
	}
	if !bytes.Equal(actual, generated) {
		return xerrors.Errorf("%s is out of date; run go generate ./coderd/i18n", path)
	}
	return nil
}

func marshalCatalog(value catalog) ([]byte, error) {
	var output bytes.Buffer
	encoder := json.NewEncoder(&output)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "\t")
	if err := encoder.Encode(value); err != nil {
		return nil, err
	}
	return output.Bytes(), nil
}
