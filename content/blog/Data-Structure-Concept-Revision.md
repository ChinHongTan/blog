---
title: Data Structure Concept Revision
date: 2026-05-11T17:59:35+08:00
edited_at: 2026-05-11T13:48:30.226Z
author: chinono
path: /blog/Data-Structure-Concept-Revision
---

## Part 1: Objects and Classes

### What is an "object"?

Forget code for a second. Look around you — a chair, a phone, a cup of coffee. Each of those is an **object**. In programming, an object is also a "thing", just a digital one. It represents some entity we want to model in our program.

Every object has three properties:

* **A unique identity** — it's distinguishable from other objects, even similar ones. Two identical-looking mugs are still two separate mugs.

* **State** — the data that describes it. A mug's state might include its color, its volume, and whether it's currently full.

* **Behavior** — the things it can do. A mug can be filled, emptied, or washed.
  In Java terms:

* State is stored in **data fields** (also called variables, properties, or attributes).

* Behavior is implemented as **methods** (functions that belong to the object).

### What is a "class"?

If an object is a real thing, a **class** is the blueprint that describes what that thing looks like.

Think of a class like a cookie cutter, and objects like the cookies. The cutter (class) defines the shape, but you can stamp out as many cookies (objects) as you like, each one its own individual piece.

Or in more formal terms: a class is a **template** or **contract** that defines what data fields and methods every object of that type will have.

> **Key idea:** An object is an *instance* of a class. You can create many objects from one class.

### A first example: the `Circle` class

Let's model circles. Every circle has a radius and can compute its area.

```java
class Circle {
    /** The radius of this circle */
    double radius = 1.0;
 
    /** Construct a circle object with default radius */
    Circle() {
    }
 
    /** Construct a circle object with a given radius */
    Circle(double newRadius) {
        radius = newRadius;
    }
 
    /** Return the area of this circle */
    double getArea() {
        return radius * radius * 3.14159;
    }
}
```

Three pieces here:

* `radius` is the **data field** (the state).

* `getArea()` is a **method** (the behavior).

* `Circle()` and `Circle(double newRadius)` are **constructors**.

### Constructors

A **constructor** is a special method that runs when you create a new object. It "constructs" the object — sets it up, gives it initial values.

Three important rules:

1. The constructor's name **must match the class name exactly**.
2. It has **no return type** — not even `void`.
3. It's invoked using the `new` keyword.
   A constructor with no parameters is called a **no-arg constructor**. If you write a class without *any* constructor at all, Java quietly gives you a free default no-arg constructor with an empty body. But the moment you write even one constructor yourself, that freebie disappears — Java won't make one for you anymore.

### Creating objects

The pattern looks like this:

```java
ClassName variableName = new ClassName();
```

So for our `Circle`:

```java
Circle myCircle = new Circle();           // uses no-arg constructor, radius = 1.0
Circle bigCircle = new Circle(25);        // uses the other constructor, radius = 25
```

`new Circle()` actually does two things:

1. Creates a new circle object in memory.
2. Returns a *reference* to it.
   That reference is what gets stored in `myCircle`. The variable doesn't *contain* the object — it *points to* it. This distinction matters, as we'll see in a moment.

### Accessing an object's members

Once you have an object, use the dot (`.`) operator:

```java
myCircle.radius          // read the data field
myCircle.getArea()       // invoke a method
```

### Primitive types vs. object types

Java has two flavors of variables:

```java
int i = 1;               // primitive: i directly holds the value 1
Circle c = new Circle(); // object: c holds a reference pointing to the Circle
```

For primitives, the variable *is* the value. For objects, the variable is a "pointer" to the object stored somewhere else in memory.

This becomes important when you assign one variable to another:

```java
// Primitives — copies the value
int i = 1, j = 2;
i = j;   // now i = 2, j = 2. Two independent copies.
 
// Objects — copies the reference, not the object
Circle c1 = new Circle(5);
Circle c2 = new Circle(9);
c1 = c2;  // c1 now points to the same object as c2 (radius 9)
          // The old radius-5 circle is now unreachable — garbage.
```

Java will eventually clean up that "garbage" object automatically. That's the **garbage collector** doing its job.

### Visibility modifiers: `public` vs. `private`

By default, a class member (a field or method) is accessible to any class in the **same package**.

Two important modifiers change this:

* **`public`** — visible everywhere. Any class, any package.

* **`private`** — visible only inside the class that declares it.

