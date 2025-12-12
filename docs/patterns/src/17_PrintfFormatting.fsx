// printf family: type-safe formatted output.

let name = "Alice"
let count = 3

let s = sprintf "name=%s count=%d" name count
printfn "%s" s

assert (s = "name=Alice count=3")

// This would be a compile-time error (commented):
// printfn "count=%d" name
