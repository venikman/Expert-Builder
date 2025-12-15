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
        @"\bAssembly\.Load",
        @"\bAssembly\.LoadFrom\b",
        @"\bAssembly\.LoadFile\b",
        @"\bActivator\.CreateInstance\b",
        @"\bType\.GetType\s*\(\s*""",
        @"\bAppDomain\b",
    ];

    // Blocked patterns for environment/secrets access
    private static readonly string[] EnvironmentPatterns = [
        @"\bEnvironment\.GetEnvironmentVariable\b",
        @"\bEnvironment\.SetEnvironmentVariable\b",
        @"\bEnvironment\.GetEnvironmentVariables\b",
        @"\bRegistry\b",
    ];

    public static (bool IsValid, string? Error) Validate(string code)
    {
        var violations = new List<string>();

        // Check file system access
        foreach (var pattern in FileSystemPatterns)
        {
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase))
            {
                violations.Add("File system access is not allowed");
                break;
            }
        }

        // Check network access
        foreach (var pattern in NetworkPatterns)
        {
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase))
            {
                violations.Add("Network access is not allowed");
                break;
            }
        }

        // Check process spawning
        foreach (var pattern in ProcessPatterns)
        {
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase))
            {
                violations.Add("Process spawning is not allowed");
                break;
            }
        }

        // Check reflection attacks
        foreach (var pattern in ReflectionPatterns)
        {
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase))
            {
                violations.Add("Dynamic assembly loading is not allowed");
                break;
            }
        }

        // Check environment access
        foreach (var pattern in EnvironmentPatterns)
        {
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase))
            {
                violations.Add("Environment variable access is not allowed");
                break;
            }
        }

        if (violations.Count > 0)
        {
            return (false, $"Security violation: {string.Join("; ", violations)}");
        }

        return (true, null);
    }
}
