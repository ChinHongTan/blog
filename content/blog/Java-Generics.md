---
title: Java Generics
date: 2026-05-12T18:47:15+08:00
edited_at: 2026-05-12T11:27:13.534Z
author: chinono
path: /blog/Java-Generics
---

## 1. What even *is* a generic?

**Generic = the ability to parameterize types.**

That sounds abstract, so let me translate. You already know about **parameters in methods**: you write a method once and pass in different *values*.

```java
public int square(int x) { return x * x; }
 
square(3);   // works
square(10);  // works
```

A **generic** does the same thing — but instead of passing in a *value*, you pass in a **type**.

```java
ArrayList<String>  cities  = new ArrayList<>();   // a list of Strings
ArrayList<Integer> scores  = new ArrayList<>();   // a list of Integers
ArrayList<Circle>  shapes  = new ArrayList<>();   // a list of Circles
```

The class `ArrayList` is written *once*. You decide what kind of thing it stores by plugging in a type between the `<>`.

## 2. Why bother? (a.k.a. the "Why Generics?" rant)

Before Java 1.5, you had to write things like this:

```java
ArrayList list = new ArrayList();    // raw type — no <>
list.add("hello");
String s = (String) list.get(0);     // manual cast required
```

Two problems:

1. **You had to cast everything.** Ugly.
2. **No type safety.** You could `list.add("hello")` and then `list.add(42)` and the compiler wouldn't say a word — until your program crashed at runtime with a `ClassCastException`.
   With generics, both problems disappear:

```java
ArrayList<String> list = new ArrayList<>();
list.add("hello");
String s = list.get(0);              // ✅ no cast needed
list.add(42);                        // ❌ compile error — Java stops you immediately
```

**The big win:** errors get caught at **compile time**, not after your program is running in production. That's the entire selling point.

## 3. Meeting `ArrayList` properly

Arrays in Java have a fixed size — once you do `new int[10]`, you've got 10 slots and that's it. `ArrayList` solves this by being a **resizable** container.

Here's the class signature you'll see in the docs:

```
java.util.ArrayList<E>
```

That `<E>` is the **formal generic type**. The letter `E` stands for *Element*. When you actually use it, you replace `E` with a real type:

```java
ArrayList<String> cities = new ArrayList<String>();
// or, since Java 7, the shorter "diamond" form:
ArrayList<String> cities = new ArrayList<>();
```

### Useful methods

| Method                | What it does                  |
| --------------------- | ----------------------------- |
| `add(E o)`            | Append an element to the end  |
| `add(int index, E o)` | Insert at a specific position |
| `get(int index)`      | Retrieve element at index     |
| `set(int index, E o)` | Replace element at index      |
| `remove(Object o)`    | Remove first occurrence       |
| `remove(int index)`   | Remove by index               |
| `size()`              | How many elements             |
| `contains(Object o)`  | Does it contain this?         |
| `indexOf(Object o)`   | Position of first match       |
| `isEmpty()`           | true if size == 0             |
| `clear()`             | Wipe everything               |

### Array vs ArrayList — side by side

| Operation | Array                          | ArrayList                                     |
| --------- | ------------------------------ | --------------------------------------------- |
| Create    | `String[] a = new String[10];` | `ArrayList<String> list = new ArrayList<>();` |
| Access    | `a[index]`                     | `list.get(index)`                             |
| Update    | `a[index] = "London";`         | `list.set(index, "London");`                  |
| Size      | `a.length`                     | `list.size()`                                 |
| Add       | *(not possible — fixed size!)* | `list.add("London");`                         |
| Remove    | *(not possible)*               | `list.remove(index);`                         |

## 4. The naming convention you'll see everywhere

Generic type parameters are written as **single uppercase letters**. This is a convention, not a rule, but everyone follows it because otherwise you can't tell type parameters apart from real class names.

| Letter     | Meaning                                       |
| ---------- | --------------------------------------------- |
| `E`        | **E**lement (used in collections — `List<E>`) |
| `K`        | **K**ey (used in maps — `Map<K, V>`)          |
| `V`        | **V**alue (used in maps — `Map<K, V>`)        |
| `N`        | **N**umber                                    |
| `T`        | **T**ype (general placeholder)                |
| `S, U, V…` | Extra type params when you need more than one |

## 5. One important restriction: only reference types

```java
ArrayList<Integer> a = new ArrayList<>();   // ✅ ok
ArrayList<Double>  b = new ArrayList<>();   // ✅ ok
ArrayList<int>     c = new ArrayList<>();   // ❌ compile error
```

