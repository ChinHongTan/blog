---
title: Artificial Neural Networks and Backpropagation
date: 2026-04-22T19:27:42+08:00
edited_at: 2026-04-25T04:50:48.818Z
author: chinono
---

## 1. The Paradigm Shift: Why Artificial Neural Networks?

For decades, computing has been dominated by the **Von Neumann architecture**, a design predicated on sequential processing, explicit memory addressing, and rigid algorithmic logic. While highly effective for arithmetic calculations and strictly defined logical operations, the Von Neumann model struggles profoundly with tasks that humans find trivial, such as:

* **Pattern Recognition:** Identifying faces, deciphering handwritten characters, or processing natural speech.

* **Content-Addressable Recall:** Retrieving complex memories based on partial cues rather than explicit memory addresses.

* **Approximate Reasoning:** Making common-sense decisions in ambiguous, ill-defined environments (e.g., driving a car, playing a sport).

These tasks are difficult to program algorithmically because they rely on experience, adaptation, and the ability to tolerate noise, rather than rigid mathematical logic. To solve these problems, computer science draws inspiration from the human brain, leading to the development of **Artificial Neural Networks (ANNs)**.

### Biological Neural Networks (BNN) vs. Von Neumann Machines

The fundamental difference between biological brains and traditional computers lies in their architecture and processing methods.

| Feature               | Von Neumann Machine                                                                       | Human Brain (Biological Neural Network)                                                                       |
| :-------------------- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Processors**        | One or a few high-speed processors (nanosecond operations).                               | Billions ($10^{11}$) of low-speed processors (millisecond operations).                                        |
| **Computing Power**   | Massive power concentrated in localized CPU units.                                        | Limited individual power, relying on massive collective parallelization.                                      |
| **Connectivity**      | Shared, high-speed buses routing data sequentially.                                       | Massive interconnections ($10^{15}$ synapses) operating concurrently.                                         |
| **Memory Access**     | Sequential access via explicit physical addresses.                                        | Content-addressable recall (retrieval by association).                                                        |
| **Knowledge Storage** | Knowledge and problem-solving logic are explicitly separated from the computing hardware. | Knowledge is distributed and physically resides in the synaptic connectivity between neurons.                 |
| **Adaptability**      | Hard-coded and rigid; highly susceptible to catastrophic failure if hardware is damaged.  | Highly adaptive; learns by altering network connectivity. Exhibits graceful degradation if partially damaged. |

### BNN vs. ANN

While ANNs are inspired by biological brains, the practical engineered version is a tiny, brittle imitation of the real thing. The slides include this distinct comparison:

| Feature                 | Biological Neural Network (BNN)                           | Artificial Neural Network (ANN)                                     |
| :---------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------ |
| **Parallelism**         | Massively parallel, slow per neuron, but superior overall | Massively parallel, fast per node, but inferior overall             |
| **Scale**               | \~$10^{11}$ neurons, \~$10^{15}$ interconnections         | Typically $10^2$ to $10^4$ nodes; depends on application and design |
| **Ambiguity**           | Tolerates ambiguity natively                              | Requires precise, structured, formatted data to handle ambiguity    |
| **Fault tolerance**     | Performance degrades gracefully under partial damage      | Robust performance is possible but not automatic                    |
| **Information storage** | Stored in the synapses (the connections themselves)       | Stored in continuous memory locations                               |

The takeaway: ANNs borrow the *idea* of distributed parallel computation, but they're orders of magnitude smaller and far less robust than the biological systems that inspired them.

## 2. From Biological to Artificial Neurons

To engineer an ANN, we must abstract the biological mechanisms of the brain into mathematical models.

### The Biological Neuron

A biological neuron consists of four primary components:

1. **Dendrites:** Branching structures that receive incoming signals from other neurons.
2. **Soma (Cell Body):** Accumulates the incoming signals.
3. **Axon:** A long fiber that transmits the signal outward if the accumulated stimulus exceeds a certain threshold (action potential).
4. **Synapse:** The microscopic gap between the axon of one neuron and the dendrite of another. The efficiency (strength) of the signal exchange across this gap determines how strongly one neuron influences another.

### The Artificial Neuron

The artificial neuron (often called a **node**, **unit**, or **perceptron**) mirrors this biological structure mathematically:

1. **Inputs ($X_1, X_2 ... X_m$):** Represent the incoming signals (dendrites).
2. **Weights ($W_1, W_2 ... W_m$):** Represent the synaptic strength. A high weight amplifies an input; a low weight diminishes it.
3. **Summation Function ($\Sigma$):** Acts as the soma, computing the weighted sum of all incoming signals.
4. **Activation Function ($f$):** Acts as the axon, determining the final output ($Y$) based on the aggregated signal. It evaluates whether the "neuron" should fire.

![0.68](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776932426798-Comparison-between-biological-neuron-and-artificial-neuron-40.webp "Biological neuron (a) vs. Artificial neuron (b)")

## 3. Neural Network Architecture and Topology

An Artificial Neural Network is essentially a collection of these artificial neurons connected by weighted links. What a network can compute is primarily determined by its architecture and the values of its weights.

Networks are classified by several attributes:

### 1. Connection Type

* **Static (Feedforward):** Signals travel in strictly one direction, from input to output. There are no loops.

* **Dynamic (Recurrent/Feedback):** Network connections form directed cycles. Outputs of nodes are fed back as inputs to themselves or previous layers, allowing the network to maintain an internal state or "memory" of past inputs.

![0.86](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776961525934-a-Static-neuron-b-Dynamic-neuron.png "Static neural network (a) vs. Dynamic neural network (b)")

### 2. Topology

* **Single-layer:** Inputs map directly to a single layer of output nodes.

![0.47](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776961715501-Single-layer-neural-network-22.webp)

* **Multi-layer:** Contains one or more **hidden layers** between the input and output layers. This dramatically increases the representational power of the network, allowing it to learn non-linear decision boundaries.

![0.63](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776961728478-Multi-layer-neural-network-22.png)

* **Self-organized:** Networks that autonomously organize their topology based on data patterns (often used in unsupervised learning).

