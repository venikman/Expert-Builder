// Functional core / imperative shell:
// - core: pure functions (deterministic, testable)
// - shell: I/O, time, randomness, logging, etc.

type LineItem = { Qty:int; UnitPrice: decimal }
type Invoice = { Items: LineItem list }

module Core =
    let total (inv:Invoice) =
        inv.Items
        |> List.sumBy (fun li -> decimal li.Qty * li.UnitPrice)

module Shell =
    let run () =
        // pretend this came from a DB or API
        let inv = { Items = [ {Qty=2; UnitPrice=10m}; {Qty=1; UnitPrice=5m} ] }
        let t = Core.total inv
        printfn "total=%M" t
        t

let t = Shell.run ()
assert (t = 25m)
