# EIS Granola Sync Plugin - Technical Notes

## Plugin Architecture

### Core Components
- **Main Plugin Class**: `EisGranolaSyncPlugin` extends `obsidian.Plugin`
- **Settings Tab**: `EisGranolaSyncSettingTab` extends `obsidian.PluginSettingTab`
- **Content Processing**: Converts Granola's structured content to Markdown
- **File Management**: Handles sync directory creation, renaming, and file operations

### Data Flow
1. **Authentication**: Load credentials from Granola config file
2. **API Request**: Fetch documents from Granola API
3. **Content Processing**: Convert structured content to Markdown
4. **File Creation**: Create/update notes in Obsidian vault
5. **Property Injection**: Add custom properties to frontmatter

## API Integration

### Authentication
- Reads `supabase.json` from configurable path
- Extracts `access_token` from `workos_tokens` or fallback fields
- Handles multiple possible token locations

### Document Fetching
- Endpoint: `https://api.granola.ai/v2/get-documents`
- Method: POST with authentication headers
- Response: JSON with `docs` array containing meeting data

### Content Structure
Granola API returns documents with:
```javascript
{
  id: "meeting_id",
  title: "Meeting Title",
  transcript: "Full transcript text",
  participants: [
    { name: "John Doe" },
    { email: "jane.smith@company.com" }
  ],
  last_viewed_panel: {
    content: {
      type: "doc",
      content: [/* ProseMirror nodes */]
    }
  }
}
```

## Content Processing

### ProseMirror to Markdown Conversion

The plugin converts Granola's ProseMirror document format to clean Markdown:

#### Supported Node Types
- **Headings**: `heading` nodes with `level` attribute
- **Paragraphs**: `paragraph` nodes with text content
- **Lists**: `bulletList` and `listItem` nodes
- **Text**: `text` nodes with formatting

#### Conversion Logic
```javascript
convertProseMirrorToMarkdown(content) {
  // Recursively process ProseMirror nodes
  // Convert to appropriate Markdown syntax
  // Handle nesting and formatting
}
```

### Attendee Processing

#### Name Extraction
1. Try `participant.name` or `participant.displayName`
2. If no name, extract from `participant.email`
3. Format email as readable name

#### Email Formatting
```javascript
formatEmailAsName(email) {
  // Extract local part (before @)
  // Replace dots/dashes with spaces
  // Apply title case
  // Return formatted name
}
```

## Custom Properties System

### Storage
Properties stored in plugin settings:
```javascript
customProperties: [
  { name: "status", value: "completed" },
  { name: "participants", value: "{attendees}" },
  { name: "tags", value: "meeting, work" }
]
```

### Processing Pipeline
1. **Placeholder Replacement**: Replace `{attendees}` with actual names
2. **Value Splitting**: Split comma-separated values into arrays
3. **YAML Generation**: Convert to proper YAML list format
4. **Link Formatting**: Wrap participant names in `[[ ]]` for Obsidian links

### Dynamic Content
- `{attendees}` → Formatted participant names as YAML list
- `{participants}` → Same as attendees (alias)
- `{date}` → Formatted meeting creation date using configured date format
- Static values → Used as-is
- Multiple values → Converted to YAML lists

### Date Formatting
- **Configurable Format**: Support for standard date format tokens (YYYY-MM-DD, DD-MM-YYYY, etc.)
- **Format Tokens**: `YYYY`, `YY`, `MM`, `DD` for year, month, day
- **Automatic Processing**: Applied to both titles and custom properties
- **Fallback Handling**: Graceful handling of invalid dates

## File Management

### Directory Handling
- **Creation**: Auto-create sync directories
- **Renaming**: Move files when directory name changes
- **Root Sync**: Support for syncing to vault root (`""` or `"/"`)

### File Operations
- **Creation**: New notes with full content
- **Updates**: Modify existing notes with new content
- **Conflict Resolution**: Skip existing notes if configured

### Sanitization
- **Filenames**: Replace `/`, `\`, `+` with `-`
- **Titles**: Preserve `[` and `]` characters
- **Paths**: Ensure valid filesystem paths

## Settings Interface

### Organization
- **Authentication**: Granola config file path
- **Sync Configuration**: Directory, limits, intervals, skip options
- **File Generation**: Transcript inclusion, title formatting
- **Properties Customization**: Custom property management
- **Actions**: Manual sync trigger

### Dynamic Elements
- **Form Management**: Show/hide property addition form
- **List Updates**: Refresh property list after changes
- **Validation**: Ensure property names and values are valid
- **Debounced Input**: 1-second delay for directory changes to prevent excessive logging

## Settings Persistence

### Configuration Storage
- **Data Location**: Settings stored in `data.json` file in plugin directory
- **Format**: JSON with all user preferences and custom properties
- **Merge Logic**: Preserves saved values over empty defaults
- **Field Handling**: Special treatment for string fields that can be empty

### Persistence Issues Fixed
- **Empty String Preservation**: Empty syncDirectory and other string fields now persist correctly
- **Boolean Values**: Toggle states (like includeFullTranscript) properly saved and loaded
- **Array Values**: Custom properties arrays maintained across plugin restarts
- **Date Format**: User-configured date formatting preserved

## Error Handling

### Authentication Errors
- Invalid or missing config files
- Expired or invalid tokens
- Network connectivity issues

### Content Processing Errors
- Malformed API responses
- Invalid ProseMirror content
- Missing required fields

### File System Errors
- Permission denied
- Disk space issues
- Invalid file paths

## Performance Considerations

### Memory Management
- Process documents in batches
- Limit concurrent operations
- Clean up temporary data

### API Rate Limiting
- Respect Granola API limits
- Implement retry logic with backoff
- Cache authentication tokens

### Large Content Handling
- Stream large transcripts
- Process content incrementally
- Monitor memory usage

## Future Enhancements

### Potential Features
- **Template Support**: Custom note templates
- **Selective Sync**: Sync specific meetings or date ranges
- **Conflict Resolution**: Advanced merging strategies
- **Export Options**: Multiple output formats
- **Plugin Integration**: Work with other Obsidian plugins

### Technical Improvements
- **Better Error Recovery**: Implement retry mechanisms
- **Progress Indicators**: Show sync progress for large batches
- **Background Processing**: Non-blocking sync operations
- **Configuration Export**: Backup and restore settings

## Development Notes

### Code Organization
- **Main Plugin**: Core sync and content processing logic
- **Settings Tab**: User interface and configuration management
- **Utility Functions**: Reusable helpers for common operations

### Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end sync testing
- **Mock Data**: Simulated API responses for development

### Debugging
- **Console Logging**: Detailed operation logging
- **Error Tracking**: Comprehensive error reporting
- **State Inspection**: Settings and data structure logging
</EOF