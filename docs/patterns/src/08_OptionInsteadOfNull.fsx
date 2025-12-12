// Option<'T>: represent missing data without null.

let tryHead (xs: 'a list) =
    match xs with
    | x::_ -> Some x
    | [] -> None

let headOrDefault def xs =
    match tryHead xs with
    | Some x -> x
    | None -> def

assert (tryHead [1;2] = Some 1)
assert (tryHead [] = None)
assert (headOrDefault 0 [] = 0)

printfn "OK: headOrDefault=%d" (headOrDefault 0 [5;6])
