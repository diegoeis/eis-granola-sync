# EIS Granola Sync Plugin - Product Requirements Document

## Executive Summary

The EIS Granola Sync Plugin is an Obsidian plugin designed to synchronize meeting notes from Granola AI into Obsidian vaults. It provides seamless integration between Granola's meeting documentation system and Obsidian's note-taking capabilities, with advanced features for content processing, customization, and automation.

## Problem Statement

Users of Granola AI need a reliable way to export and organize their meeting notes within Obsidian, but existing solutions lack:
- Proper content structure preservation
- Attendee information extraction and formatting
- Customizable metadata properties
- Automated synchronization capabilities
- Robust error handling and user feedback

## Solution Overview

The EIS Granola Sync Plugin addresses these needs by providing:
- **Intelligent Content Processing**: Converts Granola's structured content to clean Markdown
- **Advanced Attendee Handling**: Extracts and formats participant information from various data sources
- **Customizable Properties**: Allows users to define custom frontmatter properties with dynamic content
- **Automated Operations**: Supports scheduled sync and smart directory management
- **Comprehensive Error Handling**: Provides detailed feedback and graceful failure recovery

## Core Features

### 1. Authentication & API Integration
- **Secure Token Management**: Reads authentication credentials from Granola's configuration files
- **Multiple Auth Sources**: Supports various token storage locations and formats
- **Robust Error Handling**: Graceful handling of authentication failures and network issues

### 2. Content Synchronization
- **Selective Sync**: Configurable number of recent notes to synchronize
- **Smart Updates**: Skip existing notes or update them based on user preference
- **Directory Management**: Automatic folder creation, renaming, and file organization
- **Root Vault Support**: Option to sync directly to vault root instead of subdirectories

### 3. Content Processing
- **ProseMirror Conversion**: Converts Granola's document format to readable Markdown
- **Transcript Integration**: Include full meeting transcripts as separate sections
- **Structured Content**: Preserve meeting structure including headings, lists, and formatting
- **Fallback Processing**: Handle various content structure formats from the API

### 4. Attendee Processing
- **Multi-Source Extraction**: Extract attendee information from multiple API fields
- **Email Name Formatting**: Convert email addresses to readable names
  - `john.doe@company.com` → `John Doe`
  - `maria-silva@enterprise.org` → `Maria Silva`
- **Obsidian Integration**: Format names as internal links for easy navigation

### 5. Custom Properties System
- **Dynamic Property Definition**: Users can define custom frontmatter properties
- **Placeholder Support**: Use `{attendees}` or `{participants}` for dynamic content
- **List Generation**: Convert comma-separated values to YAML lists
- **Property Management**: Add, edit, and remove custom properties through the UI

### 6. User Interface
- **Organized Settings**: Clean, categorized configuration interface
- **Dynamic Forms**: Context-aware property addition and editing
- **Visual Feedback**: Success notifications and error reporting
- **Responsive Design**: Works across different screen sizes and Obsidian themes

## Technical Architecture

### Plugin Structure
```
eis-granola-sync/
├── main.js              # Core plugin logic
├── manifest.json        # Plugin metadata
├── styles.css           # Custom styling
├── README.md           # User documentation
└── prod-specs/         # Technical documentation
    ├── notes.md        # Technical implementation notes
    ├── properties-examples.md  # Usage examples
    └── prd-eis-granola-plugin.md  # This document
```

### Core Classes
- **EisGranolaSyncPlugin**: Main plugin class extending `obsidian.Plugin`
- **EisGranolaSyncSettingTab**: Settings interface extending `obsidian.PluginSettingTab`

### Data Flow
1. **Settings Load**: Load user configuration from Obsidian's data storage
2. **Authentication**: Extract credentials from Granola configuration files
3. **API Request**: Fetch meeting documents from Granola API
4. **Content Processing**: Convert structured content to Markdown format
5. **Property Injection**: Add custom properties to note frontmatter
6. **File Operations**: Create or update notes in the vault

## User Stories

### Primary User Flow
1. **Setup**: User configures Granola authentication and sync preferences
2. **Initial Sync**: User triggers first synchronization to import recent meetings
3. **Content Review**: User reviews imported notes with proper formatting and metadata
4. **Customization**: User adds custom properties for enhanced organization
5. **Automation**: User enables automatic sync for ongoing meeting imports

### Advanced Usage Scenarios
1. **Team Collaboration**: Multiple team members sync meetings to shared vault
2. **Project Organization**: Use custom properties to categorize meetings by project/client
3. **Knowledge Management**: Leverage attendee links for easy navigation between related meetings
4. **Archive Management**: Maintain organized meeting history with proper metadata

