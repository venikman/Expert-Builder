// Prefer map/filter/fold over manual loops for collection transforms.

let xs = [1;2;3;4;5]

let squares = xs |> List.map (fun x -> x*x)
let evens = xs |> List.filter (fun x -> x % 2 = 0)
let sum = xs |> List.fold (fun acc x -> acc + x) 0

assert (squares = [1;4;9;16;25])
assert (evens = [2;4])
assert (sum = 15)

printfn "OK: squares=%A evens=%A sum=%d" squares evens sum
