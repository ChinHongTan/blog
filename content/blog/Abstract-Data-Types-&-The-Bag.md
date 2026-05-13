---
title: Abstract Data Types & The Bag
date: 2026-05-12T19:31:40+08:00
edited_at: 2026-05-13T08:21:52.980Z
author: chinono
path: /blog/Abstract-Data-Types-&-The-Bag
---

If you're new to data structures, the very first hurdle isn't a fancy algorithm — it's a way of *thinking*. Programmers separate **what** a thing does from **how** it's built. That's the whole idea behind an **Abstract Data Type (ADT)**, and once it clicks, the rest of the course starts to feel much more organized.

In this post, we'll cover two things:

1. **What an ADT actually is** (and how it differs from a data structure).
2. **The Bag** — one of the simplest possible ADTs, and a great way to see all of this in action.
   Let's go.

## Part 1: Abstract Data Types (ADTs)

### Data is everywhere — and we already organize it

Before we touch any code, look around you. Real-world data is already structured in ways you use every day:

* A **to-do list** — items in some order, you add and cross off.

* A **dictionary** — words you can look up quickly.

* A **stack of books** — you take from the top.

* A **queue for tickets** — first in, first out.

* A **road map** — connections between places.
  Each of these is a *collection of things* with rules about how you add to it, remove from it, and look stuff up. Programmers do the exact same thing with data — and the formal name for these patterns is an **Abstract Data Type (ADT)**.

### Collection vs. Container

These two words get used a lot, and they're easy to mix up:

* A **collection** is a general idea — *"a group of objects with some operations."* It says **what** you can do (add, remove, search), not **how**.

* A **container** is the actual **class** in a programming language that implements a collection. It's the concrete thing.

> Think of "collection" as the *concept* and "container" as the *code*.

### So what exactly is an ADT?

An **ADT is a conceptual model** that defines two things:

1. **The type of data** it stores.
2. **The operations** that can be performed on that data.
   And critically, it says nothing about **how** any of it is implemented. No arrays, no linked lists, no Java — just *what* the thing does.

> *Abstract* here means **irrelevant details are ignored** — like how the data is stored in memory, or what algorithm runs underneath.

A useful way to phrase it:

* **What** operations can be performed → **public** (the client can see this).

* **How** those operations are implemented → **private** (hidden from the client).
  The user of an ADT only interacts with its **interface**, never its internal logic.

### ADT vs. Data Structure — what's the difference?

This is the question that trips up almost every beginner, so let's nail it down:

| <br />        | **ADT**                               | **Data Structure**                            |
| ------------- | ------------------------------------- | --------------------------------------------- |
| **Nature**    | Conceptual / abstract                 | Concrete / actual code                        |
| **Focus**     | *What* it does                        | *How* it does it                              |
| **Language?** | Language-independent                  | Language-specific                             |
| **Example**   | "List ADT supports add/remove/access" | "Use an array or linked list to implement it" |

A few classic ADTs you'll meet soon:

* **List ADT** → supports adding, removing, and accessing elements.

* **Stack ADT** → Last-In-First-Out (LIFO). Think `push` and `pop`.

* **Queue ADT** → First-In-First-Out (FIFO). Think `enqueue` and `dequeue`.
  All three of these could be implemented using either an **array** or a **linked list** — same ADT, different data structures.

### An ADT in plain English: a cinema reservation system

Let's design an ADT for booking cinema seats — without writing a single line of code.

* **Data?** Seats. Each seat is either *reserved* or *available*.

* **Operations?**

  * Check if a seat is available

  * Reserve a seat

  * Cancel a reservation

  * Find a block of available seats together

* **Implementation?** Don't care. Not now.
  That's it — that's an ADT specification. Whether the seats end up stored in a 2D array, a database, or scribbled on paper is somebody else's problem.

### A common-thread example: cards, contacts, and decks

Consider these unrelated things:

* A deck of playing cards 

* A box of index cards with birthdays 

* The contacts list on your phone. They all share the same underlying behavior:

* Each is a **collection of elements**.