```java
public class Account {
    private double balance;   // hidden from the outside
 
    public double getBalance() {   // controlled access
        return balance;
    }
}
```

### Why should data fields be private?

This is one of the most important habits in OOP. Two reasons:

1. **To protect data.** If `balance` were public, any code anywhere could set it to a negative billion. Making it private forces callers to go through methods you control — methods that can validate, log, or refuse the change.
2. **To make the class easy to maintain.** If you later decide to store the balance differently (say, in cents instead of dollars), only the inside of the class changes. Code that uses the class via `getBalance()` and `setBalance()` doesn't have to be rewritten.
   These controlled-access methods have standard names:

* **Accessor** (getter): `getBalance()` — reads a private field.

* **Mutator** (setter): `setBalance(double value)` — modifies a private field.

## Part 2: Thinking in Objects

### Abstraction and encapsulation

These are the two big ideas behind "thinking in objects". They sound abstract (no pun intended), but they boil down to one principle: **hide the messy details, expose a clean interface.**

**Encapsulation** means bundling data and the methods that operate on it inside a single unit (a class), and hiding the internal state behind private fields. The outside world only talks to the class through its public methods.

**Abstraction** means separating *what* a class does from *how* it does it. As the user of a class, you only need to know its public contract — the method signatures. You don't need to read the implementation.

Think of a TV remote. You press the volume button. You don't care whether the remote uses infrared, Bluetooth, or magic — you just care that the volume changes. The remote *abstracts away* the complexity.

```
[ Class implementation ]  <--->  [ Class Contract ]  <--->  [ Clients ]
   (hidden, black box)        (public methods/constants)   (the users)
```

When you design a class, ask: "What's the smallest, cleanest interface I can expose that still lets users do what they need?" Everything else stays private.

## Part 3: Inheritance and Polymorphism

### The motivation: avoid repeating yourself

Suppose I want to model circles, rectangles, and triangles. All three share things: a color, whether they're filled, the date they were created. If I write that information into each class separately, I'll have three copies of the same code. If I later want to add an "outline thickness" property, I'd have to update all three.

**Inheritance** solves this. We define a general class first — say, `GeometricObject` — that holds the shared stuff. Then `Circle`, `Rectangle`, and `Triangle` *extend* it, inheriting everything it has.

### Superclass and subclass

```java
class GeometricObject {
    private String color = "white";
    private boolean filled;
    // ...constructors, getters, setters...
}
 
class Circle extends GeometricObject {
    private double radius;
    // ...inherits color, filled, etc. for free...
}
```

`GeometricObject` is the **superclass** (parent), and `Circle` is the **subclass** (child). The `extends` keyword sets up the relationship.

A few important facts:

* A subclass is **not** simply a subset of a superclass. In fact, a subclass usually has *more* than its parent — it adds its own fields and methods on top.

* Private members of the superclass are **not directly accessible** in the subclass. You have to go through public getters/setters.

* Classes are **extensible** — you can keep extending subclasses to make new ones.

* Java does **not allow multiple inheritance** for classes. A class can only extend *one* superclass. (Interfaces are the workaround — more on that later.)

* Superclass **constructors are not inherited**, but they *are* automatically invoked.

### Calling the superclass constructor

To explicitly invoke the parent's constructor, use `super`:

```java
public Circle(double radius, String color, boolean filled) {
    super(color, filled);   // calls GeometricObject's constructor
    this.radius = radius;
}
```

`super()` must be the *first statement* in the subclass constructor. If you don't write it explicitly, Java inserts an invisible `super()` for you. That's why this:

```java
public A() {
}
```

is actually equivalent to:

```java
public A() {
    super();
}
```

**Watch out:** if your superclass only has a constructor that takes arguments (no no-arg constructor), and your subclass constructor doesn't explicitly call `super(...)` with the right arguments, you'll get a compile error. The compiler tries to insert `super()` and finds nothing matching.

### Overriding vs. Overloading

These two words sound similar and trip up everyone at first.

**Overloading** — defining multiple methods with the **same name but different parameter lists** in the same class (or across an inheritance chain).

```java
class Calculator {
    int add(int a, int b)          { return a + b; }
    double add(double a, double b) { return a + b; }   // overload
}
```

**Overriding** — a subclass provides a **new implementation** of a method that already exists in the superclass. Same name, **same parameter list**, same return type.

```java
class Animal {
    public String sound() { return "Some sound"; }
}
 
class Dog extends Animal {
    @Override
    public String sound() { return "Woof"; }   // override
}
```

