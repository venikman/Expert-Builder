// Expression-oriented: if/else and match produce values.

let absInt x =
    if x < 0 then -x else x

type TrafficLight = Red | Yellow | Green

let action light =
    match light with
    | Red -> "Stop"
    | Yellow -> "Caution"
    | Green -> "Go"

assert (absInt -3 = 3)
assert (action Red = "Stop")

printfn "OK: absInt(-3)=%d; action(Red)=%s" (absInt -3) (action Red)
