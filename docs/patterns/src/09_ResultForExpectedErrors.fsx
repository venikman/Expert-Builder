// Result<'ok,'err>: expected errors become part of the type.
// Use Ok/Error and chain with Result.bind.

let tryParseInt (s:string) =
    match System.Int32.TryParse s with
    | true, i -> Ok i
    | false, _ -> Error (sprintf "not an int: '%s'" s)

let nonNegative x =
    if x >= 0 then Ok x else Error "must be >= 0"

let parseAndValidate s =
    tryParseInt s |> Result.bind nonNegative

assert (parseAndValidate "12" = Ok 12)
assert (parseAndValidate "-1" = Error "must be >= 0")

printfn "OK: %A" (parseAndValidate "12")
