// Binding not assignment: names are bound once (immutable by default).

let x = 5
let y = x + 1

// This would be a compile-time error (commented):
// x <- 6

// Instead, create a new binding (shadowing is allowed, but use sparingly):
let x2 = 6

assert (x = 5)
assert (y = 6)
assert (x2 = 6)

printfn "OK: x=%d y=%d x2=%d" x y x2