* There's a first element, a second, ..., a last.

* Given any element, there's a "next" one (unless it's the last).

* Given any element, there's a "previous" one (unless it's the first).

* You can **add** an element, **remove** one, and **search** for one by going through systematically.
  This shared structure is what would later be called the **List ADT**. Once you spot the pattern, the same ADT covers all three.

### Why bother with ADTs at all?

Two big wins:

1. **Shared data and operations** — design once, reuse everywhere. The same Bag ADT works for a shopping cart and a piggy bank.
2. **Information hiding** — users of the ADT don't need to know *how* it's implemented. The implementer can swap an array for a linked list, optimize for speed, fix bugs — and as long as the interface stays the same, no client code breaks.
   This is the heart of good software design. Hold onto it.

## Part 2: The Bag

Now let's see all of this in action with a really simple ADT: the **Bag**.

### What's a bag?

Picture a real bag — a backpack, a tote, a grocery bag. Now ask yourself:

* *Should the items be stored in a specific order?* → **No**, you just toss stuff in.

* *Can you keep repetitive items in the same bag?* → **Yes**, two apples are fine.

* *Is there a standard size limit?* → It varies. Some bags are fixed, some stretch.
  So a "bag" in programming has the same vibe:

> **The ADT Bag is a finite collection of objects in no particular order, possibly with duplicates.**

That's the whole definition. No sorting, no positions, no uniqueness — just stuff in a bag.

### What can you do with a bag?

The standard behaviors are:

* **Add** an object to the bag.

* **Remove** an object from the bag.

* Get the **number of items** inside.

* Check if the bag is **empty**.

* Count how often a specific object **appears**.

* Check whether the bag **contains** a specific object.

* **Clear** the bag.

* Get **all items** as an array.

### Designing the bag with a CRC card

Before writing code, designers often use a **CRC card** — short for **Class–Responsibility–Collaboration**. It's a sticky-note-sized summary of one class:

```
┌──────────────────────────────────────────────────────────┐
│                          Bag                             │
├──────────────────────────────────────────────────────────┤
│ Responsibilities:                                        │
│   - Get the number of items currently in the bag         │
│   - See whether the bag is empty                         │
│   - Add a given object to the bag                        │
│   - Remove an unspecified object from the bag            │
│   - Remove an occurrence of a particular object          │
│   - Remove all objects from the bag                      │
│   - Count how many times an object occurs in the bag     │
│   - Test whether the bag contains a particular object    │
│   - Look at all objects that are in the bag              │
├──────────────────────────────────────────────────────────┤
│ Collaborations:                                          │
│   - The class of objects that the bag can contain        │
└──────────────────────────────────────────────────────────┘
```

Notice we're still not writing any code. We're just listing **what the class is responsible for** and **who it works with**.

### UML notation — the same idea, more formal

Once we have the CRC card, the next step is to specify each method precisely — its name, parameters, and return type. **UML** (Unified Modeling Language) gives us a clean diagram for this:

```
┌────────────────────────────────────────┐
│                  Bag                   │
├────────────────────────────────────────┤
│                                        │
├────────────────────────────────────────┤
│ +getCurrentSize(): integer             │
│ +isEmpty(): boolean                    │
│ +add(newEntry: T): boolean             │
│ +remove(): T                           │
│ +remove(anEntry: T): boolean           │
│ +clear(): void                         │
│ +getFrequencyOf(anEntry: T): integer   │
│ +contains(anEntry: T): boolean         │
│ +toArray(): T[]                        │
└────────────────────────────────────────┘
```

The `+` means *public*. The `T` is a generic type — the bag can hold any kind of object.

Here's what each method does:

| Method                    | Purpose                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `getCurrentSize()`        | How many objects are in the bag right now.                                       |
| `isEmpty()`               | `true` if the bag has nothing in it.                                             |
| `add(newEntry)`           | Add an object. Returns `true` on success.                                        |
| `remove()`                | Remove *some* (unspecified) object. Returns it, or `null`.                       |
| `remove(anEntry)`         | Remove one occurrence of a specific object. Returns `true` if found and removed. |
| `clear()`                 | Empty the bag.                                                                   |
| `getFrequencyOf(anEntry)` | How many times this object appears.                                              |
| `contains(anEntry)`       | `true` if the object is in the bag.                                              |
| `toArray()`               | Return all items as an array.                                                    |

