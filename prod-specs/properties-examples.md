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

### {date}
Replaces with the formatted meeting creation date using the configured date format.

**Configuration example:**
- Name: `meeting_date`
- Value: `{date}`

**Result in frontmatter (with DD-MM-YYYY format):**
```yaml
meeting_date: "15-01-2024"
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

### 6. Meeting Date
**Configuration:**
- Name: `meeting_date`
- Value: `{date}`

**Result (with DD-MM-YYYY format):**
```yaml
meeting_date: "15-01-2024"
```

### 7. Title with Date
**Configuration:**
- Name: `title`
- Value: `Meeting {date} - Product Review`

**Result:**
```yaml
title: "Meeting 15-01-2024 - Product Review"
```

## Date Format Configuration

The `{date}` placeholder uses the format configured in **File Generation → Date Format**.

### Supported Format Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `YYYY` | 4-digit year | `2024` |
| `YY` | 2-digit year | `24` |
| `MM` | 2-digit month | `01` |
| `DD` | 2-digit day | `15` |

### Format Examples

| Format | Result | Use Case |
|--------|--------|----------|
| `YYYY-MM-DD` | `2024-01-15` | ISO format |
| `DD-MM-YYYY` | `15-01-2024` | European format |
| `MM/DD/YYYY` | `01/15/2024` | US format |
| `DD/MM/YY` | `15/01/24` | Short format |

### Configuration
1. Go to **File Generation** section
2. Set **Date Format** to your preferred format
3. Use `{date}` in title prefixes/suffixes or custom properties

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
