// Single-case union types: avoid "primitive obsession".
// Use a "smart constructor" to validate at the boundary.

type EmailAddress = EmailAddress of string

module EmailAddress =
    let value (EmailAddress s) = s
    let tryCreate (s:string) =
        // tiny validation example only
        if System.String.IsNullOrWhiteSpace s then None
        elif s.Contains("@") then Some (EmailAddress s)
        else None

let ok = EmailAddress.tryCreate "x@y.com"
let bad = EmailAddress.tryCreate "not-an-email"

assert (ok |> Option.map EmailAddress.value = Some "x@y.com")
assert (bad = None)

printfn "OK: %A" ok
