# Most frameworks focus on plumbing

They ship with tools to define a REST API for your frontends, an ORM to transform objects into something your database understands, and if you're lucky, a pub/sub system for some light realtime functionality.

As your application evolves, your time becomes increasingly devoted to juggling these disparate systems and building the pipes that hold it all together.

Riptide eases this burden by taking the plumbing - how data is moved around, transformed, and saved - and making it invisible. You focus exclusively on the logic of your application which can be implemented as simple cause and effect rules using Riptide's tooling.

Riptide has been enormously productive for us but choosing a framework shouldn't be done without due dilligence. To make this easier, we put together [our best arguments against Riptide](/docs/caveats) and also [where our inspiration came from](/docs/inspiration) so you can make an informed decision.

* * *

## One data model — everywhere

Traditional frameworks require you to think about your data in numerous ways:
- Objects in your application
- Relational tables in your database
- Events in your message queue

Riptide represents all of your data as one big tree no matter where you are: server, client or database

```json
{
  "users": {
    "USR1": {
      "key": "USR1",
      "name": "Jack Sparrow",
    },
    "USR2": {...},
    "USR3": {...}
  },
  "todos": {
    "TOD1": {
      "key": "TOD1",
      "user": "USR1",
      "created": 1586068269822,
      "text": "Find the Black Pearl",
    }
    ...
  }
}
```

Data is modified by issuing Mutations. Mutations can merge new fields or delete existing ones. Clients can query and subscribe to parts of the tree they care about and that data will be kept in sync in realtime.


Take a deep dive into [Mutations](/mutations), [Queries](/queries), and [Stores](/stores)
* * *

## Composable logic

Riptide Interceptors let you define simple rules using Elixir's pattern matching that trigger conditionally when data is written or read. Take the following Mutation that creates a new Todo.

```json
{
  "merge":{
    "todos":{
      "TOD2":{
        "key": "TOD2",
        "text": "Return cursed Aztec gold"
      }
    }
  }
}
```

It will trigger the following Interceptor which effectively says whenever a Todo is created, record the current time and user who created it.

```elixir
defmodule Todo.Created do
  use Riptide.Interceptor

  def before_mutation(
        # Match path being written to
        ["todos", _key],
        # Match fields being merged
        %{ merge: %{ "key" => _ }},
        # Full mutation
        _full,
        # Connection state
        state
      ) do
    {
      :merge,
      %{
        "created" => :os.system_time(:millisecond),
        "user" => state.user
      }
    }
  end
end
```

This results in the following data being written

```json
{
  "todos":{
    "TOD2":{
      "key": "TOD2",
      "text": "Return cursed Aztec gold",
      "created": 1586068269822,
      "user": "USR1"
    }
  }
}
```

Interceptors are simple but powerful. Even the most complex business logic can be broken down into a collection of composable, independent and easily digestable Interceptors.

[Learn more about the various interceptors available in Riptide](/interceptors)

* * *

## Realtime by default

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Pretium vulputate sapien nec sagittis aliquam malesuada bibendum arcu vitae. Lobortis scelerisque fermentum dui faucibus in ornare quam viverra orci. Pellentesque id nibh tortor id aliquet lectus.

<!-- 
# Beyond REST, ORMs and Pub/Sub

Most application frameworks ship with tools to define a REST API for your frontends, an ORM to transform incoming data into something your database understands, and if you're lucky, a pub/sub system to keep everything in sync.  

This approach your energy is spent juggling these disparate systems and building the glue that holds them together. Nevermind the tools you're missing to manage your increasingly complex business logic.  

Riptide eases this pain by taking a functional approach. -->
