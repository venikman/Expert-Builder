// Security Validator Tests
// Run with: dotnet test roslyn-runner/SecurityValidator.Tests.csproj

using System.Text.RegularExpressions;

namespace RoslynRunner.Tests;

// Inline test runner (no external test framework needed)
public static class SecurityTests
{
    public static void Main()
    {
        Console.WriteLine("Running Security Validator Tests...\n");

        var passed = 0;
        var failed = 0;

        // ============================================
        // FILE SYSTEM ACCESS TESTS
        // ============================================
        Test("Blocks File.ReadAllText", () =>
        {
            var code = @"var content = File.ReadAllText(""secret.txt"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("File system"), $"Should block File.ReadAllText: {error}");
        }, ref passed, ref failed);

        Test("Blocks Directory.GetFiles", () =>
        {
            var code = @"var files = Directory.GetFiles(""/"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("File system"), $"Should block Directory: {error}");
        }, ref passed, ref failed);

        Test("Blocks StreamReader", () =>
        {
            var code = @"using var sr = new StreamReader(""/etc/passwd"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("File system"), $"Should block StreamReader: {error}");
        }, ref passed, ref failed);

        Test("Blocks FileStream", () =>
        {
            var code = @"using var fs = new FileStream(""test.txt"", FileMode.Open);";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("File system"), $"Should block FileStream: {error}");
        }, ref passed, ref failed);

        Test("Blocks System.IO namespace", () =>
        {
            var code = @"using System.IO; var f = File.Exists(""x"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("File system"), $"Should block System.IO: {error}");
        }, ref passed, ref failed);

        // ============================================
        // NETWORK ACCESS TESTS
        // ============================================
        Test("Blocks HttpClient", () =>
        {
            var code = @"var client = new HttpClient(); await client.GetAsync(""http://evil.com"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Network"), $"Should block HttpClient: {error}");
        }, ref passed, ref failed);

        Test("Blocks WebClient", () =>
        {
            var code = @"var wc = new WebClient(); wc.DownloadString(""http://evil.com"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Network"), $"Should block WebClient: {error}");
        }, ref passed, ref failed);

        Test("Blocks Socket", () =>
        {
            var code = @"var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Network"), $"Should block Socket: {error}");
        }, ref passed, ref failed);

        Test("Blocks TcpClient", () =>
        {
            var code = @"var tcp = new TcpClient(""evil.com"", 80);";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Network"), $"Should block TcpClient: {error}");
        }, ref passed, ref failed);

        Test("Blocks System.Net namespace", () =>
        {
            var code = @"using System.Net; var req = WebRequest.Create(""http://x"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Network"), $"Should block System.Net: {error}");
        }, ref passed, ref failed);

        // ============================================
        // PROCESS SPAWNING TESTS
        // ============================================
        Test("Blocks Process.Start", () =>
        {
            var code = @"Process.Start(""rm"", ""-rf /"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Process"), $"Should block Process.Start: {error}");
        }, ref passed, ref failed);

        Test("Blocks ProcessStartInfo", () =>
        {
            var code = @"var psi = new ProcessStartInfo(""cmd.exe"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Process"), $"Should block ProcessStartInfo: {error}");
        }, ref passed, ref failed);

        Test("Blocks System.Diagnostics.Process", () =>
        {
            var code = @"var p = new System.Diagnostics.Process();";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Process"), $"Should block System.Diagnostics.Process: {error}");
        }, ref passed, ref failed);

        // ============================================
        // REFLECTION/ASSEMBLY LOADING TESTS
        // ============================================
        Test("Blocks Assembly.Load", () =>
        {
            var code = @"var asm = Assembly.Load(""System.Runtime"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("assembly"), $"Should block Assembly.Load: {error}");
        }, ref passed, ref failed);

        Test("Blocks Assembly.LoadFrom", () =>
        {
            var code = @"var asm = Assembly.LoadFrom(""/tmp/evil.dll"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("assembly"), $"Should block Assembly.LoadFrom: {error}");
        }, ref passed, ref failed);

        Test("Blocks Activator.CreateInstance with type name", () =>
        {
            var code = @"var obj = Activator.CreateInstance(Type.GetType(""Evil.Type""));";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("assembly"), $"Should block Activator: {error}");
        }, ref passed, ref failed);

        Test("Blocks Type.GetType with variable", () =>
        {
            var code = @"var typeName = ""Evil.Type""; var t = Type.GetType(typeName);";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("assembly"), $"Should block Type.GetType with variable: {error}");
        }, ref passed, ref failed);

        Test("Blocks AppDomain", () =>
        {
            var code = @"var domain = AppDomain.CreateDomain(""evil"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("assembly"), $"Should block AppDomain: {error}");
        }, ref passed, ref failed);

        // ============================================
        // ENVIRONMENT ACCESS TESTS
        // ============================================
        Test("Blocks Environment.GetEnvironmentVariable", () =>
        {
            var code = @"var secret = Environment.GetEnvironmentVariable(""API_KEY"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Environment"), $"Should block GetEnvironmentVariable: {error}");
        }, ref passed, ref failed);

        Test("Blocks Environment.SetEnvironmentVariable", () =>
        {
            var code = @"Environment.SetEnvironmentVariable(""PATH"", ""/evil"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Environment"), $"Should block SetEnvironmentVariable: {error}");
        }, ref passed, ref failed);

        Test("Blocks Registry access", () =>
        {
            var code = @"var key = Registry.LocalMachine.OpenSubKey(""SOFTWARE"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(!isValid && error!.Contains("Environment"), $"Should block Registry: {error}");
        }, ref passed, ref failed);

        // ============================================
        // SAFE CODE TESTS (should pass)
        // ============================================
        Test("Allows Console.WriteLine", () =>
        {
            var code = @"Console.WriteLine(""Hello, World!"");";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(isValid, $"Should allow Console.WriteLine: {error}");
        }, ref passed, ref failed);

        Test("Allows LINQ operations", () =>
        {
            var code = @"var nums = new[] { 1, 2, 3 }.Where(n => n > 1).Select(n => n * 2).ToList();";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(isValid, $"Should allow LINQ: {error}");
        }, ref passed, ref failed);

        Test("Allows class definitions", () =>
        {
            var code = @"
public class Person { public string Name { get; set; } }
var p = new Person { Name = ""Alice"" };
Console.WriteLine(p.Name);";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(isValid, $"Should allow classes: {error}");
        }, ref passed, ref failed);

        Test("Allows Func delegates", () =>
        {
            var code = @"Func<int, int> square = x => x * x; Console.WriteLine(square(5));";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(isValid, $"Should allow Func: {error}");
        }, ref passed, ref failed);

        Test("Allows List and Dictionary", () =>
        {
            var code = @"
var list = new List<int> { 1, 2, 3 };
var dict = new Dictionary<string, int> { [""a""] = 1 };";
            var (isValid, error) = SecurityValidator.Validate(code);
            Assert(isValid, $"Should allow collections: {error}");
        }, ref passed, ref failed);

        // ============================================
        // RESULTS
        // ============================================
        Console.WriteLine($"\n{'=',-50}");
        Console.WriteLine($"RESULTS: {passed} passed, {failed} failed");
        Console.WriteLine($"{'=',-50}");

        Environment.Exit(failed > 0 ? 1 : 0);
    }

    static void Test(string name, Action test, ref int passed, ref int failed)
    {
        try
        {
            test();
            Console.WriteLine($"  ✅ {name}");
            passed++;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  ❌ {name}");
            Console.WriteLine($"     {ex.Message}");
            failed++;
        }
    }

    static void Assert(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }
}