## 4. Learning Paradigms

For a neural network to be useful, it must "learn." Learning is the process of adjusting the synaptic weights to minimize the difference between the network's current output and the desired outcome.

**Supervised Learning:** The network is provided with a training dataset consisting of paired inputs and explicit desired outputs (labels). An algorithm calculates the error between the network's prediction and the true label, adjusting the weights to correct the error.

![0.63](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776933654458-1520193384546.jpg)

**Unsupervised Learning:** The network receives input data without any explicit labels. The algorithm's goal is to discover hidden structures, correlations, or natural clusters within the raw data.

![0.63](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776933608367-1520209274175.jpg)

**Reinforcement Learning:** The network (acting as an agent) interacts with an environment. It receives positive rewards for correct actions and negative rewards for incorrect ones, adjusting its weights to maximize total cumulative reward over time.

![0.62](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776933710552-1520209208509.jpg)

## 5. The Multilayer Perceptron (MLP) and Backpropagation

The most fundamental architecture for supervised learning is the **Multilayer Perceptron (MLP)**. An MLP consists of an input layer, at least one hidden layer, and an output layer.

![0.50](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776933907355-Screenshot_2026-04-23_at_4.44.52_PM.png)

To train an MLP, we use the **Backpropagation (BP)** algorithm. Backpropagation is a gradient descent optimization technique that propagates the output error backward through the network to update the weights of the hidden layers.

### The Challenge of Hidden Layers

In a single-layer network, updating weights is straightforward (using the Delta Rule) because we know the explicit target value for the output node. However, in a multi-layer network, we *do not know* the target output for the nodes in the hidden layers. Backpropagation solves this by calculating how much each hidden node contributed to the final output error, assigning "blame" proportionately using the chain rule of calculus.

### Mathematical Notation for Backpropagation

Let us define the parameters for a network with an input layer (Layer 0), a hidden layer (Layer 1), and an output layer (Layer 2):

* **Weights:**

  * $w^{(1,0)}$: Weight matrix from the input layer to the hidden layer. Specifically, $w^{(1,0)}_{j,i}$ is the weight connecting input node $i$ to hidden node $j$.

  * $w^{(2,1)}$: Weight matrix from the hidden layer to the output layer.

* **Training Samples:** A set of $P$ samples, denoted as $\{(x_p, d_p) \mid p = 1, ..., P\}$.

* **Input Pattern ($x_p$):** A vector of inputs for a given sample.

* **Desired Output ($d_p$):** The ground truth target vector.

* **Actual Output ($y_p$** **or** **$o_p$):** The network's calculated output vector.

* **Error ($l_{p,j}$):** The difference between the desired and actual output for node $j$ given sample $p$. $l_{p,j} = d_{p,j} - y_{p,j}$.

The overall **Objective Function** is to minimize the **Sum Squared Error (E)** across all $P$ training samples and all $K$ output nodes:

$$
E = \sum_{p=1}^{P} \sum_{k=1}^{K} (d_{p,k} - o_{p,k})^2
$$

:::info
### Making sense of the formulas

A **vector** is simply a **list or array of numbers** arranged in a specific order.

When we train a neural network, we feed it data (inputs) and tell it what the correct answer should be (targets).

The input here is the list of features you are feeding into the network for *one specific example* (sample $p$).\
Let's say you are training an AI to predict a house's price. Your input vector for one specific house might be: `[3, 2000, 15]`. This vector represents 3 bedrooms, 2000 square feet, and 15 years old. The network receives these three numbers at its input layer.

The output is a vector because the output might be more than one number. For example, an AI that's trained to classify animals as Dog, Cat, or Bird, the output layer will contain 3 nodes, `[0, 1, 0]` (0% Dog, 100% Cat, 0% Bird).

#### The Simple Error for One Node

$$
l_{p,j} = d_{p,j} - y_{p,j}
$$

$d_{p,j}$ is your Desired target for node $j$.

$y_{p,j}$ is your actual output (Y) for node $j$.

This formula just says: Error = (What we wanted) - (What the network actually guessed). If the target was $1$ and the network guessed $0.8$, the error for that specific node is $0.2$.

#### The Big Objective Function (Sum Squared Error):

$$
E = \sum_{p=1}^{P} \sum_{k=1}^{K} (d_{p,k} - o_{p,k})^2
$$

1. $(d_{p,k} - o_{p,k})^2$: First, calculate the error (Desired minus Output) for a specific output node. Then, square it.

   * Why square it? Two reasons: First, it turns negative errors into positive numbers, so a $-0.5$ error and a $+0.5$ error don't accidentally cancel each other out to zero. Second, it heavily penalizes large errors (an error of 4 becomes 16, screaming at the network "FIX THIS!").
2. $\sum_{k=1}^{K}$: Add up those squared errors for all the output nodes ($k$) in the network for that one specific sample.
3. $\sum_{p=1}^{P}$: Do that for every single training sample ($p$) in your entire dataset, and add them all together into one giant number.

In plain English: The Objective Function ($E$) gives you a single, massive number that represents the total amount of wrongness across your entire dataset. The whole goal of Backpropagation is to tweak the network's weights to make that giant number $E$ as close to zero as possible!
:::

### Step 1: Forward Computing (The Forward Pass)

Data propagates forward from inputs to outputs.

**Hidden Layer Calculation:** The input vector $x$ is multiplied by the input-to-hidden weights to generate a net input, which is then passed through an activation function $S$.

$$
x^{(1)}_j = S\left(net^{(1)}_j\right) = S\left(\sum_{i} w^{(1,0)}_{j,i} x_i\right)
$$

:::info
### Formula explanation

**The Inputs** ($x_i$): These are the numbers you are feeding into the network (like the house size or number of bedrooms we talked about earlier).

**The Weights** ($w_{j,i}$): Think of weights as "importance dials." The network multiplies each input by its specific weight to decide how much that input matters.

**The Multiply and Add** ($\sum w \cdot x$): The network takes Input 1, multiplies it by Weight 1. Then Input 2 times Weight 2. It does this for all inputs and adds them all together into one single number. This is called the "net input" ($net^{(1)}_j$).

