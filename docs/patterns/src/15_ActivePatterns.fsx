// Active patterns: encapsulate matching logic.

let (|Int|_|) (s:string) =
    match System.Int32.TryParse s with
    | true, i -> Some i
    | false, _ -> None

let describe s =
    match s with
    | Int i when i % 2 = 0 -> "even int"
    | Int _ -> "odd int"
    | _ -> "not an int"

assert (describe "2" = "even int")
assert (describe "3" = "odd int")
assert (describe "x" = "not an int")

printfn "OK: %s" (describe "42")
