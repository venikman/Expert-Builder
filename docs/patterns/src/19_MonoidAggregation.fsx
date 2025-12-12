// Monoid pattern: associative combine + identity value.
// Example: string concatenation.

let combine (a:string) (b:string) = a + b
let empty = ""

let xs = ["a";"b";"c"]
let joined = xs |> List.fold combine empty

assert (joined = "abc")
assert (combine empty "x" = "x")
assert (combine "x" empty = "x")

printfn "OK: joined=%s" joined
