---
title: Data Preprocessing & Regression Analysis
date: 2026-04-27T10:40:07+08:00
edited_at: 2026-04-27T15:04:34.378Z
author: chinono
path: /blog/Data-Preprocessing-&-Regression-Analysis
---

## Data Preprocessing

Before we can train any Machine Learning model, we need to deal with the messy reality of raw data. **Data preprocessing** is the process of transforming raw data into a clean, usable format before feeding it into a model. Think of it like washing and chopping vegetables before cooking. You can't make a good dish with dirty, uncut ingredients.

Raw data typically suffers from problems like outliers, missing values, meaningless combinations, and inconsistent scales. Preprocessing turns that chaos into something a model can actually learn from.

### The 7 Steps of Data Preprocessing

**Step 1 — Acquire the dataset.** Gather data from various sources and combine them into a proper format. The structure of your dataset will depend on your domain (business data looks very different from medical data).

**Step 2 — Import crucial libraries.** In Python, three libraries form the backbone of preprocessing: **NumPy** (scientific computing), **Pandas** (data manipulation and analysis), and **Matplotlib** (2D plotting and visualization).

**Step 3 — Import the dataset.** Load your data into your working environment. Make sure your working directory is set correctly so your code can find the files.

**Step 4 — Handle missing values.** This is critical. If you ignore missing data, your model will draw faulty conclusions. Common strategies include filling missing values with the column mean/median, or dropping incomplete rows entirely.

:::info
### What's imputation (filling in) and dropping (removing row)?

Imagine a spreadsheet of patient records where some rows have no entry for "blood pressure." If you feed that gap straight into a model, it either crashes or silently learns something wrong. You have two main options: *imputation* (filling in a reasonable substitute) or *deletion* (removing the incomplete row).

For imputation, the most common approach is replacing the blank with the column's mean or median. Mean works well for normally distributed data, while median is safer when you have outliers — for instance, if most blood pressures are around 120 but one reading is 300, the mean gets pulled up, while the median stays stable. Deletion is simpler but risky: if 30% of your rows are missing that field, you're throwing away a lot of data.
:::

**Step 5 — Encode categorical data.** ML models run on math — they need numbers, not labels like "Red" or "Male." Encoding methods include dummy variables, label encoding (assigning integers to categories), and one-hot encoding (creating binary columns for each category).

:::info
### Label encoding vs one-hot encoding

Models do math, so a column like "Color" with values Red, Blue, Green is meaningless to them as text. *Label encoding* assigns each category an integer (Red=0, Blue=1, Green=2), which is quick but introduces a problem: the model may interpret Blue as "between" Red and Green, or assume Green > Red, when there's no such ordering.

*One-hot encoding* avoids this by creating a separate binary column for each category, so you'd get three columns (is\_Red, is\_Blue, is\_Green), each containing 0 or 1. The trade-off is that one-hot encoding adds more columns, which can be expensive with high-cardinality features (imagine a "City" column with 500 unique values).
:::

**Step 6 — Feature scaling.** When your features have wildly different ranges (e.g., age 0–100 vs. salary 0–1,000,000), some algorithms get confused. Feature scaling standardizes variables to a common range. Two popular methods are Min-Max scaling and Standardisation (z-score).

:::info
### Feature scaling

Say you have two features: age (ranging 18–65) and income (ranging 20,000–200,000). A distance-based algorithm like k-nearest neighbours calculates how "close" two data points are. Without scaling, income dominates that distance calculation simply because its numbers are bigger — age differences become basically invisible. Scaling fixes this by putting both features on a comparable range.

*Min-Max scaling* squeezes everything into 0–1 using the formula $(x - min) / (max - min)$. So an age of 18 becomes 0, an age of 65 becomes 1, and everything else falls between. *Standardisation (z-score)* instead centres the data around 0 with a standard deviation of 1, using $(x - mean) / std\_dev$. Min-Max is great when you know your data has fixed bounds and no extreme outliers. Standardisation is more robust to outliers and is generally preferred for algorithms like logistic regression or SVMs.

Not all algorithms need feature scaling. Tree-based models (like decision trees and random forests) split on thresholds and don't care about magnitude, so scaling doesn't affect them. It matters most for distance-based and gradient-based algorithms.
:::

**Step 7 — Split the dataset.** Divide your data into a **training set** (for learning) and a **test set** (for validation). Common splits follow the Pareto principle: 80/20, 70/30, or 60/40.

![0.63](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777275466503-Screenshot_2026-04-27_at_3.37.33_PM.png)