The `@Override` annotation isn't strictly required, but it's a good habit — the compiler will check that you really are overriding something, catching typos like `sond()`.

### Polymorphism

Here's where it gets interesting. **Polymorphism** is the feature that lets a variable of a *supertype* refer to an object of a *subtype*.

```java
GeometricObject geoObj = new Circle();   // legal!
Fruit f = new Apple();                    // also legal
```

The variable's *declared type* is `GeometricObject`, but the *actual object* it points to is a `Circle`. This is fine because every `Circle` *is a* `GeometricObject`.

### Dynamic binding

So if we call `geoObj.toString()`, which method actually runs — the one in `GeometricObject` or the one in `Circle`?

**The one in** **`Circle`.** Java looks at the *actual object's type* at runtime, not the declared variable type, and picks the most specific version of the method. This is called **dynamic binding**.

Example:

```java
public class PolymorphismDemo {
    public static void main(String[] args) {
        m(new GraduateStudent());
        m(new Student());
        m(new Person());
        m(new Object());
    }
 
    public static void m(Object x) {
        System.out.println(x.toString());
    }
}
 
class GraduateStudent extends Student { }
 
class Student extends Person {
    public String toString() { return "Student"; }
}
 
class Person extends Object {
    public String toString() { return "Person"; }
}
```

Output:

```
Student
Student
Person
java.lang.Object@39274
```

Notice that even though the method signature says `m(Object x)`, the `toString()` that runs depends on the actual object passed in. `GraduateStudent` doesn't define `toString()` itself, so Java walks up the inheritance chain and finds `Student`'s version. That's dynamic binding in action.

This makes code wonderfully generic — `m` works for *any* `Object`, but does the right thing for each subtype.

### The full visibility modifier table

I mentioned `public` and `private` earlier. There are actually four levels in Java:

| Modifier    | Same class | Same package | Subclass | Different package |
| ----------- | ---------- | ------------ | -------- | ----------------- |
| `public`    | ✓          | ✓            | ✓        | ✓                 |
| `protected` | ✓          | ✓            | ✓        | ✗                 |
| (default)   | ✓          | ✓            | ✗        | ✗                 |
| `private`   | ✓          | ✗            | ✗        | ✗                 |

**`protected`** is the new one. It's like the default, but it *also* lets subclasses see the member, even if the subclass is in a different package. It's the right choice when you want to share something with subclasses but keep it hidden from the wider world.

## Part 4: Abstract Classes and Interfaces

### Why abstract?

Sometimes you want a superclass that exists *only* to be inherited from — never to be instantiated directly. Think of `GeometricObject`. The very idea of a "generic geometric object with no specific shape" doesn't really make sense as a thing you'd create. A `Circle` makes sense. A `Rectangle` makes sense. But a plain `GeometricObject`? Not so much.

That's where the `abstract` keyword comes in.

### Abstract classes and abstract methods

An **abstract method** is a method declared without a body. It's a promise: "every concrete subclass must provide this." An **abstract class** is a class that's marked `abstract`, and may contain abstract methods.

```java
public abstract class GeometricObject {
    private String color;
    // ...fields and concrete methods...
 
    public abstract double getArea();        // no body!
    public abstract double getPerimeter();   // no body!
}
```

In UML diagrams, abstract classes and abstract methods are written in *italics*.

### Six rules about abstract classes (the gotchas)

1. **An abstract method cannot exist in a non-abstract class.** If you have even one abstract method, the class itself must be declared `abstract`. And if a subclass of an abstract class doesn't implement *all* the inherited abstract methods, that subclass must also be declared abstract.
2. **You cannot instantiate an abstract class** with `new`.

   ```java
   GeometricObject g = new GeometricObject();  // ❌ compile error
   ```

   But you *can* still define constructors for it — they get invoked when subclasses are constructed (via the `super()` chain).
3. **An abstract class doesn't need to have any abstract methods.** It can be 100% concrete methods and still be marked `abstract`. The point is just to prevent instantiation — typically because the class is meant only as a base for other classes.
4. **A superclass of an abstract class may be concrete.** For example, `Object` (the root of all Java classes) is concrete, but a class like `GeometricObject` that extends it can still be abstract.
5. **A concrete method can be overridden as abstract.** Rare, but useful when an inherited implementation no longer makes sense for a subclass. The subclass would then have to be declared abstract.
6. **An abstract class can be used as a data type.** You can't create instances of it directly, but you can declare variables and arrays of that type, then store subclass instances:

   ```java
   GeometricObject[] shapes = new GeometricObject[10];
   shapes[0] = new Circle();
   shapes[1] = new Rectangle();
   ```

   This is polymorphism at work.