## Non-Functional Requirements

### Performance
- **Sync Speed**: Process up to 50 meetings per minute
- **Memory Usage**: Efficient handling of large meeting transcripts
- **Background Operation**: Non-blocking sync operations that don't freeze the UI

### Reliability
- **Error Recovery**: Graceful handling of API failures and network issues
- **Data Integrity**: Ensure no data loss during sync operations
- **Consistency**: Maintain consistent file naming and organization

### Security
- **Credential Safety**: Secure handling of authentication tokens
- **Local Processing**: All content processing happens locally
- **No Data Leakage**: No external transmission of meeting content

### Usability
- **Intuitive Interface**: Clear, well-organized settings interface
- **Helpful Feedback**: Informative success/error messages
- **Documentation**: Comprehensive user guide and technical documentation

## Success Metrics

### User Adoption
- **Installation Rate**: Target 100+ active installations
- **Retention Rate**: 80% of users continue using after 30 days
- **Feature Usage**: 70% of users utilize custom properties feature

### Technical Performance
- **Sync Success Rate**: 95% of sync operations complete successfully
- **Error Rate**: Less than 1% of operations result in unhandled errors
- **Response Time**: Average sync time under 30 seconds for 10 meetings

### User Satisfaction
- **Ease of Use**: Average setup time under 5 minutes
- **Feature Completeness**: 90% of requested features implemented
- **Documentation Quality**: User rating of 4.5/5 for documentation helpfulness

## Risk Assessment

### Technical Risks
- **API Changes**: Granola API structure changes could break functionality
- **Authentication Issues**: Changes in token format or storage location
- **Content Format Evolution**: New ProseMirror node types not supported

### Mitigation Strategies
- **API Monitoring**: Regular testing against Granola API changes
- **Backward Compatibility**: Support multiple API response formats
- **Extensible Architecture**: Easy to add support for new content types

### User Risks
- **Data Loss**: Incorrect configuration could overwrite existing notes
- **Privacy Concerns**: Meeting content stored locally in plain text
- **Performance Impact**: Large vaults could slow down sync operations

## Future Roadmap

### Phase 1 (Current Release)
- Core synchronization functionality
- Basic content processing
- Custom properties system
- Attendee formatting

### Phase 2 (Next 3 Months)
- **Template System**: Custom note templates for different meeting types
- **Advanced Filtering**: Sync specific meetings based on criteria
- **Batch Operations**: Bulk update existing notes with new properties
- **Plugin Integration**: Work with other Obsidian plugins (Dataview, etc.)

### Phase 3 (Next 6 Months)
- **Export Options**: Multiple output formats (PDF, DOCX, etc.)
- **Collaboration Features**: Shared sync configurations for teams
- **Advanced Automation**: Trigger-based sync (calendar events, etc.)
- **Analytics Dashboard**: Sync statistics and insights

## Competitive Analysis

### Existing Solutions
- **Granola Web Export**: Basic HTML export, no Obsidian integration
- **Manual Copy-Paste**: Time-consuming, error-prone, no metadata
- **Other Sync Tools**: Limited customization, poor content handling

### Competitive Advantages
- **Deep Obsidian Integration**: Native plugin with vault-aware operations
- **Advanced Content Processing**: Superior handling of structured meeting content
- **Extensive Customization**: Unmatched flexibility in property definition
- **Robust Automation**: Reliable scheduled sync with error recovery

## Technical Specifications

### Supported Platforms
- **Obsidian Version**: 1.0.0 and later
- **Operating Systems**: Windows, macOS, Linux
- **Granola API**: v2 endpoints

### Dependencies
- **Obsidian API**: Plugin development framework
- **Node.js Built-ins**: `fs`, `path`, `os` modules
- **No External Dependencies**: Self-contained plugin

### Performance Benchmarks
- **Memory Usage**: <50MB for typical sync operations
- **CPU Usage**: Minimal impact on system performance
- **Storage**: Efficient file operations with cleanup

## Conclusion

The EIS Granola Sync Plugin represents a comprehensive solution for integrating Granola AI meeting documentation with Obsidian's powerful note-taking capabilities. By combining intelligent content processing, extensive customization options, and robust automation features, it provides users with a seamless experience for managing their meeting knowledge base.

The plugin's architecture supports both current needs and future enhancements, making it a solid foundation for long-term meeting documentation workflows.
</EOF