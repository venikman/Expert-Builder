// Railway Oriented Programming style: define small combinators for Result pipelines.

let bind f r =
    match r with
    | Ok x -> f x
    | Error e -> Error e

let map f r =
    match r with
    | Ok x -> Ok (f x)
    | Error e -> Error e

let tee f x = f x; x

let validateName (name:string) =
    if name.Trim() = "" then Error "Name must not be blank"
    else Ok name

let normalize (s:string) = s.Trim().ToLowerInvariant()

let example input =
    Ok input
    |> bind validateName
    |> map normalize
    |> map (tee (printfn "normalized=%s"))

assert (example " Alice " = Ok "alice")
assert (example "   " = Error "Name must not be blank")