### Interfaces

An **interface** is a class-like construct that contains **only constants and abstract methods** — no real implementation, no constructors, no state. (Modern Java has loosened this slightly with default methods, but the original spirit is what matters.)

The intent of an interface is to specify **common behavior** that classes from totally different parts of the hierarchy might share. For example, `Comparable`, `Edible`, `Cloneable`. A `Chicken` and a `Fruit` don't share a common animal-or-plant superclass, but both can be `Edible`.

### Defining an interface

```java
public interface Edible {
    /** Describe how to eat */
    public abstract String howToEat();
}
```

A class signs the contract using the `implements` keyword:

```java
class Apple extends Fruit implements Edible {
    @Override
    public String howToEat() {
        return "Apple: Make apple cider";
    }
}
```

Any class that `implements` an interface must provide an implementation for **every** method in that interface — or it must itself be declared abstract.

### Extends vs. implements — the key rules

This trips a lot of people up:

* A class can `extends` **at most one** class (single inheritance).

* A class can `implements` **any number** of interfaces (multiple).

* An interface can `extends` **any number** of interfaces (multiple).

* An interface **cannot** `implements` an interface.
  Putting it together:

```java
public class NewClass extends BaseClass
        implements Interface1, Interface2, InterfaceN {
    // ...
}
```

And for interfaces extending other interfaces:

```java
public interface NewInterface extends Interface1, Interface2 {
    // constants and abstract methods
}
```

### Omitting modifiers in interfaces

In an interface, **every** field is implicitly `public static final` (i.e., a constant), and **every** method is implicitly `public abstract`. So you can leave those modifiers off:

```java
public interface T1 {
    public static final int K = 1;
    public abstract void p();
}
 
// is exactly equivalent to:
 
public interface T1 {
    int K = 1;
    void p();
}
```

You access an interface's constant via the interface name: `T1.K`.

### Interface vs. Abstract Class — when to use which?

| <br />       | **Abstract Class**                                                       | **Interface**                                  |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Variables    | No restrictions                                                          | Must be `public static final` (constants only) |
| Constructors | Yes (called by subclasses via `super()`). Cannot instantiate with `new`. | No constructors. Cannot instantiate.           |
| Methods      | No restrictions (abstract or concrete)                                   | All methods are implicitly `public abstract`   |
| Inheritance  | A class can extend **one** abstract class                                | A class can implement **many** interfaces      |

A rough rule of thumb:

* **Use an abstract class** when subclasses share a common identity and a chunk of common implementation (e.g., all kinds of `GeometricObject` share color and filled state).

* **Use an interface** when classes from different parts of the type hierarchy need to share a *capability* (e.g., `Comparable`, `Edible`, `Runnable`). Interfaces describe what something *can do*, regardless of what it *is*.

## Quick Recap (a.k.a. my cheat sheet)

A quick reference I'll come back to before exams:

* **Class** = blueprint. **Object** = instance of a class.

* An object has identity, state (fields), and behavior (methods).

* Constructors share the class name, have no return type, are called with `new`.

* A default no-arg constructor only exists if you write *no* constructors yourself.

* Object variables hold references, not values. Assigning one to another shares the same object.

* Make fields `private` and expose them through `get`/`set` methods. This is **encapsulation**.

* **Inheritance** (`extends`) lets a subclass reuse and extend a superclass.

* Java has **single inheritance for classes** but **multiple inheritance for interfaces**.

* `super()` calls the parent constructor. It's auto-inserted if you omit it (provided a no-arg parent constructor exists).

* **Overloading** = same name, different parameters. **Overriding** = subclass replaces a parent method (same name, same parameters, same return type).

* **Polymorphism** lets a supertype variable hold a subtype object. The actual method that runs is decided at runtime — **dynamic binding**.

* Visibility ladder, most to least open: `public` > `protected` > (default) > `private`.

* **Abstract class** — cannot be instantiated, may have abstract methods, can have state and constructors.

* **Interface** — only constants and abstract method signatures (classically); a pure contract.

* Use abstract classes for "is-a" with shared implementation. Use interfaces for "can-do" capabilities.

***

That's the whole OOP foundation. Master these and the rest of Data Structures starts to feel a lot less mysterious — because every data structure we'll meet later (linked lists, stacks, queues, trees) is just a class with thoughtfully chosen fields and methods, often built using inheritance or interfaces.
