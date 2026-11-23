# How to Write a Lesson

Every lesson in `learning-materials/` follows the same structure, so readers always know where to find the goals, the explanation, the exercise, and the summary. This guide describes that structure. For folders, file names, code blocks, and callout syntax, read the [content guide](../../learning-materials/README.md).

## Template

````markdown
---
title: <Lesson title>
description: <One sentence: what the reader learns.>
---

_<Level> level_

<Introduction: one or two paragraphs that explain the problem and define the main terms in bold.>

In this lesson you learn how to:

- <goal 1>
- <goal 2>
- <goal 3>

## <First topic>

<Explanation, code examples, callouts.>

## <Second topic>

<...>

## Exercise

> [!IMPORTANT]
>
> 1. <First task.>
> 2. <Second task.>

### Solution

```abap
<Complete, working code.>
```

> [!NOTE]
>
> - <Key point 1.>
> - <Key point 2.>
````

## Sections

### 1. Front matter

```yaml
---
title: Variables and Constants
description: Declare data objects with DATA and CONSTANTS and use literals.
---
```

- `title` is the lesson title. The page shows it as the heading, so **do not repeat it as a `#` heading** in the text.
- `description` is one sentence that says what the reader learns. The page shows it under the title, and the site uses it in the lesson list and in search results. Do not repeat it in the text.
- Put the title in quotes if it contains a colon: `title: 'Modularization: Splitting Code into Blocks'`.

### 2. Level

One line in italics, right after the front matter:

| Level        | English                | Italian                  |
| ------------ | ---------------------- | ------------------------ |
| Beginner     | `_Beginner level_`     | `_Livello principiante_` |
| Basic        | `_Basic level_`        | `_Livello base_`         |
| Intermediate | `_Intermediate level_` | `_Livello intermedio_`   |
| Pro          | `_Pro level_`          | `_Livello pro_`          |

### 3. Introduction

One or two short paragraphs, without a heading:

- start from a concrete problem the reader recognizes;
- define the new terms in **bold** the first time they appear;
- link the earlier lessons the reader needs.

### 4. Learning goals

A list of two to five goals after the introduction, introduced by "In this lesson you learn how to:". Each goal starts with a verb and describes something the reader can do at the end of the lesson, for example "declare a variable with `DATA`", not "variables".

Every goal must be covered by the body and, where possible, practiced in the exercise.

### 5. Body

- One `##` section per topic, in the order the reader needs them. Use `###` for subsections. Never use `#`.
- Explain with short paragraphs and a code example for each idea. Examples must compile and use the same sample data as the rest of the course.
- Use the callouts from the [content guide](../../learning-materials/README.md#callouts): `[!TIP]` for an analogy, `[!WARNING]` for a common mistake, `[!CAUTION]` for something that can damage data.
- Link the lessons that cover a topic in more depth instead of explaining it twice.

### 6. Exercise

A `## Exercise` section with the tasks in a single `[!IMPORTANT]` callout, as a numbered list:

- two to four tasks, from the easiest to the hardest;
- each task practices one or more of the learning goals;
- each task says exactly what to build, with names and values, so the reader can compare their result with the solution.

### 7. Solution

A `### Solution` subsection, under the exercise:

- complete code that solves every task and runs as it is;
- comments only where a step is not obvious, or to show the expected output (`" 0`);
- if a task has more than one good answer, show one and explain the others in a sentence.

### 8. Summary

A `[!NOTE]` callout at the end of the lesson, after the solution: three to six bullet points with the facts to remember. Do not add new information here.

## Checklist

Before you open a pull request, check that the lesson:

- [ ] has `title` and `description` in the front matter, and no `#` heading;
- [ ] has the level line;
- [ ] has an introduction and the list of learning goals;
- [ ] covers every goal in the body;
- [ ] has `## Exercise` with an `[!IMPORTANT]` callout and `### Solution` with working code;
- [ ] ends with a `[!NOTE]` summary;
- [ ] exists with the same file name in every language folder of the edition.
