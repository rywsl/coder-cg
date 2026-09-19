package dbtestutil

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestConfiguredPostgresPort(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		input string
		want  uint16
	}{
		{input: "", want: 5432},
		{input: "5432", want: 5432},
		{input: "55432", want: 55432},
		{input: "65535", want: 65535},
		{input: "0"},
		{input: "65536"},
		{input: "-1"},
		{input: "not-a-port"},
	} {
		t.Run(tc.input, func(t *testing.T) {
			t.Parallel()
			port, err := configuredPostgresPort(tc.input)
			if tc.want == 0 {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.Equal(t, tc.want, port)
		})
	}
}
