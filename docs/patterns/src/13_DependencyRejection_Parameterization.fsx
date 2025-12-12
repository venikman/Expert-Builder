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
    let mutable r = None
    for c in commands do
        match c with
        | Log msg -> printfn "LOG %s" msg
        | Result b -> r <- Some b
    r

let test1 =
    compareStrings (fun _ -> ()) "a" "a"
let test2 =
    compareStringsNoIO "a" "b" |> interpret

assert (test1 = true)
assert (test2 = Some false)
