---
title: Stack
date: 2026-05-14T00:27:35+08:00
edited_at: 2026-05-13T16:41:51.639Z
author: chinono
path: /blog/Stack
---

## A Quick Recap: Where Stacks Fit In

Before we get to stacks, let's place them on the map. In Java, almost every data structure lives inside something called the **Collection Framework**. It's a family tree of interfaces and classes that all share the same basic vocabulary — things like `add`, `remove`, `size`, `contains`, and so on.

Here's a simplified view of the hierarchy:

```
                       Iterable
                          |
                      Collection
            ______________|______________
           |              |              |
          List          Queue           Set
        /  |  \           |            /  |  \
ArrayList LinkedList    Deque      HashSet ...
Vector                ArrayDeque
  |
Stack
```

The piece I want you to notice: **`Stack`** **lives under** **`Vector`, which lives under** **`List`**. That's a hint about what a stack actually is.

### What's a List, Again?

A **List** is an Abstract Data Type (ADT) that stores items in a sequential order. Think of:

* a list of students in a class

* a list of available hotel rooms

* a list of books on a shelf

The common operations you can do on a list:

* **Retrieve** an element

* **Insert** a new element

* **Delete** an element

* Check how many elements it has

* Check whether some element is inside

* Check if it's empty

There are two classic ways to *implement* a list under the hood:

1. **Using an array** — fast random access by index, but inserting/removing from the middle is slow (you have to shift everything).
2. **Using a linked list** — fast insertion/deletion anywhere, but slower to jump to a specific index.
   Keep this trade-off in your back pocket. It's going to come up again very soon.

> **Quick mental model:** an array is like a row of numbered lockers — you can open locker #47 instantly, but rearranging them is a pain. A linked list is like a treasure hunt — each clue points to the next, so inserting a new clue is easy, but finding the 47th clue means following 46 others first.

## Introducing the Stack

Here's the one-sentence definition you should remember forever:

> **A stack is a list where elements are accessed, inserted, and deleted only from one end — called the** ***top*****.**

That's it. Everything else about stacks follows from this constraint.

### The LIFO Principle

Because you can only add and remove from the top, the *last* item you put in is always the *first* item you take out. We call this **LIFO**: **Last-In, First-Out**.

Think of a stack of plates in a cafeteria:

```
        🍽️   ← top (last one placed, first one taken)
        🍽️
        🍽️
        🍽️   ← bottom
```

You don't pull a plate from the middle of the stack — you take the one on top. If you want the bottom plate, tough luck, you have to remove all the ones above it first.

Other real-world examples:

* A pile of pancakes (the one on top gets eaten first)

* The browser's back button history (last page you visited is the first one you go back to)

* The "undo" function in your text editor (your last action is the first to be undone)

### The Three Core Methods

Every stack supports three fundamental operations:

| Method                | What it does                                  |
| --------------------- | --------------------------------------------- |
| `push(x)`             | Adds element `x` to the top                   |
| `pop()`               | Removes **and returns** the top element       |
| `peek()` (or `top()`) | Returns the top element *without* removing it |

Sometimes you'll also see:

* `isEmpty()` — returns `true` if the stack has no elements

* `size()` (or `getSize()`) — returns how many elements are in the stack

That's the entire stack interface. Beautifully small.

### A Worked Example

Let's trace through what happens with the following operations:

```
1. Push A
2. Push B
3. Push C
4. Pop  (removes C)
5. Pop  (removes B)
6. Push D
```

Here's what the stack looks like after each step:

```
Step 1: Push A     Step 2: Push B     Step 3: Push C
                                          | C |  ← top
                      | B |  ← top        | B |
   | A |  ← top       | A |               | A |
   +---+              +---+               +---+
 
 
Step 4: Pop (C)    Step 5: Pop (B)    Step 6: Push D
                                          | D |  ← top
   | B |  ← top                           | A |
   | A |              | A |  ← top        +---+
   +---+              +---+
```

