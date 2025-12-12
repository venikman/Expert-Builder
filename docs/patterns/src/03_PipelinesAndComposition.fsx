// Pipelines (|>) and composition (>>) for readable flows.

let add1 x = x + 1
let times2 x = x * 2

let pipelineResult =
    10
    |> add1
    |> times2

let composed = add1 >> times2
let composedResult = composed 10

assert (pipelineResult = 22)
assert (composedResult = 22)

printfn "OK: pipeline=%d composed=%d" pipelineResult composedResult