**The Activation Function** ($S$): The network doesn't just pass that raw sum to the next layer. It passes it through a mathematical filter called an Activation Function (represented by the $S$). This function "squishes" the number into a specific range (often between 0 and 1, or -1 and 1). This is crucial because it allows the network to learn complex, non-linear patterns rather than just drawing straight lines.The Result ($x^{(1)}_j$): This is the final, squished number that spits out of hidden node $j$.
:::

**Output Layer Calculation:** The hidden layer's output becomes the input for the output layer.

$$
y_k = o_k = S\left(net^{(2)}_k\right) = S\left(\sum_{j} w^{(2,1)}_{k,j} x^{(1)}_j\right)
$$

:::info
### Formula explanation

This is the exact same formula as the first one. The only thing that has changed is where the data is coming from: Instead of using the raw data ($x_i$) as the input, it uses the output from the hidden layer ($x^{(1)}_j$) that we just calculated above, and tt uses a new set of weights ($w^{(2,1)}$) connecting the hidden layer to the output layer.
:::

### Step 2: The Activation Function (Sigmoid)

For backpropagation to work, the activation function must be non-linear and differentiable. The most common classical choice is the **Logistic Sigmoid Function**:

$$
S(x) = \frac{1}{1 + e^{-x}}
$$

The sigmoid function maps any real-valued number into a smooth range between 0 and 1. Its most crucial mathematical property is its easily computable derivative, which is vital for the chain rule:

$$
S'(x) = S(x)(1 - S(x))
$$

:::info
### Deriving S'(x) step by step

We treat $S(x) = (1 + e^{-x})^{-1}$ and apply the chain rule:

$$
S'(x) = -1 \cdot (1 + e^{-x})^{-2} \cdot \frac{d}{dx}(1 + e^{-x})
$$

The derivative of $(1 + e^{-x})$ is $-e^{-x}$ (the $1$ vanishes; the $e^{-x}$ keeps its form but picks up a $-1$ from the inner $-x$):

$$
S'(x) = -\frac{1}{(1 + e^{-x})^2} \cdot (-e^{-x}) = \frac{e^{-x}}{(1 + e^{-x})^2}
$$

Now split the fraction into a product:

$$
S'(x) = \frac{1}{1 + e^{-x}} \cdot \frac{e^{-x}}{1 + e^{-x}}
$$

The first factor is just $S(x)$. For the second factor, notice that:

$$
\frac{e^{-x}}{1 + e^{-x}} = \frac{1 + e^{-x} - 1}{1 + e^{-x}} = \frac{1+e^{-x}}{1+e^-x} - \frac{1}{1+e^{-x}} = 1 - S(x)
$$

Therefore:

$$
S'(x) = S(x)(1 - S(x))
$$

This is the magic property that makes sigmoid so practical: once you've computed $S(x)$ during the forward pass, you get its derivative essentially for free during the backward pass — just multiply $S(x)$ by $(1 - S(x))$, no exponentials needed.

#### Note on Saturation

If the net input $|net|$ becomes exceptionally large (positive or negative), the sigmoid function enters a "saturation region" where the curve flattens out. In these regions, the derivative approaches zero, behaving like a hard step function. This can cause a problem known as "vanishing gradients," where the network stops learning.
:::

### Step 3: Backpropagating the Error (The Backward Pass)

We must update the weights to minimize the error $E$. We do this using **Gradient Descent**, updating each weight by an amount proportional to the negative gradient of the error with respect to that weight.

Before diving into the neural network math, let's do a quick recap on the calculus tools we need: Partial Derivatives and the Chain Rule. You can freely jump to the next section if you are already familiar with them.

:::warning
## Prerequisite: Partial Derivatives & The Chain Rule

### Partial Derivative ($\partial$)

Before anything else, I think it is worth understanding how partial derivative works. We will skip the boring analogy and jump right into the math.

Let's first look at a standard derivative ($f'$)

A standard derivative tells you the slope of a given equation. Take $f(x) = x^2$ as example, $f'(x)$is $2x$, this means at any given point in the graph, the slope of the graph is $2x$. If you are standing at $x = 3$, the slope is exactly $6$.

But what if you have more than 1 variable? Take this example:

$$
f(x, y) = x^2 + y^2
$$

![0.86](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1776951804474-Screenshot_2026-04-23_at_9.42.54_PM.png "Graph formed by the equation.")

Its graph will look something like this.

It's hard to find the slope at a given point, as the you can have the slope face any direction. So we can use partial derivative here. We pretend that one of the variable is a boring, normal number (like 10).

#### Find the partial derivative with respect to $x$ (written as $\frac{\partial f}{\partial x}$):