### Other Preprocessing Techniques

Beyond the core 7 steps, you may also encounter:

* **Data Integration** — combining data from multiple source systems into a unified set.

* **Data Transformation** — converting data from one format to another (e.g., source system format → destination format).

* **Data Discretization** — turning continuous values into discrete intervals (e.g., converting exact ages into age groups like "18–25", "26–35").

## Regression Analysis

Now that our data is clean, let's learn how to make predictions. We'll start with a classic example.

### The Housing Price Problem

Imagine we have a dataset of 47 houses in SS17, Petaling Jaya, with their living areas (in square feet) and prices (in RM thousands). The question is simple: **given the size of a house, can we predict its price?**

This is a **supervised learning** problem. We have input-output pairs and want to learn a mapping between them. Since the output (price) is a continuous value, this is specifically called a **regression** problem.

:::info
Regression is a method for finding the relationship between variables so you can predict a continuous outcome from one or more inputs.

![0.96](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777279629723-1N1-K-A43_98pYZ27fnupDA-2048x1418.jpeg "Linear Regression, Image by Dan White 1000 on Shutterstock")
:::

### Notation

Before diving in, let's set up our notation:

* **$x^{(i)}$** = input features (e.g., living area of the i-th house)

* **$y^{(i)}$** = output/target variable (e.g., price of the i-th house)

* **$(x^{(i)},y^{(i)})$** = a single training example

* **$m$** = total number of training examples

* **$h(x)$** = our hypothesis function — the predictor we want to learn

The goal: learn a function h such that $h(x)$ is a good predictor for y.

### Linear Regression

The simplest hypothesis is a linear function. If we have two features — living area ($x₁$) and number of bedrooms ($x₂$) — our model looks like:

$$
h(x) = \theta_0 + \theta_1 x_1 + \theta_2 x_2
$$

The $\theta$ values are called **parameters** (or **weights**). Our job is to find the best $\theta$ values. But how?

### The Cost Function

We define a **least-squares cost function** that measures how far off our predictions are from the actual values:

$$
J(\theta) = \frac{1}{2} \sum_i (h(x^{(i)}) - y^{(i)})^2
$$

The smaller $J(\theta)$ is, the better our model fits the data. So we want to **minimise** $J(θ)$.

:::info
### Recap Cost Function

