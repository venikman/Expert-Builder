// Dependency parameterization and (light) dependency rejection.

// Parameterization: pass in a dependency as a function parameter.
let compareStrings (log:string -> unit) (a:string) (b:string) =
    log "compareStrings: starting"
    (a = b)

// Rejection: keep I/O out of core by returning data that the shell interprets.
type Command =
    | Log of string
    | Result of bool

let compareStringsNoIO (a:string) (b:string) =
    [ Log "compareStrings: starting"
      Result (a = b) ]

let interpret (commands:Command list) =
    commands
    |> List.iter (function
        | Log msg -> printfn "LOG %s" msg
        | Result _ -> ())

    commands
    |> List.tryPick (function
        | Result b -> Some b
        | _ -> None)

let test1 =
    compareStrings (fun _ -> ()) "a" "a"
let test2 =
    compareStringsNoIO "a" "b" |> interpret

assert (test1 = true)
assert (test2 = Some false)