We pretend $y$ is just a normal number (let's say $y = 10$).

If $y = 10$, then $y^2 = 100$.

What is the standard derivative of a plain number like $100$? It's just $0$. A flat number has no slope.

So, the derivative of $x^2$ is $2x$, and the derivative of $y^2$ is $0$.

**Answer:** $\frac{\partial f}{\partial x} = 2x$

#### **Find the partial derivative with respect to** **$y$** **(written as** **$\frac{\partial f}{\partial y}$):**

Now pretend $x$ is the frozen number.

The derivative of $x^2$ becomes $0$. The derivative of $y^2$ is $2y$.

**Answer:** $\frac{\partial f}{\partial y} = 2y$

In neural networks, variables are usually multiplied together (like a Weight multiplied by an Input). Let's look at a function where they are attached:

$$
f(x, y) = 3x^2y
$$

#### **Find the partial derivative with respect to** **$x$** **($\frac{\partial f}{\partial x}$):**

Pretend $y$ is a constant number. Let's pretend $y = 10$.

If $y = 10$, your equation looks like this: $f(x) = 3 \cdot x^2 \cdot 10$, which simplifies to $30x^2$.

The derivative of $30x^2$ is easy: you bring down the $2$ and multiply it, giving you $60x$.

Now, let's swap the $10$ back out for the $y$. The $3$ and the $y$ just act as "sticky constants" that stay attached to the math you are doing on $x$.

**Answer:** $\frac{\partial f}{\partial x} = 6xy$

### **Find the partial derivative with respect to** **$y$** **($\frac{\partial f}{\partial y}$):**

Pretend $x$ is the constant.

This means that entire chunk of $3x^2$ is just one big, boring number. Let's imagine $3x^2$ evaluates to $7$.

Your equation would look like this: $f(y) = 7y$.

What is the derivative of $7y$? It's just $7$ (the slope of a straight line is just the number attached to it).

So, if the derivative of $7y$ is $7$, then the derivative of $(3x^2)y$ is just $3x^2$.

**Answer:** $\frac{\partial f}{\partial y} = 3x^2$

So the partial derivative essentially allows you to "lock" one of the axis by freezing all other variables. We can take a complex 3D graph, slice it into 2D cross-section, and do regular, easy standard derivative on that slice. A neural network can consists of billions of variables. Trying to comprehend a mathematical shape with a billion dimensions is literally impossible for a human brain.

Just as an example, in a network, $\frac{\partial E}{\partial w_1}$ means: "Freeze weights 2 through 1,000,000. Only nudge weight 1. How much did the error change?"

Then the network calculates $\frac{\partial E}{\partial w_2}$: "Okay, freeze weight 1, and freeze weights 3 through 1,000,000. Only nudge weight 2. How much did the error change?"

It does this for every single weight. Once it knows the "partial" blame for every individual weight, it adjusts them all at once, and the network learns!

***

### The Chain rule

In calculus, the Chain Rule is a formula used to find the derivative of **nested functions**, meaning a function that is sitting inside another function.

A nested function looks like this: **$A( B( C(x) ) )$**

* $x$ changes $C$

* $C$ changes $B$

* $B$ changes $A$

If you want to know **"How much does** **$x$** **change** **$A$?"**, the Chain Rule says you just calculate the rate of change for each nested function individually, and then **multiply them all together.**
:::

#### Updating Output Layer Weights ($w^{(2,1)}$)

To update a specific weight, we use this formula:

$$
\Delta w^{(2,1)}_{k,j} \propto -\frac{\partial E}{\partial w^{(2,1)}_{k,j}}
$$

:::info
### The Learning Rate η

The proportionality $\Delta w \propto -\frac{\partial E}{\partial w}$ becomes a usable equation by introducing a small constant $\eta$ (eta), called the **learning rate**:

$$
\Delta w = -\eta \cdot \frac{\partial E}{\partial w}
$$

$\eta$ is typically a small positive number (0.001 to 0.5). It controls how big each weight update step is:

* **Too small** → learning crawls; the network needs millions of epochs to converge.

* **Too large** → the optimizer overshoots minima, oscillates, or diverges entirely.

In code, every backprop weight update has this form:

$$
w'_{(x_i)j} = w_{(x_i)j} + \eta \cdot \delta_j \cdot f'_j(e) \cdot x_i
$$

where $\delta_j$ is the local error signal at node $j$, $f'_j(e)$ is the derivative of that node's activation function, and $x_i$ is the incoming signal on the wire being updated.

### Breaking down the Update Rule

Since I'm having trouble understanding the formula, so here's a very very detailed explanation:

#### The Left Side: $\Delta w^{(2,1)}_{k,j}$

* **The Triangle ($\Delta$):** This is the Greek letter Delta, and in math, it simply means **"Change"**.

* **The Weight ($w^{(2,1)}_{k,j}$):** This is the specific weight (connection) between a hidden node ($j$) and an output node ($k$).

* **Put it together:** The entire left side just means: **"The exact amount we need to adjust this specific weight."**

#### The Middle: $\propto$

* This symbol means **"is proportional to."**

* It basically means the left side scales with the right side (we can replace this symbol with an equals sign $=$ by multiplying the right side by a small number called a "learning rate")

#### The Right Side: $-\frac{\partial E}{\partial w^{(2,1)}_{k,j}}$

This is the most important part, and it has two pieces: the fraction and the negative sign.

* **The Fraction ($\frac{\partial E}{\partial w}$):** This is the "blame." It answers the question: *"If I turn this weight UP, what happens to the total Error?"*

  * If the answer is positive (e.g., $+5$), it means turning the weight up makes the error **worse**.

  * If the answer is negative (e.g., $-5$), it means turning the weight up makes the error **better**.

* **The Negative Sign ($-$) \[CRUCIAL!]:** This is the magic of **Gradient Descent**. The negative sign tells the network to do the **exact opposite** of whatever causes more error.

  * If turning the weight up makes the error worse ($+5$), the negative sign flips it to $-5$. The network says, "Okay, I will turn the weight DOWN."

  * If turning the weight up makes the error go down ($-5$), the negative sign flips it to $+5$. The network says, "Great! I will turn the weight UP even more."
:::

However, we cannot directly calculate $\frac{\partial E}{\partial w}$ because the Error formula $E = (d - o)^2$ does not have a $w$ in it.

To bridge this gap, we use the **Chain Rule**. We map out the exact sequence of events that happen when a weight is tweaked: a change in the weight alters the **Net Input**, which alters the **Output**, which alters the **Error**.

Mathematically, we chain these three partial derivatives together:

$$
\frac{\partial E}{\partial w^{(2,1)}_{k,j}} = \frac{\partial E}{\partial o_k} \cdot \frac{\partial o_k}{\partial net^{(2)}_k} \cdot \frac{\partial net^{(2)}_k}{\partial w^{(2,1)}_{k,j}}
$$

:::info
### Concept: Mapping out the Chain Rule

Let's imagine we are mathematicians trying to figure out this equation ourselves.

We have a neural network with a huge Error ($E$). We don't want that. We need to figure out: **If we tweak a specific weight ($w$), what happens to the Error ($E$)?** In calculus terms, our goal is to find $\frac{\partial E}{\partial w}$.

However, we can't directly calculate this because the Error formula $E = (d - o)^2$ doesn't have a $w$ in it! There is no $w$ to take a derivative of.

To connect $w$ to $E$, we must map out the "domino effect" of the network. We ask ourselves: *"If I tweak the weight, what is the very next thing that happens?"*

* **Domino 1: The Weight changes the Net Input.**
  The weight ($w$) is multiplied by the incoming signal to create the net input ($net$). Thus, a change in $w$ causes a direct change in $net$.
  This gives us our first piece: **$\frac{\partial net}{\partial w}$**

* **Domino 2: The Net Input changes the Output.**
  Does the $net$ directly change the Error? No. First, it has to pass through the activation function ($S$) to become the final output ($o$). A change in $net$ causes a direct change in $o$.
  This gives us our second piece: **$\frac{\partial o}{\partial net}$**

* **Domino 3: The Output changes the Error.**
  Finally, the output ($o$) is compared to our dataset target ($d$) to calculate the final Error. A change in $o$ causes a direct change in $E$.
  This gives us our final piece: **$\frac{\partial E}{\partial o}$**

We've just mapped out a composite function: $E$ depends on $o$, which depends on $net$, which depends on $w$. **Multiply them together, and you get your exact blueprint equation!**

#### Decoding the Labels

The numbers and letters are just coordinate labels to tell you exactly where you are in the network.

* **The Superscript** **$(2,1)$:** This tells you which layers the weight is bridging. It means this weight connects **Layer 1** (hidden) to **Layer 2** (output). *(Note: It is conventionally written backward as Target, Source).*

* **The Subscript** **$k,j$:** This tells you the specific nodes. It connects node **$j$** (in the hidden layer) to node **$k$** (in the output layer).

So, $\frac{\partial E}{\partial w^{(2,1)}_{k,j}}$ simply means: *"How much does the total Error change if I tweak this one specific wire connecting hidden node* *$j$* *to output node* *$k$?"*
:::

$$
\frac{\partial E}{\partial w^{(2,1)}_{k,j}} = -2(d_k - o_k) \cdot S'\left(net^{(2)}_k\right) \cdot x^{(1)}_j
$$

:::info
### Math: Solving the 3 parts of the Chain Rule

Remember that we have the blueprint equation above? Partial derivatives doesn't work well against computers, so we need to further derive the equation. So, from the steps above, we already knows these 3 formulas:

* **The Error Formula:** $E = \sum (d_k - o_k)^2$

* **The Output Formula:** $o_k = S(net^{(2)}_k)$

* **The Net Input Formula:** $net^{(2)}_k = \sum (w^{(2,1)}_{k,j} \cdot x^{(1)}_j)$

### Step 1: Solve $\frac{\partial E}{\partial o_k}$

We want to find the derivative of the Error with respect to a specific output node $o_k$.

**The formula:** $E = \sum (d_k - o_k)^2$

1. **Freeze the other nodes:** The original Error equation depends on ALL changing outputs. If your network has 3 output nodes, the formula looks like this:
   $E = (d_1 - o_1)^2 + (d_2 - o_2)^2 + (d_3 - o_3)^2$
   We only want the partial derivative for the first node ($o_1$). So, we lock $o_2$ and $o_3$ into place, treating them as constants. This changes the function to $f(o_1) = (d_1 - o_1)^2 + C$.
2. Because the derivatives of those frozen constants become $0$, we are left looking only at:

   $f(o_k) = (d_k - o_k)^2$
3. **Apply the Power Rule:** To take the derivative of something squared, we bring the $2$ down to the front:

   $2(d_k - o_k)$
4. **The Inner Chain Rule:** In calculus, if you take the derivative of the outside (the square), you must multiply it by the derivative of the inside. The derivative of $d_k$ (a frozen target number) is $0$. The derivative of $-o_k$ is $-1$.
5. Multiply the result by $-1$:

   **Answer 1:** $-2(d_k - o_k)$

> ### Why is $d_k$ frozen?
>
> Remember what $d_k$ actually is in the real world: it is your **D**esired target. It is the "ground truth" label from your dataset.
>
> If you feed the network a picture of a dog, and the label for dog is `1`, then $d_k = 1$.
>
> The output ($o_k$) is going to change constantly as the network learns and tweaks its weights. But the picture is *always* going to be a dog. The target $d_k$ never changes; it is a permanent, hardcoded number for that specific training sample.
>
> Because $d_k$ is just a plain, unchanging number, the rules of calculus say that its derivative is exactly $0$.

### Step 2: Solve $\frac{\partial o_k}{\partial net^{(2)}_k}$

We want to find the derivative of the Output with respect to the Net Input.

**The formula:** $o_k = S(net^{(2)}_k)$

1. This one requires almost no math! $S$ just represents the activation function.
2. In calculus, the universal shorthand for "the derivative of function $S$" is simply writing it with a prime symbol: $S'$.
3. **Answer 2:** $S'\left(net^{(2)}_k\right)$

### Step 3: Solve $\frac{\partial net^{(2)}_k}{\partial w^{(2,1)}_{k,j}}$

We want to find the derivative of the Net Input with respect to one specific weight.

**The formula:** $net^{(2)}_k = \sum (w^{(2,1)}_{k,j} \cdot x^{(1)}_j)$

1. **Freeze the other connections:** The Net Input is calculated by adding up all the incoming signals: $(w_1 \cdot x_1) + (w_2 \cdot x_2) + \dots$
2. Because we are taking a partial derivative for one specific weight ($w_j$), we freeze all the other weights. They turn into normal numbers without slopes, so their derivatives become $0$.
3. We are left looking only at the specific piece of the formula connected to our weight:

   $f(w) = w^{(2,1)}_{k,j} \cdot x^{(1)}_j$
4. **The Sticky Constant:** Remember the rule for multiplying variables! We pretend the input ($x^{(1)}_j$) is a boring, frozen number like $10$.
5. The derivative of $10w$ is just $10$. Therefore, the derivative of $x \cdot w$ is just $x$.

   **Answer 3:** $x^{(1)}_j$
:::

#### Updating Hidden Layer Weights ($w^{(1,0)}$)

This is the core of backpropagation. A hidden node $j$ connects to *multiple* output nodes $k$. Therefore, the error derivative with respect to a hidden layer weight $w^{(1,0)}_{j,i}$ must sum the gradients from all subsequent output nodes it influences.

$$
\frac{\partial E}{\partial w^{(1,0)}_{j,i}} = \sum_{k=1}^{K} \left( \frac{\partial E}{\partial o_k} \cdot \frac{\partial o_k}{\partial net^{(2)}_k} \cdot \frac{\partial net^{(2)}_k}{\partial x^{(1)}_j} \cdot \frac{\partial x^{(1)}_j}{\partial net^{(1)}_j} \cdot \frac{\partial net^{(1)}_j}{\partial w^{(1,0)}_{j,i}} \right)
$$

:::info
### The Hidden Layer

The blueprint equation we just built above is only the simplest case. It only calculates the blame for the very last set of weights in the network (the ones touching the final Output). What if we want to calculate the blame for a weight deeper inside the network? Say, between the input layer and a hidden layer. We can apply the same logic, but we will run into two new challanges, longer chains and fork roads.

#### 1. Longer Chains

If you are tweaking a weight deeper in the network ($w^{(1,0)}$), that tweak has to travel further to reach the final Error.

Instead of a 3-step chain, you now have a 5-step chain. If you tweak a deep weight, the ripple effect looks like this:

1. The Deep Weight changes the **Deep Net Input**.
2. The Deep Net Input changes the **Deep Output** (the Hidden Node's signal).
3. The Hidden Node's signal travels forward and changes the **Final Net Input**.
4. The Final Net Input changes the **Final Output**.
5. The Final Output changes the **Error**.

If it was just a straight line, your blueprint would just be those 5 derivatives multiplied together:

$$
\frac{\partial E}{\partial o} \cdot \frac{\partial o}{\partial net_{final}} \cdot \frac{\partial net_{final}}{\partial o_{hidden}} \cdot \frac{\partial o_{hidden}}{\partial net_{deep}} \cdot \frac{\partial net_{deep}}{\partial w}
$$

#### 2. The Fork in the Road (Why we need the $\Sigma$)

But in neural network's context, the chain is almost never a straight line.

If you are trying to trace the Error backward to hidden node's weight, you hit a fork in the road. Which node's Error do you trace?

Of course you have to look at all of them.

If a hidden node $j$ connects to three different outputs ($k=1, k=2, k=3$), then hidden node $j$ is partially responsible for the errors of all three. To find the total blame for the hidden node's weight, you have to:

1. Trace the 5-step chain back from output node 1.
2. Trace the 5-step chain back from output node 2.
3. Trace the 5-step chain back from output node 3.
4. **Add them all together.**

Now, look at the formula again. It is just the 5-step chain rule we deduced above, wrapped inside a giant Summation ($\Sigma$) symbol to add up the blame from every node in the next layer ($k$):

$$
\frac{\partial E}{\partial w^{(1,0)}_{j,i}} = \sum_{k=1}^{K} \left( \frac{\partial E}{\partial o_k} \cdot \frac{\partial o_k}{\partial net^{(2)}_k} \cdot \frac{\partial net^{(2)}_k}{\partial x^{(1)}_j} \cdot \frac{\partial x^{(1)}_j}{\partial net^{(1)}_j} \cdot \frac{\partial net^{(1)}_j}{\partial w^{(1,0)}_{j,i}} \right)
$$

*(Note: In the notes, the deep output* *$o_{hidden}$* *is written as* *$x^{(1)}_j$* *because the output of the hidden layer becomes the input* *$x$* *for the next layer!)*
:::

Expanding this partial derivative mathematically:

$$
\frac{\partial E}{\partial w^{(1,0)}_{j,i}} = \sum_{k=1}^{K} \left\{ -2(d_k - o_k) \cdot S'\left(net^{(2)}_k\right) \cdot w^{(2,1)}_{k,j} \cdot S'\left(net^{(1)}_j\right) \cdot x_i \right\}
$$

This formula elegantly demonstrates how the error $(d_k - o_k)$ is "back-propagated" through the weights $w^{(2,1)}_{k,j}$ to adjust the deeper hidden weights $w^{(1,0)}_{j,i}$.

:::info
### Deriving the formula

Let's look at the 5-link chain rule we built earlier:

$$
\frac{\partial E}{\partial w} = \sum \left( \text{Link 1} \cdot \text{Link 2} \cdot \text{Link 3} \cdot \text{Link 4} \cdot \text{Link 5} \right)
$$

Because the error has to travel backward from the end of the network, the first two links of the chain are exactly the same as the output layer.

* **Link 1 ($\frac{\partial E}{\partial o_k}$):** $-2(d_k - o_k)$

* **Link 2 ($\frac{\partial o_k}{\partial net^{(2)}_k}$):** $S'\left(net^{(2)}_k\right)$

***

#### Solve Link 3: $\frac{\partial net^{(2)}_k}{\partial x^{(1)}_j}$

* **The Goal:** How does the Final Net Input ($net^{(2)}_k$) react if the hidden node's output signal ($x^{(1)}_j$) changes?

* **The Formula:** $net^{(2)}_k = w^{(2,1)}_{k,j} \cdot x^{(1)}_j$

* Look at the bottom of our fraction. Our active variable is $x^{(1)}_j$. This means we must freeze the weight!

* Let's pretend the frozen weight is $10$. Your equation becomes $f(x) = 10x$. The derivative of $10x$ is just $10$.

* Therefore, the derivative of $w \cdot x$ (when $x$ is the variable) is just the $w$!

* **Answer 3:** $w^{(2,1)}_{k,j}$

***

#### Solve Link 4: $\frac{\partial x^{(1)}_j}{\partial net^{(1)}_j}$

* **The Goal:** How does the hidden node's output signal ($x^{(1)}_j$) react if their own Net Input ($net^{(1)}_j$) changes?

* **The Formula:** $x^{(1)}_j = S\left(net^{(1)}_j\right)$

* This is the same as Link 2, just happening one layer deeper. It is a 1D equation, so we just take the standard derivative of the activation function.

* **Answer 4:** $S'\left(net^{(1)}_j\right)$

***

#### Solve Link 5: $\frac{\partial net^{(1)}_j}{\partial w^{(1,0)}_{j,i}}$

* **The Goal:** How does the hidden node's Net Input ($net^{(1)}_j$) react if we tweak the deep weight ($w^{(1,0)}_{j,i}$)?

* **The Formula:** $net^{(1)}_j = w^{(1,0)}_{j,i} \cdot x_i$

* Look at the bottom of the fraction. Our active variable is the weight ($w$). This means we must freeze the raw input data ($x_i$).

* Just like we did for the output layer, if we freeze $x$ to be $10$, the equation is $f(w) = 10w$. The derivative is $10$. So, the derivative of $x \cdot w$ is just $x$.

* **Answer 5:** $x_i$
:::

### A More Intuitive View: The δ Recursion

The chain-rule derivations above are mathematically complete, but they hide a beautiful pattern. Once we group terms, backpropagation collapses into a simple recursive rule. Define a **local error signal** $\delta_n$ at every node $n$:

* **At the output node:** $\delta = z - y$, the raw difference between target and actual output.

* **At any hidden node** **$j$:** $\delta_j$ is the sum of incoming $\delta$s from every node it feeds, each weighted by the connecting weight.

  $$
  \delta_j = \sum_{k} (w_{k,j} \cdot \delta_k)
  $$

For the 2-3-2-1 network in the lecture (3 nodes in the first hidden layer, 2 in the second, 1 output), this gives:

![0.70](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777088385327-Screenshot_2026-04-25_at_11.39.18_AM.png)

$$
\delta_4 = w_{46} \cdot \delta, \quad \delta_5 = w_{56} \cdot \delta
$$

$$
\delta_1 = w_{14} \cdot \delta_4 + w_{15} \cdot \delta_5
$$

$$
\delta_2 = w_{24} \cdot \delta_4 + w_{25} \cdot \delta_5
$$

$$
\delta_3 = w_{34} \cdot \delta_4 + w_{35} \cdot \delta_5
$$

Notice the pattern: **the same weights used in the forward pass are reused, but the signal flows the opposite direction.** The forward pass sends $y$-values left-to-right through the weights; the backward pass sends $\delta$-values right-to-left through those *same* weights. This is why the algorithm is called "back" propagation — and why training is computationally cheap relative to its expressive power.

:::warning
In neural network terminology, **"Source" (src)** and **"Destination" (dst)** are *always* defined by the direction of the **Forward Pass** (from left to right).
:::

Once every node has its $\delta$, every weight gets the same update rule:

$$
w'_{(\text{src})(\text{dst})} = w_{(\text{src})(\text{dst})} + \eta \cdot \delta_{\text{dst}} \cdot f'_{\text{dst}}(e) \cdot \text{output of src}
$$

or using the math notation earlier,

$$
w' = w + \eta \cdot \delta_{dst} \cdot S'(net_{dst}) \cdot x_{src}
$$

*(Note:* *$\eta$* *is just the "learning rate," a tiny number we use to make sure the network takes small steps instead of giant leaps).*

That single line summarizes all of backpropagation. Everything earlier in this document is the proof that this rule actually decreases the error.

:::info
### Wait, what is $\delta$ actually doing?

The chain-rule math above is the *proof* that backpropagation works, but it is not how a computer actually *runs* the code.

If a neural network is 100 layers deep, calculating the chain-rule equation for the very first layer would require an impossibly long equation. The computer would end up recalculating the exact same math millions of times.

**The Solution ($\delta$** **Recursion):** Instead of looking at the whole giant equation at once, we chop the "Blame" up into a neat little package called $\delta$ (Delta).

Think of $\delta$ as a "Box of Blame."
Every single node in the network calculates its own personal Box of Blame.

Here is how the algorithm flows:

**1. The Output Layer (The Final Inspector)**

* The output node calculates its raw error: $(Target - Output)$.

* It puts this into its Box of Blame and calls it $\delta$.

**2. The Hidden Layers (Passing the Buck)**

* A hidden node doesn't calculate an error from scratch.

* Instead, it just looks at the node in front of it and says: *"Give me your Box of Blame ($\delta$). Multiply it by the Weight connecting us, and hand it backward to me."*

* The hidden node takes that package, adds its own flexibility (activation derivative), and says: *"Great, this is my new Box of Blame!"*

**3. The Fork in the Road (Summing)**

* If a hidden node sent its signal to *three* different output nodes, it simply collects the Boxes of Blame ($\delta$) from all three of them, multiplies them by their respective weights, and adds them together.

Notice that during the **Forward Pass**, the network pushes the raw data ($x$) left-to-right, multiplying it by the weights.
During the **Backward Pass**, the network takes the Error packages ($\delta$) and pushes them right-to-left, multiplying them by the *exact same weights*.

The computer never has to calculate a 100-link equation. It just plays a game of hot potato, handing the $\delta$ packages backward one step at a time!
:::

:::info
### Deriving the formula

Remember the partial derivative we calculated earlier? Let's say we did all the chain rule math, and we found out that for one specific weight ($w$), the slope (the derivative $\frac{\partial E}{\partial w}$) is **$5$**. 

What does a positive slope of $5$ mean mathematically? It means if we *increase* the weight, the Error will *increase* by 5 times as much.

But our goal is to make the Error go **down** to zero! If increasing the weight makes the error go up, what should we do? **We do the exact opposite of the slope.** We need to subtract the slope from our current weight. This is called the **Gradient Descent**.

Gradient Descent looks like this:

$$
w_{new} = w_{old} - (\text{Learning Rate} \cdot \text{Slope})
$$

The learning rate is there so that we don't take steps that are too big, to the point that we cross the entire valley.

In math, it looks like this:

$$
w_{new} = w_{old} - \eta \frac{\partial E}{\partial w}
$$

Remember our chain rule equation we derived earlier:

$$
\frac{\partial E}{\partial w} = - (d - o) \cdot S'(net) \cdot x
$$

Let's plug that slope into our Gradient Descent equation:

$$
w_{new} = w_{old} - \eta \Big( - (d - o) \cdot S'(net) \cdot x \Big)
$$

Look closely at what happens to the negative signs. You are subtracting a negative number. Those two minus signs cancel each other out and become a plus!

Also, remember that $(d - o)$ is what we call $\delta$ (the blame).

So with some clean up, we get this:

$$
w_{new} = w_{old} + \eta \cdot \delta \cdot S'(net) \cdot x
$$

Which, you may have noticed, is our weight update rule.

$S'(net)$ here acts as a volume dial. If the node is in the flat zone, the little slope ($S'$) is $0$. It multiplies the whole weight update by $0$, canceling it out. The network realizes: *"Changing this weight won't affect the error right now, so don't bother moving it."*

If the node is in the steep middle zone, the little slope (\$S'\$) is high, and the weight is allowed to update normally.
:::

### Enhancing Backpropagation

Vanilla gradient descent with a fixed learning rate is slow and gets trapped in shallow valleys of the error surface. Three classical refinements address this:

**Momentum.** A fraction of the previous weight update is added to the current one:

$$
\Delta w_t = -\eta \cdot \frac{\partial E}{\partial w} + \alpha \cdot \Delta w_{t-1}
$$

where $\alpha$ (typically 0.9) is the momentum coefficient. Intuitively, the optimizer behaves like a ball rolling down a hill: it accumulates velocity in directions of consistent descent and damps oscillations in directions where the gradient keeps flipping sign. This both speeds up convergence on flat plateaus and helps escape shallow local minima.

**Adaptive Learning Rates (Delta-Bar-Delta).** Rather than picking one $\eta$ for the whole network, give every weight its own $\eta_{ij}$ that adjusts dynamically:

* If a weight's gradient direction is consistent across recent updates, *increase* its learning rate (we're confident, take bigger steps).

* If a weight's gradient keeps oscillating, *decrease* its learning rate (we're overshooting, slow down).

Modern variants of this idea (Adam, RMSProp) are still the default in deep learning today.

**Quickprop.** A second-order method that approximates the error surface near the current point as a parabola in each weight, then jumps directly to the parabola's minimum. When the assumption holds, Quickprop converges in dramatically fewer epochs than vanilla gradient descent.

## 6. Applications of Neural Networks

Neural networks excel in environments where data is noisy, relationships are non-linear, and traditional algorithmic logic fails.

### General Functional Categories

1. **Clustering (Unsupervised):** Exploring similarities between data patterns and grouping them. Use cases include data compression and data mining.
2. **Classification / Pattern Recognition:** Assigning an input pattern (e.g., a handwritten symbol or an image) to one of many predefined classes.
3. **Function Approximation:** Finding an estimate of an unknown mathematical function $f(x)$ subject to noise. This is heavily used in scientific and engineering disciplines.
4. **Prediction / Dynamical Systems:** Forecasting future values of time-sequenced data. Unlike standard function approximation, prediction incorporates the element of time, meaning the system state changes dynamically.

### Specific Real-World Applications

* **Medical Diagnosis:**

  * *Input:* Patient manifestations (symptoms, lab results, blood tests).

  * *Output:* Predicted disease states (e.g., probability of prostate cancer or Hepatitis B).

  * *Advantage:* Circumvents the need for explicit causal rules, which are often impossible to define in complex human biology.

* **Process Control:**

  * *Input:* Environmental parameters and sensor readings.

  * *Output:* Automated control parameters (e.g., adjusting valves, regulating temperature).

  * *Advantage:* Learns ill-structured control functions that are too mathematically complex for standard PID controllers.

* **Financial Forecasting:**

  * *Input:* Macroeconomic factors (CPI, interest rates) and historical stock quotes.

  * *Output:* Forecasts of future stock prices or major indices (like the S\&P 500).

* **Consumer Credit Evaluation:**

  * *Input:* Personal financial metrics (income, debt-to-income ratio, payment history).

  * *Output:* Risk assessment or credit rating scores.

## 7. Evaluation of Backpropagation Networks

While Multi-Layer Perceptrons trained with Backpropagation are exceptionally powerful, the architecture has both distinct advantages and inherent limitations.

### Strengths

* **Great Representation Power:** The inclusion of non-linear hidden layers allows the network to approximate virtually any continuous function.

* **Wide Practical Applicability:** Easily adapted to classification, regression, and prediction tasks across countless domains.

* **Easy to Implement:** The calculus behind backpropagation is complex, but the algorithmic implementation is straightforward matrix multiplication.

* **Good Generalization:** When trained correctly (often utilizing cross-validation testing), ANNs can make highly accurate predictions on entirely unseen data.

### Limitations and Problems

* **Slow Convergence:** Gradient descent can require tens of thousands of epochs (passes through the data) to reach an acceptable error rate.

* **The "Black Box" Problem:** It is nearly impossible to inspect the thousands of weights to understand *why* the network made a specific decision.

* **Local Minima:** Gradient descent only guarantees finding a *local* minimum error, not necessarily the *global* minimum.

* **Representational Limits:** Not absolutely every conceivable function can be learned easily within standard operational timeframes.

* **Overfitting / Poor Generalization:** If trained too long, the network may memorize the training data, leading to a situation where the training error is zero, but the network fails entirely on new data. Cross-validation is strictly required to prevent this.

* **Lack of Quality Assessment:** There is no mathematically well-founded way to assess the absolute quality of the learning aside from empirical testing on a hold-out set.

* **Network Paralysis:** If weights become too large, activation functions are driven into deep saturation regions. The derivatives become near zero, freezing the network.

* **Trial-and-Error Architecture:** Selecting the optimal learning rate, momentum, number of hidden layers, and nodes is still largely an empirical art rather than an exact science.

* **Catastrophic Forgetting (Non-incremental Learning):** Standard BP networks cannot easily learn "new" data on the fly. To incorporate new samples without forgetting old patterns, the network usually must be entirely retrained on the combined dataset.

