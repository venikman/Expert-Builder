// Discriminated unions (DU): model variants explicitly.

type Shape =
    | Circle of radius: float
    | Rectangle of width: float * height: float
    | Point

let area shape =
    match shape with
    | Circle r -> System.Math.PI * r * r
    | Rectangle (w,h) -> w * h
    | Point -> 0.0

let a1 = area (Circle 2.0)
let a2 = area (Rectangle (3.0,4.0))

assert (a2 = 12.0)
assert (a1 > 12.0 && a1 < 13.0) // pi*4 ≈ 12.57

printfn "OK: area(Circle 2)=%f area(Rect 3x4)=%f" a1 a2
