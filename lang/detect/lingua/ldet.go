package lgdet

import (
	"errors"
	"fmt"

	lg "github.com/pemistahl/lingua-go"
)

var ErrNoLangDetected error = errors.New("no language detected")

//nolint:gochecknoglobals
var bldr lg.LanguageDetectorBuilder = lg.
	NewLanguageDetectorBuilder().
	FromAllLanguages().
	WithPreloadedLanguageModels()

//nolint:gochecknoglobals
var detector lg.LanguageDetector = bldr.Build()

func TextToLanguage(text string) (lang string, err error) {
	var results []lg.ConfidenceValue = detector.
		ComputeLanguageConfidenceValues(text)
	if 0 < len(results) {
		var cval lg.ConfidenceValue = results[0]

		var confidence float64 = cval.Value()

		var lang lg.Language = cval.Language()
		var iso639_1 string = lang.IsoCode639_1().String()
		var iso639_3 string = lang.IsoCode639_3().String()
		var disp string = lang.String()

		return fmt.Sprintf(
			"%s (confidence=%v, code1=%s, cod3=%s)",
			disp,
			confidence,
			iso639_1,
			iso639_3,
		), nil
	}

	return "", fmt.Errorf("%w: %s", ErrNoLangDetected, text)
}