// Copy of SecurityValidator for testing
static class SecurityValidator
{
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

    private static readonly string[] ProcessPatterns = [
        @"\bProcess\s*\.",
        @"\bProcess\.Start\b",
        @"\bProcessStartInfo\b",
        @"\bSystem\.Diagnostics\.Process\b",
    ];

    private static readonly string[] ReflectionPatterns = [
        @"\bAssembly\.Load",
        @"\bAssembly\.LoadFrom\b",
        @"\bAssembly\.LoadFile\b",
        @"\bActivator\.CreateInstance\b",
        @"\bType\.GetType\b",
        @"\bAppDomain\b",
    ];

    private static readonly string[] EnvironmentPatterns = [
        @"\bEnvironment\.GetEnvironmentVariable\b",
        @"\bEnvironment\.SetEnvironmentVariable\b",
        @"\bEnvironment\.GetEnvironmentVariables\b",
        @"\bRegistry\b",
    ];

    public static (bool IsValid, string? Error) Validate(string code)
    {
        var violations = new List<string>();

        foreach (var pattern in FileSystemPatterns)
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase)) { violations.Add("File system access is not allowed"); break; }

        foreach (var pattern in NetworkPatterns)
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase)) { violations.Add("Network access is not allowed"); break; }

        foreach (var pattern in ProcessPatterns)
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase)) { violations.Add("Process spawning is not allowed"); break; }

        foreach (var pattern in ReflectionPatterns)
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase)) { violations.Add("Dynamic assembly loading is not allowed"); break; }

        foreach (var pattern in EnvironmentPatterns)
            if (Regex.IsMatch(code, pattern, RegexOptions.IgnoreCase)) { violations.Add("Environment variable access is not allowed"); break; }

        return violations.Count > 0 ? (false, $"Security violation: {string.Join("; ", violations)}") : (true, null);
    }
}