The type parameter **must be a reference type** (a class). Primitives (`int`, `double`, `char`, `boolean`) are not allowed. Use their wrapper classes (`Integer`, `Double`, `Character`, `Boolean`) instead.

## 6. Writing your *own* generic class

You're not limited to using `ArrayList`. You can write your own generic class. The syntax:

```java
public class ClassName<E> {
    // use E like a normal type inside
}
```

Here's a tiny example — a `Box` that can hold any single thing:

```java
public class GenericBox<T> {
    private T item;
    private boolean full;
 
    public GenericBox() { full = false; }
 
    public void store(T a) {
        this.item = a;
        full = true;
    }
 
    public void remove() {
        item = null;
        full = false;
    }
 
    public String toString() {
        return full ? item.toString() : "nothing";
    }
}
```

And in use:

```java
GenericBox<String>  box1 = new GenericBox<>();
GenericBox<Integer> box2 = new GenericBox<>();
 
box1.store("Hello World");
box2.store(100);
 
// box1.store(100);   // ❌ compile error — box1 only takes Strings
```

Compare this to the old non-generic version using `Comparable item` — that one would *compile* even if you mixed a `String` and an `Integer`, then **explode at runtime** when you tried `compareTo`. Generics catch it earlier. Beautiful.

### Generic interfaces work the same way

```java
public interface InterfaceName<E> { /* ... */ }
 
// real-world examples you already know:
public interface Comparable<E> { /* ... */ }
public interface Edible<E>     { /* ... */ }
```

And you can declare a class as a subtype of a generic interface:

```java
public class String implements Comparable<String> { /* ... */ }
```

## 7. Generic methods

You can make a *single method* generic, even if its class isn't generic.

**Syntax:**

```java
public static <E> returnType methodName(E parameter) { ... }
```

The `<E>` sits **right before the return type**. Examples:

```java
public static <E> void print(E[] list) {
    for (int i = 0; i < list.length; i++)
        System.out.print(list[i] + " ");
    System.out.println();
}
 
public <E> boolean isFilled(E filled) { /* ... */ }
```

Calling it:

```java
Integer[] integers = {1, 2, 3, 4, 5};
String[]  strings  = {"London", "Paris", "New York", "Austin"};
 
GenericMethodDemo.<Integer>print(integers);   // explicit type
GenericMethodDemo.<String>print(strings);     // explicit type
GenericMethodDemo.print(integers);            // or just let Java figure it out
```

The compiler is usually smart enough to infer the type from the argument, so the explicit `<Integer>` is optional in most cases.

## 8. Bounded generics — "I want *any* type, but only certain ones"

Sometimes you want a generic that accepts *any* type — *as long as it has certain capabilities*. Example: a method that only makes sense for numbers.

You use the `extends` keyword:

```java
public <U extends Number> void inspect(U u) { /* ... */ }
```

This says: "`U` can be any type, **but it has to be a subtype of** **`Number`**." So `Integer`, `Double`, `Float` all work — `String` does not.

```java
public class BoundedGeneric2<T extends Number> {
    T data;
    public BoundedGeneric2(T t) { data = t; }
    void display() {
        System.out.println("Value is : " + data);
        System.out.println(" and type is " + data.getClass().getName());
    }
}
 
// Usage:
BoundedGeneric2<Integer> b1 = new BoundedGeneric2<>(3);      // ✅
BoundedGeneric2<Double>  b2 = new BoundedGeneric2<>(3.14);   // ✅
BoundedGeneric2<String>  b3 = new BoundedGeneric2<>("Hi");   // ❌ compile error
```

### Trivia

An **unbounded** generic `<E>` is secretly the same as `<E extends Object>` — because every class in Java extends `Object`.

## 9. Raw types (and why they're a trap)

A **raw type** is a generic class used without specifying a type parameter:

```java
ArrayList list = new ArrayList();   // raw — no <>
```

This is *roughly* equivalent to `ArrayList<Object>`. Java still allows raw types so old pre-2004 code keeps working (this is called **backward compatibility**). But you should not write new code this way.

### Why raw types are unsafe

Look at this innocent-looking method:

```java
public static Comparable max(Comparable o1, Comparable o2) {
    if (o1.compareTo(o2) > 0) return o1;
    else return o2;
}
```

It compiles. It looks fine. Then:

```java
Max.max("Welcome", 23);   // 💥 ClassCastException at runtime
```

The compiler can't catch the bug because `Comparable` is raw. Fix it with generics:

```java
public static <E extends Comparable<E>> E max(E o1, E o2) {
    if (o1.compareTo(o2) > 0) return o1;
    else return o2;
}
 
Max.max("Welcome", 23);   // ❌ now caught at compile time
```