After step 6, the stack contains `A` at the bottom and `D` at the top. Notice that `B` and `C` are gone — they were popped off and are no longer in the structure.

> **Try it yourself:** there's a great interactive visualization at [Daniel Liang's Stack Animation](https://yongdanielliang.github.io/animation/web/Stack.html). Highly recommended for getting an intuitive feel.

## Implementing a Stack in Java

Now for the fun part — building one ourselves.

### Why an ArrayList Works So Well

Recall the trade-off between arrays and linked lists. With a stack, we **only ever add and remove from one end**. That's exactly the operation that arrays are *fast* at. We don't need fancy middle-insertion — we just need a fast `add to end` and `remove from end`, both of which are O(1) on an ArrayList.

So for a stack, an ArrayList is the more efficient backing structure.

Conceptually:

```
                  Top
                   ↓
      |  C  |
      |  B  |        Same data as ArrayList:
      |  A  |   →    [ A, B, C ]
      +-----+               ↑
       Bottom              "back"
```

The top of the stack corresponds to the *end* of the array list. The bottom is index 0.

### Two Design Choices: Inheritance vs Composition

When designing the `GenericStack` class, we have two ways to use ArrayList under the hood:

**Option 1: Inheritance** — make `GenericStack` *extend* `ArrayList`.

```
ArrayList ←─── GenericStack   (GenericStack IS-A ArrayList)
```

**Option 2: Composition** — give `GenericStack` an ArrayList as a *private field*.

```
GenericStack ◇─── ArrayList   (GenericStack HAS-A ArrayList)
```

Both work, but **composition is generally preferred** for stacks. Why? Because if we use inheritance, our stack would inherit *all* of ArrayList's methods — including things like `add(int index, Object o)` that let you insert in the middle. That breaks the whole point of a stack: you'd no longer have a guarantee that things only enter/leave from the top.

Composition lets us hide the ArrayList completely and only expose the stack operations we want. **Composition gives us encapsulation; inheritance leaks the abstraction.**

### The GenericStack Class

Here's the full implementation using composition:

```java
public class GenericStack<E> {
    private java.util.ArrayList<E> list = new java.util.ArrayList<>();
 
    public int getSize() {
        return list.size();
    }
 
    public E peek() {
        return list.get(getSize() - 1);
    }
 
    public void push(E o) {
        list.add(o);
    }
 
    public E pop() {
        E o = list.get(getSize() - 1);
        list.remove(getSize() - 1);
        return o;
    }
 
    public boolean isEmpty() {
        return list.isEmpty();
    }
 
    @Override
    public String toString() {
        return "stack: " + list.toString();
    }
}
```

Let's read through it:

* The `<E>` makes it **generic** — you can have a `GenericStack<String>`, a `GenericStack<Integer>`, whatever you need.

* `push(o)` is literally just `list.add(o)` — adding to the end.

* `peek()` is `list.get(size - 1)` — looking at the last element.

* `pop()` reads the last element, removes it from the list, and returns it.

### Handling the Empty Case

There's a subtle problem: what if someone calls `pop()` or `peek()` on an empty stack? You'd get an `IndexOutOfBoundsException` — not very informative.

A cleaner approach is to check first and throw a meaningful exception:

```java
public E pop() {
    if (isEmpty()) {
        throw new EmptyStackException();
    }
    E o = list.get(getSize() - 1);
    list.remove(getSize() - 1);
    return o;
}
```

This is what Java's own built-in `java.util.Stack` does. When you write production code, you'd want this kind of defensive check.

### Testing It Out

```java
public class TestGenericStack {
    public static void main(String[] args) {
        GenericStack<String> stack = new GenericStack<>();
 
        stack.push("Tom");
        System.out.println("(1) " + stack);
 
        stack.push("Susan");
        System.out.println("(2) " + stack);
 
        stack.push("Kim");
        stack.push("Michael");
        System.out.println("(3) " + stack);
 
        System.out.println("(4) " + stack.pop());
        System.out.println("(5) " + stack.pop());
        System.out.println("(6) " + stack);
    }
}
```

Output:

```
(1) stack: [Tom]
(2) stack: [Tom, Susan]
(3) stack: [Tom, Susan, Kim, Michael]
(4) Michael
(5) Kim
(6) stack: [Tom, Susan]
```

Notice how `Michael` came out first (he was pushed last), then `Kim`. That's LIFO in action.

## Postfix Evaluation: A Real Use Case for Stacks

This is where stacks earn their keep. Let me show you a beautiful application.

### What Is Postfix Notation?

You've been writing math your whole life like this:

```
3 + 4
```

That's called **infix** notation — the operator (`+`) is *in between* the operands. It's how humans read math.

But there's another way to write expressions: **postfix** notation, also called **Reverse Polish Notation (RPN)**, where the operator comes *after* its operands:

```
3 4 +
```

It looks weird at first, but RPN has three wonderful properties:

1. **No precedence rules needed.** You don't have to memorize PEMDAS / BODMAS.
2. **No parentheses needed.** Ever.
3. **Faster for computers to evaluate** — fewer memory accesses.

### Infix → Postfix Examples

| Infix               | Postfix (RPN)       | Why                                                           |
| ------------------- | ------------------- | ------------------------------------------------------------- |
| `a + b * c`         | `a b c * +`         | `*` binds tighter than `+`, so it's computed first            |
| `(a + b) * c`       | `a b + c *`         | Parentheses force `+` first                                   |
| `(a*b + c) / d + e` | `a b * c + d / e +` | Inner subexpression first, then division, then final addition |

Read each postfix expression left to right and you'll notice: **every operator immediately follows its two operands**. That's the rule.

### The Stack-Based Algorithm

Here's the magical part. Evaluating a postfix expression is shockingly simple with a stack:

```
1. Scan the expression left to right, token by token.
2. If the token is an OPERAND (a number):
       → push it onto the stack.
3. If the token is an OPERATOR (+, -, *, /, ^):
       → pop two operands off the stack
         (the first pop is the right operand,
          the second pop is the left operand)
       → compute: left OPERATOR right
       → push the result back onto the stack.
4. When done, the single value left on the stack is the answer.
```

That's the whole algorithm.

### Worked Example: Evaluating `4 3 5 * +`

Let me trace it step by step:

```
Token: 4         Token: 3         Token: 5
Push 4           Push 3           Push 5
 
  |   |            | 3 |            | 5 |
  | 4 |            | 4 |            | 3 |
  +---+            +---+            | 4 |
                                    +---+
 
 
Token: *                          Token: +
Pop 5 (right), Pop 3 (left)       Pop 15 (right), Pop 4 (left)
Compute 3 * 5 = 15                Compute 4 + 15 = 19
Push 15                           Push 19
 
  | 15 |                            | 19 |
  |  4 |                            +----+
  +----+
 
Final answer: 19
```

Sanity check: in infix, `4 3 5 * +` corresponds to `4 + (3 * 5) = 4 + 15 = 19`. ✓

### When Things Go Wrong: Error Detection

A beautiful side-effect of this algorithm: **the state of the stack tells you about errors.**

**Error case 1: Too many operators**

Expression: `3 8 + * 9`

```
Push 3, push 8   →   stack: [3, 8]
See "+", pop both, compute 3+8 = 11, push   →   stack: [11]
See "*"  →   need to pop two operands, but stack has only ONE element!
```

The moment we try to apply `*` with only one thing on the stack, we know the input is malformed.

**Error case 2: Too many operands**

Expression: `9 8 + 7`

```
Push 9, push 8   →   stack: [9, 8]
See "+", pop, compute 17, push   →   stack: [17]
Push 7   →   stack: [17, 7]
End of input — but the stack has TWO elements!
```

A valid postfix expression always ends with exactly one number on the stack. If there's more, something was left dangling.

### Java Implementation

Here's a working `PostfixEvaluation` class. I've kept it close to the lecture version but added comments:

```java
public class PostfixEvaluation {
    public static void main(String[] args) {
        System.out.println("Testing PostfixEvaluation:\n");
        System.out.println("2 3 + 4 * 5 - : "
                + evaluatePostfix("2 3 + 4 * 5 -") + "\n");
        System.out.println("2 3 * 4 2 - / 5 6 * + : "
                + evaluatePostfix("2 3 * 4 2 - / 5 6 * +") + "\n");
        System.out.println("2 4 - 3 ^ 5 + : "
                + evaluatePostfix("2 4 - 3 ^ 5 +") + "\n");
        System.out.println("Done.");
    }
 
    /** Evaluates a postfix expression and returns the result. */
    public static double evaluatePostfix(String postfix) {
        GenericStack<Double> valueStack = new GenericStack<>();
        String[] tokens = postfix.split(" ");
 
        for (String token : tokens) {
            if (isNumeric(token)) {
                valueStack.push(new Double(token));
            } else if (token.equals("+") || token.equals("-")
                    || token.equals("*") || token.equals("/")
                    || token.equals("^")) {
                Double operandTwo = valueStack.pop();   // right operand
                Double operandOne = valueStack.pop();   // left operand
                Double result = compute(operandOne, operandTwo, token);
                valueStack.push(result);
            }
        }
 
        return valueStack.peek();
    }
 
    public static boolean isNumeric(String str) {
        try {
            double d = Double.parseDouble(str);
        } catch (NumberFormatException nfe) {
            return false;
        }
        return true;
    }
 
    private static Double compute(Double operandOne, Double operandTwo,
                                  String operator) {
        double result;
        switch (operator) {
            case "+": result = operandOne + operandTwo; break;
            case "-": result = operandOne - operandTwo; break;
            case "*": result = operandOne * operandTwo; break;
            case "/": result = operandOne / operandTwo; break;
            case "^": result = Math.pow(operandOne, operandTwo); break;
            default:  result = 0; break;  // unexpected character
        }
        return result;
    }
}
```

Output:

```
Testing PostfixEvaluation:
 
2 3 + 4 * 5 - : 15.0
 
2 3 * 4 2 - / 5 6 * + : 33.0
 
2 4 - 3 ^ 5 + : -3.0
 
Done.
```

### The Critical Pop Order

One thing I want to highlight, because it's a common bug:

```java
Double operandTwo = valueStack.pop();   // FIRST pop = RIGHT operand
Double operandOne = valueStack.pop();   // SECOND pop = LEFT operand
```

Why does order matter? Because subtraction and division aren't commutative. `5 - 3 ≠ 3 - 5`.

When evaluating `5 3 -`, you push 5, then push 3. The first thing you pop is **3**, which is the *right* side of the subtraction (`5 - 3`). The second pop is **5**, the left side. Get this wrong and your calculator returns negative answers for everything.

## Wrap-Up

Let's recap what we covered:

* A **stack** is a list restricted to insertions and deletions at one end — the **top**.

* It follows the **LIFO** principle: last in, first out.

* The core operations are `push`, `pop`, and `peek`, all of which are O(1).

* We implement stacks efficiently using an **ArrayList**, preferably via **composition** rather than inheritance, so we don't accidentally expose list operations that violate the stack discipline.

* A classic application is evaluating **postfix expressions** (Reverse Polish Notation). The algorithm is short and elegant, and the stack's state at any point also helps detect malformed input.
  Stacks show up *everywhere* once you start looking:

* Function call stacks in every programming language

* Undo/redo systems

* Browser history

* Expression parsing in compilers

* Backtracking algorithms (think: solving a maze)

* Balanced parenthesis checking
  Next time you press `Ctrl+Z`, give a small nod to the stack working quietly behind the scenes.