### Design decisions: handling weird situations

What if someone calls `remove()` on an empty bag? What should happen? There's no single right answer — there are *choices*:

* **Assume it won't happen** (risky).

* **Ignore invalid situations** (silently do nothing).

* **Guess the client's intention** (also risky).

* **Return a special value** that signals a problem (like `null`).

* **Return a boolean** — `true` for success, `false` for failure.

* **Throw an exception** — the most explicit, but interrupts flow.

Good ADT design means making these decisions *deliberately* and documenting them. The Bag we'll look at uses `null` for `remove()` on empty, and `false` from `add()` if it fails.

### From specification to Java interface

Once the methods are specified, we can write them as a **Java interface** — a contract that any Bag implementation must follow:

```java
/**
 * An interface that describes the operations of a bag of objects.
 * @author Frank M. Carrano
 */
public interface BagInterface<T> {
    /** Gets the current number of entries in this bag. */
    public int getCurrentSize();
 
    /** Sees whether this bag is empty. */
    public boolean isEmpty();
 
    /** Adds a new entry to this bag.
     *  @return True if the addition is successful, false if not. */
    public boolean add(T newEntry);
 
    /** Removes one unspecified entry from this bag, if possible.
     *  @return Either the removed entry, if the removal was successful, or null. */
    public T remove();
 
    /** Removes one occurrence of a given entry from this bag, if possible. */
    public boolean remove(T anEntry);
 
    /** Removes all entries from this bag. */
    public void clear();
 
    /** Counts the number of times a given entry appears in this bag. */
    public int getFrequencyOf(T anEntry);
 
    /** Tests whether this bag contains a given entry. */
    public boolean contains(T anEntry);
 
    /** Retrieves all entries that are in this bag.
     *  @return A newly allocated array of all the entries in the bag. */
    public T[] toArray();
}
```

This is *still* the ADT side. There's no actual storage logic yet — just a list of method signatures.

### Implementing the ADT — and why we don't care how

Now imagine we hand this interface to a programmer and ask: "Build me a `Bag` class in Java that implements this."

They might use an array. They might use a linked list. They might use a hash table or some wild custom structure. **It doesn't matter to us.** As long as the class implements `BagInterface<T>` correctly, every method does what its specification says, and we can use it.

This is the magic of ADTs in practice: **you can change implementations without breaking client code.**

### Example 1: An online shopping cart 

Here's a small program that uses `Bag` as a shopping cart:

```java
public class OnlineShopper {
    public static void main(String[] args) {
        Item[] items = {
            new Item("Bird feeder", 2050),
            new Item("Squirrel guard", 1547),
            new Item("Bird bath", 4499),
            new Item("Sunflower seeds", 1295)
        };
 
        BagInterface<Item> shoppingCart = new Bag<>();
        int totalCost = 0;
 
        // Add selected items to the cart
        for (int index = 0; index < items.length; index++) {
            Item nextItem = items[index];
            shoppingCart.add(nextItem);
            totalCost = totalCost + nextItem.getPrice();
        }
 
        // Simulate checkout
        while (!shoppingCart.isEmpty())
            System.out.println(shoppingCart.remove());
 
        System.out.println("Total cost: \t$" + totalCost / 100 + "." + totalCost % 100);
    }
}
```

Sample output:

```
Sunflower seeds $12.95
Bird bath       $44.99
Squirrel guard  $15.47
Bird feeder     $20.50
Total cost:     $93.91
```

Notice the items come out in a different order than they went in. **That's fine** — a Bag has no specified order. The shopping cart still works.

### Example 2: A piggy bank 

