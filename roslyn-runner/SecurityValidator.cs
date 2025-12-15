using System.Text.RegularExpressions;

// ============================================
// SECURITY VALIDATOR
// Blocks dangerous code patterns before compilation
// ============================================
static class SecurityValidator
{
    // Blocked namespaces/types for file system access
    private static readonly string[] FileSystemPatterns = [
        @"\bFile\s*\.",
        @"\bDirectory\s*\.",
        @"\bPath\s*\.",
        @"\bFileInfo\b",
        @"\bDirectoryInfo\b",
        @"\bStreamReader\b",
        @"\bStreamWriter\b",
        @"\bFileStream\b",
        @"\bSystem\.IO\b",
        @"\bEnvironment\.GetFolderPath\b",
        @"\bEnvironment\.CurrentDirectory\b",
    ];

    // Blocked patterns for network access
    private static readonly string[] NetworkPatterns = [
        @"\bHttpClient\b",
        @"\bWebClient\b",
        @"\bWebRequest\b",
        @"\bHttpWebRequest\b",
        @"\bSocket\b",
        @"\bTcpClient\b",
        @"\bTcpListener\b",
        @"\bUdpClient\b",
        @"\bSystem\.Net\b",
        @"\bDns\s*\.",
    ];

    // Blocked patterns for process spawning
    private static readonly string[] ProcessPatterns = [
        @"\bProcess\s*\.",
        @"\bProcess\.Start\b",
        @"\bProcessStartInfo\b",
        @"\bSystem\.Diagnostics\.Process\b",
    ];

    // Blocked patterns for reflection/assembly loading
    private static readonly string[] ReflectionPatterns = [
        @"\bAssembly\.Load\b",
        @"\bAssembly\.LoadFrom\b",
        @"\bAssembly\.LoadFile\b",
        @"\bActivator\.CreateInstance\b",
        @"\bType\.GetType\b",
        @"\bAppDomain\b",
    ];

    // Blocked patterns for environment/secrets access
    private static readonly string[] EnvironmentPatterns = [
        @"\bEnvironment\.GetEnvironmentVariable\b",
        @"\bEnvironment\.SetEnvironmentVariable\b",
        @"\bEnvironment\.GetEnvironmentVariables\b",
        @"\bRegistry\b",
    ];

    // Category definitions for cleaner validation
    private static readonly (string[] Patterns, string Message)[] SecurityCategories = [
        (FileSystemPatterns, "File system access is not allowed"),
        (NetworkPatterns, "Network access is not allowed"),
        (ProcessPatterns, "Process spawning is not allowed"),
        (ReflectionPatterns, "Dynamic assembly loading is not allowed"),
        (EnvironmentPatterns, "Environment variable access is not allowed"),
    ];

    public static (bool IsValid, string? Error) Validate(string code)
    {
        var violations = new List<string>();

        foreach (var (patterns, message) in SecurityCategories)
        {
            if (MatchesAnyPattern(code, patterns))
            {
                violations.Add(message);
            }
        }

        return violations.Count > 0
            ? (false, $"Security violation: {string.Join("; ", violations)}")
            : (true, null);
    }

    private static bool MatchesAnyPattern(string code, string[] patterns)
    {
        foreach (var pattern in patterns)
        {
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase))
            {
                return true;
            }
        }
        return false;
    }
}
