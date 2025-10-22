# EIS Granola Sync Plugin

A comprehensive Obsidian plugin for synchronizing meeting notes from Granola AI into your Obsidian vault with advanced customization options.

![](https://i.imgur.com/IIa4yUl.png)


## Features

### Core Synchronization
- **Automatic Sync**: Sync notes from Granola AI automatically at configurable intervals
- **Manual Sync**: One-click synchronization via command or button
- **Smart Directory Management**: Automatically rename sync directories when changed
- **Root Vault Sync**: Option to sync notes directly to vault root instead of subdirectories

### Content Processing
- **Structured Content**: Converts Granola's ProseMirror format to clean Markdown
- **Full Transcript Support**: Include complete meeting transcripts as separate sections
- **Attendee Processing**: Automatically extract and format participant names from emails
- **Custom Properties**: Add custom frontmatter properties with dynamic content

### Advanced Configuration
- **Custom Properties System**: Define custom YAML properties for all synced notes
- **Dynamic Placeholders**: Use `{attendees}` or `{date}` for dynamic content
- **Date Formatting**: Customize how `{date}` placeholders are formatted in titles and properties
- **Email Name Formatting**: Convert emails like `john.doe@company.com` to `[[John Doe]]`
- **List Generation**: Automatically create YAML lists from comma-separated values

## Installation

1. Download the plugin files to your Obsidian plugins directory
2. Enable the plugin in Obsidian's Community Plugins settings
3. Configure your Granola authentication file path
4. Start syncing your meeting notes!

## Configuration

### Authentication Setup

Set the path to your Granola configuration file (usually in your home directory):

```
Library/Application Support/Granola/supabase.json
```

The plugin will automatically detect your authentication token from this file.

### Sync Settings

#### Basic Configuration
- **Sync Directory**: Choose where to save synced notes (leave empty for vault root)
- **Notes to Sync**: Number of recent notes to synchronize (default: 1)
- **Auto Sync Interval**: Automatic sync every X minutes (0 = disabled)
- **Skip Existing Notes**: Avoid re-syncing already imported notes

#### File Generation
- **Date Format**: Customize format for `{date}` placeholder (YYYY-MM-DD, DD-MM-YYYY, etc.)
- **Include Full Transcript**: Add complete meeting transcripts to notes
- **Title Format**: Add prefixes or suffixes to note titles using `{date}` placeholder

### Properties Customization

#### Adding Custom Properties

1. Click "Add Property" in the Properties Customization section
2. Enter a property name (e.g., `status`, `priority`, `tags`)
3. Enter a property value, with support for:
   - Static text: `completed`
   - Multiple values: `tag1, tag2, tag3`
   - Dynamic attendees: `{attendees}` or `{participants}`
   - Meeting date: `{date}` (formatted according to Date Format setting)

#### Attendee Processing

When using `{attendees}` or `{participants}` in property values:

- **Named participants**: Used as-is in `[[Name]]` format
- **Email-only participants**: Converted to readable names
  - `john.doe@company.com` → `[[John Doe]]`
  - `maria.silva@enterprise.org` → `[[Maria Silva]]`
- **Multiple attendees**: Automatically formatted as YAML lists

#### Date Format Configuration

The `{date}` placeholder can be formatted using standard date format tokens:

| Format | Example Output | Description |
|--------|----------------|-------------|
| `YYYY-MM-DD` | `2024-01-15` | ISO format (default) |
| `DD-MM-YYYY` | `15-01-2024` | European format |
| `MM/DD/YYYY` | `01/15/2024` | US format |
| `DD/MM/YY` | `15/01/24` | Short European |
| `YYYY-MM-DD` | `2024-01-15` | ISO format |

**Usage Examples:**
- Property value: `Meeting {date}` → `Meeting 15-01-2024`
- Title suffix: ` - {date}` → `Product Review - 15-01-2024`

#### Property Value Examples

| Input | Result in YAML |
|-------|----------------|
| `completed` | `status: "completed"` |
| `tag1, tag2, tag3` | ```yaml<br>tags:<br>  - "tag1"<br>  - "tag2"<br>  - "tag3"<br>``` |
| `{attendees}` | ```yaml<br>participants:<br>  - "[[John Doe]]"<br>  - "[[Maria Silva]]"<br>``` |
| `Meeting {date}` | `title: "Meeting 15-01-2024"` |

## Usage Examples

### Basic Meeting Note

```yaml
---
granola_id: abc123
title: "Product Team Meeting"
granola_url: "https://granola.ai/meeting/abc123"
created_at: 2024-01-15T10:00:00Z
updated_at: 2024-01-15T11:00:00Z
status: "completed"
participants:
  - "[[John Doe]]"
  - "[[Maria Silva]]"
  - "[[Diego Eis]]"
tags:
  - "meeting"
  - "product"
---

# Product Team Meeting

## Meeting Notes

- Discussed new feature requirements
- Reviewed current sprint progress
- Planned next development phase

## Full Transcript

[Complete meeting transcript content...]
```

### Advanced Configuration Example

```javascript
// In plugin settings:
{
  syncDirectory: "Meetings",
  notesToSync: 5,
  autoSyncInterval: 60, // Sync every hour
  titleFormat: "prefix",
  titlePrefix: "Meeting {date} - ",
  dateFormat: "DD-MM-YYYY", // European date format
  customProperties: [
    { name: "status", value: "completed" },
    { name: "participants", value: "{attendees}" },
    { name: "meeting_date", value: "{date}" },
    { name: "tags", value: "meeting, work, {attendees}" }
  ],
  includeFullTranscript: true
}
```

## File Structure

After synchronization, your vault will contain:

```
Vault Root/
├── Meetings/                          # Sync directory
│   ├── Meeting 2024-01-15 - Product Team Meeting.md
│   ├── Meeting 2024-01-14 - Design Review.md
│   └── Meeting 2024-01-13 - Planning Session.md
└── [Other vault files...]
```

Or directly in root:

```
Vault Root/
├── Meeting 2024-01-15 - Product Team Meeting.md
├── Meeting 2024-01-14 - Design Review.md
└── [Other vault files...]
```

## Technical Details

### Content Processing

The plugin processes Granola's structured content using:

1. **ProseMirror Conversion**: Converts Granola's document format to Markdown
2. **Content Extraction**: Uses `last_viewed_panel.content` as primary source
3. **Fallback Processing**: Falls back to `notes.content` if primary source unavailable

### Attendee Formatting

Email addresses are processed as follows:

1. Extract local part (before `@`)
2. Replace dots and dashes with spaces
3. Apply title case formatting
4. Wrap in Obsidian link syntax: `[[Formatted Name]]`

### Error Handling

The plugin includes comprehensive error handling for:

- Authentication failures
- Network connectivity issues
- File system permissions
- Invalid API responses
- Malformed configuration files

## Troubleshooting

### Common Issues

**Notes appearing empty:**
- Check that Granola authentication file path is correct
- Verify that meeting has structured content in Granola
- Enable debug logging in console for detailed information

**Sync failing:**
- Confirm Granola credentials are valid
- Check network connectivity to Granola API
- Verify Obsidian has write permissions to sync directory

**Properties not appearing:**
- Ensure property name and value are not empty
- Check that attendees exist in the meeting data
- Verify YAML formatting in generated frontmatter

### Debug Information

Enable detailed logging by checking the browser console during sync operations. The plugin logs:

- API request/response details
- Content processing steps
- File creation/update operations
- Attendee extraction and formatting

## Contributing

This plugin is designed to be extensible. Key areas for contribution:

- Additional content processors
- New property placeholder types
- Enhanced attendee formatting options
- Custom export formats

## License

This plugin is provided as-is for personal and educational use.

## Support

For issues, feature requests, or questions:

1. Check existing documentation in `/prod-specs/` folder
2. Review console logs for detailed error information
3. Test with minimal configuration to isolate issues

---

*Built with ❤️ for the Obsidian and Granola communities*