```java
public class PiggyBank {
    private BagInterface<Coin> coins;
 
    public PiggyBank() {
        coins = new Bag<>();
    }
 
    public boolean add(Coin aCoin) {
        return coins.add(aCoin);
    }
 
    public Coin remove() {
        return coins.remove();
    }
 
    public boolean isEmpty() {
        return coins.isEmpty();
    }
}
```

And a quick demo:

```java
PiggyBank myBank = new PiggyBank();
addCoin(new Coin(1, 2010), myBank);   // penny
addCoin(new Coin(5, 2011), myBank);   // nickel
addCoin(new Coin(10, 2000), myBank);  // dime
addCoin(new Coin(25, 2012), myBank);  // quarter
 
System.out.println("Removing all the coins:");
int amountRemoved = 0;
while (!myBank.isEmpty()) {
    Coin removedCoin = myBank.remove();
    System.out.println("Removed a " + removedCoin.getCoinName() + ".");
    amountRemoved = amountRemoved + removedCoin.getValue();
}
System.out.println("All done. Removed " + amountRemoved + " cents.");
```

Output:

```
Added a PENNY.
Added a NICKEL.
Added a DIME.
Added a QUARTER.
Removing all the coins:
Removed a QUARTER.
Removed a DIME.
Removed a NICKEL.
Removed a PENNY.
All done. Removed 41 cents.
```

Both `OnlineShopper` and `PiggyBank` use the same `Bag` class with totally different domains. **One ADT, many uses.**

### The vending machine analogy 

Here's the mental model I always come back to: **using an ADT is like using a vending machine.**

| Vending Machine                                  | ADT Bag                                            |
| ------------------------------------------------ | -------------------------------------------------- |
| You can only do what the buttons let you do.     | You can only call the methods the ADT exposes.     |
| You must understand what each button does.       | You must follow the method specifications.         |
| You can't open the machine and rearrange things. | You can't poke at the internal data directly.      |
| You can use it without knowing what's inside.    | You can use it without knowing how it stores data. |
| Still works even if they restock or rewire it.   | Still works if the implementation changes.         |

That's it. That's the whole philosophy.

### A peek ahead: how Java's `Set` interface looks

Just for context, Java's own `Set` interface is structured almost identically:

```java
public interface SetInterface<T> {
    public int getCurrentSize();
    public boolean isEmpty();
    public boolean add(T newEntry);     // avoids duplicates
    public boolean remove(T anEntry);
    public T remove();
    public void clear();
    public boolean contains(T anEntry);
    public T[] toArray();
}
```

The big difference: **a Set doesn't allow duplicates**. The Bag does. Same shape, different rules.

### Looking ahead: ArrayBag and LinkedBag

Now that the ADT is fully specified, we can implement it two different ways — and this is what the next part of the course covers:

* **`ArrayBag`** — stores entries in a fixed-size array. Simple, fast access, but capacity is bounded.

  ```
  ┌───────────────────────────┐
  │         ArrayBag          │
  ├───────────────────────────┤
  │ -bag: T[]                 │
  │ -numberOfEntries: integer │
  │ -DEFAULT_CAPACITY: integer│
  ├───────────────────────────┤
  │ (all the BagInterface     │
  │  methods, plus...)        │
  │ -isArrayFull(): boolean   │
  └───────────────────────────┘
  ```

* **`LinkedBag`** — stores entries in a chain of linked nodes. No size limit, but slightly more overhead per item.

  ```java
  public final class LinkedBag<T> implements BagInterface<T> {
      private Node firstNode;
      private int numberOfEntries;
      // ...
      private class Node { /* inner class */ }
  }
  ```

Both implement `BagInterface<T>`. Both are valid bags. The choice between them is an **implementation decision** — and the rest of the client code doesn't care which one you use. *That's* the power of an ADT.

## Quick recap

If you remember just five things from this post:

1. An **ADT** is *what* a data type does, not *how* it does it.
2. A **data structure** is the actual implementation of an ADT in code.
3. **Information hiding** lets the implementation change without breaking users.
4. A **Bag** is a finite, unordered collection that allows duplicates.
5. The same Bag ADT can power a shopping cart, a piggy bank, or anything else — that's the whole point.

