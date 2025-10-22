# Properties Customization - Usage Examples

## How It Works

Custom properties are added to the frontmatter of synced notes. You can use special placeholders to include dynamic information.

## Available Placeholders

### {attendees} or {participants}
Replaces with the names of meeting participants. If no name is available, it extracts and formats the name from the email.

**Configuration example:**
- Name: `participants`
- Value: `{attendees}`

**Result in frontmatter:**
```yaml
participants:
  - "[[Diego Eis]]"
  - "[[Douglas Roberto]]"
```

## Email Formatting

When no name is available, the plugin extracts the name from the email and formats it:

**Email:** `diego.eis@company.com.br`
**Extracted name:** `diego eis`
**Formatted name:** `Diego Eis`
**Final result:** `[[Diego Eis]]`

**Email:** `douglas-roberto@gmail.com`
**Extracted name:** `douglas-roberto`
**Formatted name:** `Douglas Roberto`
**Final result:** `[[Douglas Roberto]]`


## Practical Examples

### 1. Meeting Participants
**Configuration:**
- Name: `participants`
- Value: `{attendees}`

**Result:**
```yaml
participants:
  - "[[João Silva]]"
  - "[[Maria Santos]]"
  - "[[Diego Eis]]"
```

### 2. Tags with Participants
**Configuration:**
- Name: `tags`
- Value: `meeting, {attendees}`

**Result:**
```yaml
tags:
  - "meeting"
  - "[[João Silva]]"
  - "[[Maria Santos]]"
```

### 3. Simple Status
**Configuration:**
- Name: `status`
- Value: `completed`

**Result:**
```yaml
status: "completed"
```

### 4. Category with Participants
**Configuration:**
- Name: `categoria`
- Value: `reunião-{attendees}`

**Result:**
```yaml
categoria: "reunião-João Silva, Maria Santos, Diego Eis"
```

### 5. Multiple Tags
**Configuration:**
- Name: `tags`
- Value: `work, meeting, project`

**Result:**
```yaml
tags:
  - "work"
  - "meeting"
  - "project"
```

## Advanced Features

### Multiple Values
When you enter multiple values separated by commas, they become a YAML list:

**Input:** `tag1, tag2, tag3`
**Result:**
```yaml
property:
  - "tag1"
  - "tag2"
  - "tag3"
```

### Obsidian Links for Participants
Participants derived from emails are automatically wrapped in `[[ ]]` to create internal links in Obsidian.

### Full Transcript
When enabled, the complete transcript is added at the end of the note with the title:

```
## Full Transcript

[Complete transcript content...]
```

### Frontmatter Order

Properties appear **AFTER** standard properties:

```yaml
---
granola_id: abc123
title: "My Meeting"
granola_url: "https://granola.ai/meeting/abc123"
created_at: 2024-01-15T10:00:00Z
updated_at: 2024-01-15T11:00:00Z
status: "completed"
participants:
  - "[[João Silva]]"
  - "[[Maria Santos]]"
  - "[[Diego Eis]]"
---
```

## Property Replacement

If you add a property that already exists, the value will be replaced.

## Interface

- **Form appears above** the "Add Property" button
- **Red button** to remove properties
- **Organized list** of existing properties
