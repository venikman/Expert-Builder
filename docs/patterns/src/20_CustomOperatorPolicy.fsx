// Operator policy: prefer |> and >>; avoid introducing "strange" operators unless team-agreed and local.

let add1 x = x + 1
let times2 x = x * 2

let good = 10 |> add1 |> times2
assert (good = 22)

// You *can* define custom operators, but do it sparingly and locally.
// Example (commented out):
// let (>>=) x f = f x

printfn "OK: %d" good
