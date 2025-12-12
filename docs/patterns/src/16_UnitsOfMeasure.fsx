// Units of measure: prevent unit-mismatch at compile time.

[<Measure>] type m   // meters
[<Measure>] type s   // seconds

let distance = 100.0<m>
let time = 9.58<s>

let speed = distance / time   // type: float<m/s>

assert (speed > 10.0<m/s>)

printfn "OK: speed=%A" speed

// This would be a compile-time error (commented):
// let bad = distance + time
