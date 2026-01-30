package utils

import (
	"log"
	"os"
)

var (
	// InfoLogger logs informational messages
	InfoLogger *log.Logger
	// ErrorLogger logs error messages
	ErrorLogger *log.Logger
	// WarningLogger logs warning messages
	WarningLogger *log.Logger
)

func init() {
	InfoLogger = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	ErrorLogger = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)
	WarningLogger = log.New(os.Stdout, "WARNING: ", log.Ldate|log.Ltime|log.Lshortfile)
}
