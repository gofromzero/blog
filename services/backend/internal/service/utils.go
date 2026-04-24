package service

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"unicode"
)

func generateID() string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func slugify(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			b.WriteRune(unicode.ToLower(r))
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('-')
		}
	}
	return strings.Trim(b.String(), "-")
}