You can learn more about cost function [here](https://blog.chinono.dev/blog/Introduction-to-Machine-Learning#the-lms-least-mean-squares-algorithm). The core idea remains pretty much the same, only difference is that this formula writes the cost as the sum of all errors, which corresponds to **batch gradient descent** where you accumulate the total error across every example before making one update. Batch is more stable per step, but each step is expensive because you have to loop through the entire dataset.
:::

### Gradient Descent — Finding the Best Parameters

Gradient descent is an iterative optimization algorithm. Here's the intuition:

1. Start with a random guess for $\theta$.
2. Compute the cost $J(\theta)$.
3. Adjust $\theta$ in the direction that reduces $J(\theta)$ the most (the direction of steepest descent).
4. Repeat until convergence.
   The update rule is:

$$
\theta_j := \theta_j - \alpha \frac{\partial J(\theta)}{\partial \theta_j}
$$

:::info
### Understanding the formula

$:=$ means "assign." It computes the expression on the right using the current values, then updates the left side with the result. 

This is gradient descent in its simplest form, adjust the weight by stepping in the opposite direction of the slope, using a small learning rate so we don't overshoot. If you want to learn more, check out [this post](https://blog.chinono.dev/blog/Artificial-Neural-Networks-and-Backpropagation#updating-output-layer-weights), but just note that it's the same update rule, just applied in a deeper context. Linear regression uses the simplest form of this update, back-propagation extends it to networks with multiple layers.
:::

Here, **$α$** is the **learning rate** — it controls how big each step is. Too large and you overshoot; too small and convergence is painfully slow.

Working out the partial derivative, the update becomes:

$$
\theta_j := \theta_j + \alpha (y^{(i)} - h(x^{(i)})) x_j^{(i)}
$$

This is called the **LMS (Least Mean Squares) update rule**, also known as the **Widrow-Hoff learning rule**. Notice something elegant: the size of the update is proportional to the error. When the prediction is close to the actual value, the adjustment is tiny. When the error is large, the adjustment is large.

:::info
### Deriving the equation

The goal is to find the partial derivative for our update rule:

$$
\theta_j := \theta_j - \alpha \frac{\partial J(\theta)}{\partial \theta_j}
$$

We start with our Least Squares Cost Function (summing over all $i$ examples):

$$
J(\theta) = \frac{1}{2} \sum_i \left( h(x^{(i)}) - y^{(i)} \right)^2
$$

And our linear hypothesis:

$$
h(x^{(i)}) = \theta_0 + \theta_1 x_1^{(i)} + \theta_2 x_2^{(i)} + \dots + \theta_j x_j^{(i)} + \dots
$$

#### Set up the Explicit Chain Rule

Instead of differentiating everything at once, we split the derivative into two clear parts using Leibniz notation:

$$
\frac{\partial J(\theta)}{\partial \theta_j} = \sum_i \left( \frac{\partial J(\theta)}{\partial h(x^{(i)})} \cdot \frac{\partial h(x^{(i)})}{\partial \theta_j} \right)
$$

*We put the derivatives inside the sum because the total gradient is just the sum of the gradients of each individual training example.*

#### Calculate the Two Parts

**Part 1: How does the cost change with respect to the prediction?**
Let $u = h(x^{(i)}) - y^{(i)}$. Using the power rule ($2u \cdot u'$ where $u'$ is just $1$ with respect to $h$):

$$
\frac{\partial J(\theta)}{\partial h(x^{(i)})} = \frac{1}{2} \cdot 2 \left( h(x^{(i)}) - y^{(i)} \right)^{2-1}
$$

$$
\frac{\partial J(\theta)}{\partial h(x^{(i)})} = \left( h(x^{(i)}) - y^{(i)} \right)
$$

**Part 2: How does the prediction change with respect to the weight** **$\theta_j$?**
Looking at the hypothesis $h(x^{(i)})$, if we take the derivative with respect to $\theta_j$, all other terms become $0$, leaving only the feature $x_j^{(i)}$:

$$
\frac{\partial h(x^{(i)})}{\partial \theta_j} = x_j^{(i)}
$$

#### Combine the Chain Rule

Now, we multiply Part 1 and Part 2 together and place them back inside our summation:

$$
\frac{\partial J(\theta)}{\partial \theta_j} = \sum_i \left[ \left( h(x^{(i)}) - y^{(i)} \right) \cdot x_j^{(i)} \right]
$$

#### The Final Update Rules

Substitute the combined derivative back into the original gradient descent update rule:

$$
\theta_j := \theta_j - \alpha \sum_i \left[ \left( h(x^{(i)}) - y^{(i)} \right) \cdot x_j^{(i)} \right]
$$

To get the most elegant form, distribute the negative sign to flip the inner terms $(h(x) - y)$ to $(y - h(x))$.

**For Batch Gradient Descent (All Samples):**

$$
\theta_j := \theta_j + \alpha \sum_i \left[ \left( y^{(i)} - h(x^{(i)}) \right) \cdot x_j^{(i)} \right]
$$

**For Stochastic Gradient Descent (1 Sample at a time):**
We simply drop the summation, giving us the exact LMS update rule:

$$
\theta_j := \theta_j + \alpha \left( y^{(i)} - h(x^{(i)}) \right) \cdot x_j^{(i)}
$$
:::

### Batch vs. Stochastic Gradient Descent

**Batch Gradient Descent** sums the gradients over *all* training examples before making a single update. It's precise but can be slow for large datasets.

![0.84](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777294390662-1775987318720-Screenshot_2026-04-12_at_5.webp)

**Stochastic (Incremental) Gradient Descent** updates $θ$ after *each* training example. It's faster and often works well in practice, though the path to convergence is noisier.

![0.70](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777294405734-1775987315179-Screenshot_2026-04-12_at_5.webp)

### Underfitting vs. Overfitting

This is one of the most important concepts in ML. Consider fitting different models to our housing data:

* A **straight line** (linear fit) may be too simple — it doesn't capture the curve in the data. This is **underfitting**.

* A **quadratic** (adding $x²$) fits better, capturing more structure.

* A **5th-order polynomial** passes through every data point perfectly, but it would make terrible predictions on new data. This is **overfitting**.

![0.90](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777294461971-1775987112930-Screenshot_2026-04-12_at_5.webp)

The key insight: a model that memorizes training data is not necessarily a good model. We want one that **generalizes** to unseen data.

### Locally Weighted Linear Regression

Standard linear regression fits one global line to all data. **Locally Weighted Linear Regression (LWLR)** takes a different approach: for each prediction, it gives more importance to nearby training points and less to distant ones.

The weight for each training example is typically a Gaussian function:

$$
w^{(i)} = \exp\left(-\frac{(x^{(i)} - x)^2}{2\tau^2}\right)
$$

The parameter $\tau$ (tau) controls how quickly the weights decay with distance. LWLR is a **non-parametric** method — it doesn't commit to a fixed set of parameters but re-fits for each query point.

:::info
### The Intuition behind Locally Weighted Linear Regression (LWLR)

In standard linear regression, when you fit a line, **every single training example has an equal vote**. A house that is 5,000 sq ft has the exact same influence on the line as a house that is 1,000 sq ft.

LWLR changes this. If you want to predict the price of a house that is **1,500 sq ft** (your query point, $x$), LWLR says: *"I only really care about training examples that are similar in size to 1,500 sq ft. The 5,000 sq ft houses shouldn't influence my prediction right now."*

To do this, we multiply the error of each training example by a weight, $w^{(i)}$.

### Deconstructing the Equation

The weight formula is a Gaussian (bell-shaped) curve:

$$
w^{(i)} = \exp\left(-\frac{(x^{(i)} - x)^2}{2\tau^2}\right)
$$

Here is what each piece is doing:

1. **The Distance:** $(x^{(i)} - x)^2$

   This is the squared distance between a training example $x^{(i)}$ and the specific point you are trying to predict $x$.
   * If the training point is very close to your query point, this value is almost **0**.
   * If the training point is very far away, this value is **large**.

2. **The Exponential & Negative Sign:** $\exp(- \dots)$

   Because of the negative sign, we are doing $e$ to the power of a negative number.
   * If the distance is roughly $0$ (the points are close), we get $e^0 = 1$. The weight is $1$. The model gives this point **maximum importance**.
   * If the distance is large (the points are far), we get $e^{-\text{large}}$, which approaches **0**. The weight becomes $0$. The model completely **ignores** this point.

3. **The Bandwidth Parameter:** $\tau$ (Tau)

   $\tau$ dictates how "fat" or "thin" our bell curve is. It controls how quickly the weights fall off to zero as you move away from the query point $x$.
   * **Large** **$\tau$:** The weights fall off very slowly. The model looks at a very wide "neighborhood" of points. If $\tau$ is infinitely large, LWLR just becomes standard linear regression.
   * **Small** **$\tau$:** The weights fall off rapidly. The model only looks at a very tiny, strict neighborhood of points immediately next to $x$.

### Why is it called "Non-parametric"?

Standard linear regression is **parametric**. You look at the data once, calculate your $\theta$ parameters, and then you can throw the training data away forever. Your formula $h(x) = \theta_0 + \theta_1 x$ does all the work.

LWLR is **non-parametric**. Because the weights $w^{(i)}$ depend on $x$ (the specific thing you are trying to predict right now, **you must recalculate** **$θ$** **from scratch every single time you want to make a new prediction.**), you cannot pre-calculate your $\theta$ values. You have to keep the entire training dataset in memory and calculate a brand new set of $\theta$ values for **every single prediction you make**.
:::

## Logistic Regression

<br />

Everything above assumes y is continuous. But what if y can only be **0 or 1** (e.g., spam vs. not spam, tumor is malignant vs. benign)?

We can't use a plain linear function because it can output values outside [0, 1]. Instead, we wrap it in the **sigmoid (logistic) function**:

$$
h_\theta(x) = \frac{1}{1 + e^{-\theta^T x}}
$$

The sigmoid squashes any real number into the range (0, 1), which we interpret as a probability. If $h(x) ≥ 0.5$, we predict y = 1; otherwise, y = 0.

:::info
### The Problem with Linear Regression for Classification

Imagine you are a doctor trying to predict if a tumor is Malignant ($y = 1$) or Benign ($y = 0$) based on its size ($x$).

If you use standard **Linear Regression**, you fit a straight line through the data. You might say: *"If the line outputs a value greater than 0.5, I will predict 1 (Malignant). If it's less than 0.5, I predict 0 (Benign)."*

This works okay until a patient comes in with a **massive** tumor.
Because linear regression is a straight line, it will try to accommodate this massive outlier. The line will tilt upwards heavily. Suddenly, your $0.5$ threshold shifts, and tumors that you *used* to correctly predict as Malignant are now being predicted as Benign.

Even worse, the straight line might output a value like $y = 3.5$ or $y = -1.2$. What does a "3.5" or "-1.2" mean when the answer can only be 0 or 1? It's nonsense.

### The Solution: The Sigmoid Function

Instead of a straight line, we want a curve that flatlines at $0$ and flatlines at $1$. We want the "S-shape" curve.

![0.78](https://raw.githubusercontent.com/ChinHongTan/blog/main/public/images/uploads/1777302135699-Screenshot_2026-04-27_at_11.02.04_PM.png "Sigmoid Function Graph")

This is what the Sigmoid function does:
$h_\theta(x) = \frac{1}{1 + e^{-\theta^T x}}$

Think of $\theta^T x$ as a **"raw confidence score"** (which can be any number from $-\infty$ to $+\infty$).

* If the raw score is $0$, the sigmoid turns it into exactly $0.5$ (50% probability).
* If the raw score is a huge positive number (like $100$), the sigmoid squashes it to $0.9999$ (99.99% probability it is Malignant).
* If the raw score is a huge negative number (like $-100$), the sigmoid squashes it to $0.0001$ (0.01% probability it is Malignant).

**Logistic Regression is just Linear Regression wrapped in a translator that turns "raw scores" into "probabilities."**
:::

### Fitting Logistic Regression

Instead of minimizing squared error, we use **maximum likelihood estimation**. We assume:

* $P(y = 1 | x; θ) = h(x)$

* $P(y = 0 | x; θ) = 1 − h(x)$

The log-likelihood is:

$$
\ell(\theta) = \sum_i \left[ y^{(i)} \log h(x^{(i)}) + (1 - y^{(i)}) \log(1 - h(x^{(i)})) \right]
$$

We **maximize** this using — you guessed it — **gradient descent**. The resulting update rule looks remarkably similar to the linear regression one:

$$
\theta_j := \theta_j + \alpha (y^{(i)} - h(x^{(i)})) x_j^{(i)}
$$

The form is identical, but remember that h(x) is now the sigmoid function, not a linear function. This elegant symmetry is one of the beautiful things about these algorithms.

:::info
### The Log-Likelihood Cost Function

In Linear Regression, we used the Least-Squares cost function (minimising the squared error).

If we try to use Least-Squares with our new curvy Sigmoid function, the math breaks. It creates a "wavy" 3D landscape with lots of fake valleys (local minima). Gradient descent gets stuck and can't find the bottom.

So, statisticians use a different way to measure error called **Maximum Likelihood**.

$\ell(\theta) = \sum \left[ y \log(h(x)) + (1 - y) \log(1 - h(x)) \right]$

This equation looks terrifying, but it's actually an elegant logical "IF" statement:

* **If the actual answer is** **$y=1$:** The second half of the equation $(1 - 1)$ becomes $0$ and disappears. We are just left with $\log(h(x))$. We want our prediction $h(x)$ to be as close to $1$ as possible.
* **If the actual answer is** **$y=0$:** The first half of the equation $(0)$ becomes $0$ and disappears. We are just left with $\log(1 - h(x))$. We want our prediction $h(x)$ to be as close to $0$ as possible.

It essentially **heavily punishes the model if it is very confident but wrong.** (e.g., If the model predicts a 99% probability of a tumor being Malignant, but it's actually Benign, the cost explodes to infinity).

### The "Beautiful Symmetry"

Here is the craziest part of all of this.

If you take that terrifying Log-Likelihood equation, and you do the calculus chain rule to find the Gradient Descent update rule (just like we did for linear regression)... a bunch of math cancels out perfectly.

You are left with this:
$\theta_j := \theta_j + \alpha (y^{(i)} - h(x^{(i)})) x_j^{(i)}$

**It is the EXACT same update rule as standard Linear Regression.**

The computer code you write to update the weights for Logistic Regression is identical to the code for Linear Regression. The *only* difference is that in Logistic Regression, $h(x)$ calculates the Sigmoid formula instead of just $y = mx+c$.
:::

## Summary

| Topic                      | Key Idea                                              |
| -------------------------- | ----------------------------------------------------- |
| Data Preprocessing         | Clean and transform raw data before training          |
| Linear Regression          | Predict continuous values with a linear model         |
| Cost Function (J)          | Measures how wrong our predictions are                |
| Gradient Descent           | Iteratively adjust parameters to minimize cost        |
| Batch vs. Stochastic GD    | Update after all examples vs. after each example      |
| Underfitting / Overfitting | Too simple vs. too complex models                     |
| Locally Weighted LR        | Give nearby points more influence                     |
| Logistic Regression        | Classify discrete outcomes using the sigmoid function |

