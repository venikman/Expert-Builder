// Reader monad sketch: dependency injection via an environment.

type Reader<'env,'a> = Reader of ('env -> 'a)

module Reader =
    let run env (Reader f) = f env
    let map f (Reader g) = Reader (g >> f)
    let bind f (Reader g) =
        Reader (fun env ->
            let a = g env
            let (Reader h) = f a
            h env)

type Env = { Prefix: string }

let getPrefix : Reader<Env,string> = Reader (fun env -> env.Prefix)

let greet name =
    getPrefix
    |> Reader.map (fun p -> p + name)

let env = { Prefix = "Hello, " }
let msg = Reader.run env (greet "Alice")

assert (msg = "Hello, Alice")
printfn "OK: %s" msg
