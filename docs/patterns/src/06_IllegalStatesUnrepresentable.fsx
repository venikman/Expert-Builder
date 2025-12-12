// "Make illegal states unrepresentable" via types.
// Example: contact must have at least one way to reach them.

type Email = Email of string
type PostalAddress = { Street: string; City: string }

type ContactInfo =
    | EmailOnly of Email
    | PostOnly of PostalAddress
    | EmailAndPost of Email * PostalAddress

type Contact = { Name: string; ContactInfo: ContactInfo }

let email (Email e) = e

let preferredChannel c =
    match c.ContactInfo with
    | EmailOnly e -> "email:" + email e
    | PostOnly a -> "post:" + a.City
    | EmailAndPost (e,_) -> "email:" + email e

let c1 = { Name = "Alice"; ContactInfo = EmailOnly (Email "a@example.com") }
let c2 = { Name = "Bob"; ContactInfo = PostOnly { Street="1 Main"; City="Oslo" } }

assert (preferredChannel c1 = "email:a@example.com")
assert (preferredChannel c2 = "post:Oslo")

printfn "OK: %s" (preferredChannel c1)
