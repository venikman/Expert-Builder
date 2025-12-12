// Guideline: use Result for expected domain failures, exceptions for unexpected/bug/diagnostics.
// This file shows BOTH patterns.

let divideExpected (x:int) (y:int) =
    if y = 0 then Error "divide by zero"
    else Ok (x / y)

let divideFailFast (x:int) (y:int) =
    // raises on y=0. Intended for internal use where y=0 indicates a bug.
    x / y

assert (divideExpected 10 2 = Ok 5)
assert (divideExpected 10 0 = Error "divide by zero")

let caught =
    try
        divideFailFast 10 0 |> Ok
    with ex ->
        Error (ex.GetType().Name)

assert (caught |> Result.isError)

printfn "OK: caught=%A" caught