## 10. Wildcards: `?`, `? extends T`, `? super T`

This part trips people up, so go slowly.

### Why wildcards exist

You might think: "Integer is a subtype of Number, so `ArrayList<Integer>` should be a subtype of `ArrayList<Number>`, right?"

**Wrong.** In Java, `ArrayList<Integer>` and `ArrayList<Number>` are *unrelated* types. This code fails to compile:

```java
public static void display(ArrayList<Number> list) { /* ... */ }
 
ArrayList<Integer> list1 = new ArrayList<>();
display(list1);   // ❌ compile error
```

The fix: **wildcards**. Use `?` to say "I don't care what specific type — just a list of something."

### The three forms

| Form            | Name                   | Meaning                         |
| --------------- | ---------------------- | ------------------------------- |
| `<?>`           | Unbounded wildcard     | Any type at all                 |
| `<? extends T>` | Upper-bounded wildcard | Some unknown **subtype** of T   |
| `<? super T>`   | Lower-bounded wildcard | Some unknown **supertype** of T |

`<?>` is exactly the same as `<? extends Object>`.

### Fixing the earlier example

```java
public static void display(ArrayList<?> list) { /* ... */ }
// now display(list1) works for ArrayList<Integer>, ArrayList<Double>, etc.
```

## 11. Type erasure (the magic trick behind generics)

Here's the surprising part: **at runtime, generics don't exist.**

When the Java compiler is done with your code, it **erases** all the type parameters. The compiled bytecode looks like the old, pre-generics code. This is called **type erasure**.

What happens:

* `<E>` → replaced with `Object`

* `<E extends Number>` → replaced with `Number` (the bounded type)

* Casts are auto-inserted where needed
  So this:

```java
ArrayList<String> list = new ArrayList<>();
list.add("Oklahoma");
String state = list.get(0);
```

...effectively becomes this at runtime:

```java
ArrayList list = new ArrayList();
list.add("Oklahoma");
String state = (String) list.get(0);
```

Generics are basically **a compile-time-only feature**. They protect you while you're writing code, then quietly disappear.

### A weird consequence

```java
ArrayList<String>  list1 = new ArrayList<>();
ArrayList<Integer> list2 = new ArrayList<>();
 
System.out.println(list1 instanceof ArrayList);   // true
System.out.println(list2 instanceof ArrayList);   // true
```

Even though `ArrayList<String>` and `ArrayList<Integer>` look like two different types, **only one** **`ArrayList`** **class is actually loaded into the JVM**. The `<String>` and `<Integer>` parts vanish.

## 12. The four restrictions on generics

Because of type erasure, there are things you simply *cannot* do. Memorize these — they show up on every Java generics exam.

### ❌ Restriction 1: Can't create an instance of `E`

```java
E object = new E();   // compile error
```

Why? `new E()` would run at runtime, but by then `E` has been erased. The JVM has no idea what type to actually instantiate.

### ❌ Restriction 2: Can't create a generic array

```java
E[] elements = new E[capacity];   // compile error
```

Workaround:

```java
E[] elements = (E[]) new Object[capacity];   // ⚠️ unchecked warning
```

This compiles but the compiler can't promise the cast will always succeed at runtime. Use carefully.

### ❌ Restriction 3: Generic type can't be used in a static context

```java
public class Test<E> {
    public static void m(E o1) { }    // ❌ illegal
    public static E o1;               // ❌ illegal
    static { E o2; }                  // ❌ illegal
}
```

Why? Static members belong to the *class itself*, not any specific instance. But `E` is decided per-instance, so it's meaningless in a static context.

### ❌ Restriction 4: Exception classes can't be generic

```java
public class MyException<T> extends Exception { }   // ❌ illegal
```

Why? `catch` blocks have to inspect types at runtime — but generics are erased before runtime. So you can't write `catch (MyException<String> ex)` because the JVM literally can't tell `MyException<String>` apart from `MyException<Integer>`.

## 13. Quick cheat sheet

```java
// Generic class
public class Box<T> { T item; }
 
// Multiple type parameters
public class Pair<K, V> { K key; V value; }
 
// Generic interface
public interface Comparable<E> { int compareTo(E o); }
 
// Generic method
public static <E> void print(E[] list) { /* ... */ }
 
// Bounded generic
public class NumberBox<T extends Number> { T data; }
 
// Wildcard - any type
public static void show(ArrayList<?> list) { /* ... */ }
 
// Wildcard - upper bounded
public static void sum(ArrayList<? extends Number> list) { /* ... */ }
 
// Wildcard - lower bounded
public static void fill(ArrayList<? super Integer> list) { /* ... */ }
```

