# Groc.txt

Todo.txt shopping list, battery management and general tasks tool

## Format

### Shopping

Shopping items are denoted with the `+gshop` project tag and an optional list name as a `+project` tag if you need multiple shopping lists. You can further specify what store and/or department the item is in or any other desired descriptors with `@context` tags.

```
+gshop Paper towels // Basic shopping list item in the default shopping list
+gshop +electronics USB Cable // Add to a specific shopping list
+gshop +grocery Bread @walmart // Add a store
+gshop +grocery Milk @walmart @dairy // Add a store and department
```

### Batteries

Battery management items are denoted with the `+gbatt` project tag. You can further specify a location or any other desired descriptors with `@context` tags. If there are two dates placed at the beginning of the item it denotes last time charged and creation date, if there is only one it denotes the creation date. The next due date for a batter to be charged can be specified with the `due:date` tag. Here is an example workflow for a battery:

```
2025-01-01 +gbatt Dewalt 2.0Ah @garage // Battery created, not charged yet
x 2025-01-01 2025-01-01 +gbatt Dewalt 2.0Ah @garage due:2025-02-01 // Battery charged on 2025-01-01, set next charge to 2025-02-01
2025-02-01 +gbatt Dewalt 2.0Ah @garage due:2025-02-01 // Battery due date passed, creation date set to due date
x 2025-02-05 2025-02-01 +gbatt Dewalt 2.0Ah @garage due:2025-03-05 // Battery charged on 2025-02-05, set due date to 2025-03-05
x 2025-03-01 2025-02-05 +gbatt Dewalt 2.0Ah @garage due:2025-04-01 // Battery charged before due date on 2025-03-01, set next due date to 2025-04-01
```

### Tasks

General tasks are handled just like any other todo.txt item, with priorities `(A-Z)`, dates `YYYY-MM-DD`, `+projects` and `@contexts`, with the added functionality of due dates in the `due:YYYY-MM-DD` format.
