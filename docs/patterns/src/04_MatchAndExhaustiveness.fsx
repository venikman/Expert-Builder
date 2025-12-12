// Pattern matching: handle all cases (exhaustive matches).

let describeList lst =
    match lst with
    | [] -> "empty"
    | [x] -> sprintf "singleton: %A" x
    | x::xs -> sprintf "head=%A tail_len=%d" x (List.length xs)

let firstOrNone lst =
    match lst with
    | x::_ -> Some x
    | [] -> None

assert (describeList [] = "empty")
assert (describeList [1] = "singleton: 1")
assert (firstOrNone [1;2] = Some 1)
assert (firstOrNone [] = None)

printfn "OK: %s" (describeList [1;2;3])
