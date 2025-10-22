// Eis Granola Sync Plugin - Fixed Attendee Extraction (Exact Copy from Original Plugin)
const obsidian = require('obsidian');
const path = require('path');
const fs = require('fs');

function getDefaultAuthPath() {
    if (obsidian.Platform.isWin) {
        return 'AppData/Roaming/Granola/supabase.json';
    } else if (obsidian.Platform.isLinux) {
        return '.config/Granola/supabase.json';
    } else {
        return 'Library/Application Support/Granola/supabase.json';
    }
}

const DEFAULT_SETTINGS = {
    syncDirectory: '',
    notePrefix: '',
    authKeyPath: getDefaultAuthPath(),
    skipExistingNotes: false,
    notesToSync: 5,
    titleFormat: 'none',
    titlePrefix: '',
    titleSuffix: '',
    includeFullTranscript: false,
    autoSyncInterval: 60,
    customProperties: [],
    dateFormat: 'YYYY-MM-DD'  // Formatação de data para {date} placeholder
};

class EisGranolaSyncPlugin extends obsidian.Plugin {
    async onload() {
        console.log('EIS GRANOLA PLUGIN: Starting load process');

        // Load saved settings first, then merge with defaults
        const savedSettings = await this.loadData() || {};

        // Start with saved settings, then add defaults only for missing values
        this.settings = { ...savedSettings };

        // Add defaults only for missing or undefined values
        for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
            if (this.settings[key] === undefined || this.settings[key] === null) {
                this.settings[key] = defaultValue;
            }
        }

        console.log('EIS GRANOLA PLUGIN: Settings loaded');
        console.log('Current settings:', this.settings);

        // Debug specific settings
        console.log('🔧 SETTINGS DEBUG:');
        console.log(`- includeFullTranscript: ${this.settings.includeFullTranscript}`);
        console.log(`- syncDirectory: "${this.settings.syncDirectory}"`);
        console.log(`- authKeyPath: "${this.settings.authKeyPath}"`);
        console.log(`- titleSuffix: "${this.settings.titleSuffix}"`);
        console.log(`- customProperties:`, this.settings.customProperties);

        // Debounce timer for directory changes
        this.directoryChangeTimer = null;

        if (this.settings.autoSyncInterval > 0) {
            this.startAutoSync();
        }

        this.addSettingTab(new EisGranolaSyncSettingTab(this.app, this));

        this.addCommand({
            id: 'sync-granola-notes',
            name: 'Sync Granola Notes Now',
            callback: async () => {
                await this.syncNotes();
            }
        });

        console.log('EIS GRANOLA PLUGIN: Plugin loaded successfully');
    }

    startAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
        
        const intervalMs = this.settings.autoSyncInterval * 60 * 1000;
        this.autoSyncInterval = setInterval(async () => {
            console.log(`Auto-sync triggered (interval: ${this.settings.autoSyncInterval} minutes)`);
            await this.syncNotes();
        }, intervalMs);
        
        console.log(`Auto-sync started with ${this.settings.autoSyncInterval} minute interval`);
    }

    async syncNotes() {
        console.log('Starting Granola sync...');
        
        try {
            console.log('Ensuring directory exists...');
            await this.ensureDirectoryExists();
            
            console.log('Loading credentials...');
            const token = await this.loadCredentials();
            
            if (!token) {
                throw new Error('Failed to load credentials');
            }
            
            console.log('Fetching documents...');
            const documents = await this.fetchGranolaDocuments(token);
            
            if (!documents) {
                throw new Error('Failed to fetch documents');
            }
            
            const notesToProcess = documents.slice(0, this.settings.notesToSync || 1);
            console.log(`Processing ${notesToProcess.length} of ${documents.length} documents (limit: ${this.settings.notesToSync})`);
            
            let syncedCount = 0;
            const syncedNotes = [];
            
            for (const doc of notesToProcess) {
                try {
                    const shouldSync = await this.shouldSyncNote(doc);
                    if (shouldSync) {
                        await this.syncNote(doc);
                        syncedCount++;
                        syncedNotes.push(doc.title || doc.id);
                    }
                } catch (error) {
                    console.error(`Error syncing document ${doc.id}:`, error);
                }
            }
            
            if (syncedCount > 0) {
                const message = `Successfully synced ${syncedCount} notes: ${syncedNotes.join(', ')}`;
                console.log(message);
                
                try {
                    new obsidian.Notice(message);
                } catch (noticeError) {
                    console.error('Failed to show notice:', noticeError);
                    console.log(`Synced ${syncedCount} notes successfully`);
                }
            } else {
                console.log('No new notes to sync');
            }

        } catch (error) {
            console.error('Sync failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                type: typeof error,
                name: error.name
            });
            throw error;
        }
    }

    async ensureDirectoryExists() {
        const syncPath = this.settings.syncDirectory;
        if (syncPath) {
            try {
                console.log(`Checking directory: ${syncPath}`);
                const folder = this.app.vault.getAbstractFileByPath(syncPath);
                if (!folder) {
                    console.log(`Creating directory: ${syncPath}`);
                    await this.app.vault.createFolder(syncPath);
                } else {
                    console.log(`Directory exists: ${syncPath}`);
                }
            } catch (error) {
                console.error('Error creating sync directory:', error);
                throw error;
            }
        }
    }

    async loadCredentials() {
        console.log('Loading credentials...');
        
        try {
            const homedir = require('os').homedir();
            const authPaths = [
                path.resolve(homedir, 'Users', require('os').userInfo().username, 'Library/Application Support/Granola/supabase.json'),
                path.resolve(homedir, this.settings.authKeyPath),
                path.resolve(homedir, 'Library/Application Support/Granola/supabase.json')
            ];

            console.log(`Trying ${authPaths.length} auth paths`);

            for (const authPath of authPaths) {
                try {
                    console.log(`Trying auth path: ${authPath}`);
                    if (fs.existsSync(authPath)) {
                        console.log(`Found auth file: ${authPath}`);
                        const configContent = fs.readFileSync(authPath, 'utf8');
                        const config = JSON.parse(configContent);
                        
                        let token = null;
                        
                        if (config.workos_tokens) {
                            try {
                                const workosData = JSON.parse(config.workos_tokens);
                                token = workosData.access_token;
                                console.log('Found token in workos_tokens');
                            } catch (parseError) {
                                console.error('Error parsing workos_tokens:', parseError);
                            }
                        }
                        
                        if (!token) {
                            token = config.supabase?.anon_key || 
                                   config.anon_key || 
                                   config.api_key ||
                                   config.token ||
                                   config.access_token;
                        }
                        
                        if (token) {
                            console.log(`Successfully loaded credentials from: ${authPath}`);
                            return token;
                        }
                    } else {
                        console.log(`Auth file not found: ${authPath}`);
                    }
                } catch (error) {
                    console.error(`Error reading ${authPath}:`, error.message);
                }
            }

            console.error('No valid credentials found in any path');
            return null;
        } catch (error) {
            console.error('Error in loadCredentials:', error);
            return null;
        }
    }

    async fetchGranolaDocuments(token) {
        console.log('Fetching documents from API...');
        console.log('Token exists:', !!token);
        console.log('Token length:', token ? token.length : 'undefined');
        console.log('Target URL: https://api.granola.ai/v2/get-documents');
        
        try {
            console.log('About to make request...');
            
            if (typeof obsidian.requestUrl !== 'function') {
                throw new Error('obsidian.requestUrl is not available');
            }
            
            const requestConfig = {
                url: 'https://api.granola.ai/v2/get-documents',
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'User-Agent': 'Granola/5.354.0',
                    'X-Client-Version': '5.354.0'
                },
                body: JSON.stringify({
                    limit: 100,
                    offset: 0,
                    include_last_viewed_panel: true
                })
            };
            
            console.log('Request config prepared');
            console.log('Executing request...');
            
            const response = await obsidian.requestUrl(requestConfig);
            
            console.log('Response received');
            console.log('Response status:', response?.status);
            console.log('Response text length:', response?.text ? response.text.length : 'undefined');
            
            if (response.text) {
                console.log('First 500 characters of response:');
                console.log(response.text.substring(0, 500));
                
                try {
                    const responseData = JSON.parse(response.text);
                    console.log('JSON parsing successful!');
                    console.log('Response structure:', Object.keys(responseData));
                    
                    const documents = responseData.docs || [];
                    console.log(`Successfully fetched ${documents.length} documents`);
                    
                    if (documents.length > 0) {
                        const firstDoc = documents[0];
                        console.log('=== FIRST DOCUMENT DEBUG ===');
                        console.log('Document keys:', Object.keys(firstDoc));
                        console.log('Has people field:', !!firstDoc.people);
                        console.log('Has google_calendar_event:', !!firstDoc.google_calendar_event);
                        console.log('Has participants:', !!firstDoc.participants);
                        console.log('Has transcript field:', !!firstDoc.transcript);

                        if (firstDoc.transcript) {
                            console.log(`📋 TRANSCRIPT FOUND: ${firstDoc.transcript.length} chars`);
                            console.log(`📋 TRANSCRIPT PREVIEW: ${firstDoc.transcript.substring(0, 200)}...`);
                        } else {
                            console.log('❌ NO TRANSCRIPT FIELD in first document');
                        }

                        if (firstDoc.people) {
                            console.log('People field type:', typeof firstDoc.people);
                            console.log('People field length:', Array.isArray(firstDoc.people) ? firstDoc.people.length : 'not array');

                            if (Array.isArray(firstDoc.people) && firstDoc.people.length > 0) {
                                console.log('First person keys:', Object.keys(firstDoc.people[0]));
                                console.log('First person sample:', JSON.stringify(firstDoc.people[0], null, 2));
                            } else if (typeof firstDoc.people === 'object') {
                                console.log('People object keys:', Object.keys(firstDoc.people));
                                console.log('People object sample:', JSON.stringify(firstDoc.people, null, 2));
                            }
                        }
                    }
                    
                    if (documents.length === 0) {
                        console.log('API returned empty documents array');
                    }
                    
                    return documents;
                } catch (parseError) {
                    console.error('JSON parsing failed:', parseError.message);
                    console.log('Response is not valid JSON');
                    throw new Error(`Failed to parse API response: ${parseError.message}`);
                }
            } else {
                console.log('No response text available');
                throw new Error('No response text received from API');
            }

        } catch (error) {
            console.error('Error in fetchGranolaDocuments:', error);
            console.error('Error type:', typeof error);
            console.error('Error message:', error?.message);
            console.error('Error stack:', error?.stack);
            throw error;
        }
    }

    async shouldSyncNote(doc) {
        if (this.settings.skipExistingNotes) {
            const filename = this.generateFilename(doc);
            const filePath = this.settings.syncDirectory ? `${this.settings.syncDirectory}/${filename}` : filename;
            
            try {
                const existingFile = this.app.vault.getAbstractFileByPath(filePath);
                if (existingFile) {
                    console.log(`Skipping existing note: ${doc.title || doc.id}`);
                    return false;
                }
            } catch (error) {
                // File doesn't exist, continue
            }
        }

        return true;
    }

    async syncNote(doc) {
        const filename = this.generateFilename(doc);
        const filePath = this.settings.syncDirectory ? `${this.settings.syncDirectory}/${filename}` : filename;
        const content = this.generateNoteContent(doc);

        try {
            console.log(`Syncing note: ${doc.title || doc.id} -> ${filename}`);
            
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);

            if (existingFile) {
                await this.app.vault.modify(existingFile, content);
                console.log(`Updated note: ${filename}`);
            } else {
                await this.app.vault.create(filePath, content);
                console.log(`Created note: ${filename}`);
            }
            
            console.log(`Final content length for ${filename}: ${content.length} characters`);
        } catch (error) {
            console.error(`Failed to sync note ${doc.id}:`, error);
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }

    generateFilename(doc) {
        let formattedTitle = doc.title || 'Untitled';

        if (this.settings.titleFormat === 'prefix' && this.settings.titlePrefix) {
            const prefix = this.settings.titlePrefix.replace('{date}', this.formatDateForTitle(doc.created_at));
            formattedTitle = `${prefix}${formattedTitle}`;
        } else if (this.settings.titleFormat === 'suffix' && this.settings.titleSuffix) {
            const suffix = this.settings.titleSuffix.replace('{date}', this.formatDateForTitle(doc.created_at));
            formattedTitle = `${formattedTitle}${suffix}`;
        }

        const sanitizedTitle = this.sanitizeText(formattedTitle);
        console.log(`Filename generation: "${doc.title}" -> "${formattedTitle}" -> "${sanitizedTitle}"`);
        console.log(`Filename generation: Same formatting applied to H1 title`);
        return `${sanitizedTitle}.md`;
    }

    formatDateForTitle(dateString) {
        if (!dateString) {
            // Fallback to current date if no creation date available
            return this.formatDateString(new Date().toISOString().split('T')[0]);
        }

        try {
            // If it's already in YYYY-MM-DD format, use as-is
            if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return this.formatDateString(dateString);
            }

            // Parse ISO date string and format as configured
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // If parsing fails, fallback to current date
                return this.formatDateString(new Date().toISOString().split('T')[0]);
            }

            return this.formatDateString(date.toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error formatting date for title:', error);
            // Fallback to current date
            return this.formatDateString(new Date().toISOString().split('T')[0]);
        }
    }

    sanitizeText(text) {
        // Remove characters that are invalid for file names and Obsidian links
        return text
            .replace(/[[\](){}]/g, '')  // Remove brackets, parentheses, braces
            .replace(/[\/\\+*#|:"<>?]/g, '-')  // Replace file system invalid chars with dashes
            .replace(/^\.+|\.+$/g, '')  // Remove leading/trailing dots
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .trim();
    }

    generateNoteContent(doc) {
        console.log(`=== GENERATING CONTENT FOR: ${doc.title || doc.id} ===`);

        const title = doc.title || 'Untitled Granola Note';
        const docId = doc.id || 'unknown_id';
        const transcript = doc.transcript || '';

        console.log(`📋 TRANSCRIPT DEBUG:`);
        console.log(`- includeFullTranscript setting: ${this.settings.includeFullTranscript}`);
        console.log(`- transcript field exists: ${!!doc.transcript}`);
        console.log(`- transcript length: ${transcript.length}`);
        console.log(`- transcript preview: ${transcript.substring(0, 100)}...`);

        let contentToParse = null;
        if (doc.last_viewed_panel && doc.last_viewed_panel.content && doc.last_viewed_panel.content.type === 'doc') {
            contentToParse = doc.last_viewed_panel.content;
            console.log('Using last_viewed_panel.content for structured content');
        } else if (doc.notes?.content) {
            contentToParse = doc.notes.content;
            console.log('Using notes.content for structured content');
        }

        let markdownContent = '';
        if (contentToParse) {
            markdownContent = this.convertProseMirrorToMarkdown(contentToParse);
            console.log(`Converted structured content to ${markdownContent.length} chars of markdown`);
        } else {
            console.log('No structured content found');
        }

        // Generate frontmatter with custom properties BELOW standard properties
        let frontmatter = '---\n';
        frontmatter += `granola_id: ${docId}\n`;

        const cleanTitle = title.replace(/"/g, '\\"');
        frontmatter += `title: "${cleanTitle}"\n`;

        // Generate correct Granola URL
        const granolaUrl = `https://notes.granola.ai/d/${docId}`;
        frontmatter += `granola_url: "${granolaUrl}"\n`;

        console.log(`Generated Granola URL: ${granolaUrl}`);
        console.log(`Document ID: ${docId}`);

        if (doc.created_at) {
            frontmatter += `created_at: ${doc.created_at}\n`;
        }
        if (doc.updated_at) {
            frontmatter += `updated_at: ${doc.updated_at}\n`;
        }

        // Add custom properties BELOW standard properties
        if (this.settings.customProperties && this.settings.customProperties.length > 0) {
            for (const prop of this.settings.customProperties) {
                if (prop.name && prop.value) {
                    const processedValue = this.processPropertyValue(prop.value, doc);
                    const values = processedValue.split(',').map(v => v.trim());

                    if (values.length > 1) {
                        // Multiple values - create YAML list without [[ ]]
                        frontmatter += `${prop.name}:\n`;
                        for (const value of values) {
                            if (value.trim()) {
                                frontmatter += `  - "${value.trim()}"\n`;
                            }
                        }
                    } else {
                        // Single value without [[ ]]
                        frontmatter += `${prop.name}: "${processedValue}"\n`;
                    }
                }
            }
        }

        frontmatter += '---\n\n';

        // Apply same formatting (prefix/suffix) as filename generation
        let formattedTitle = title;
        if (this.settings.titleFormat === 'prefix' && this.settings.titlePrefix) {
            const prefix = this.settings.titlePrefix.replace('{date}', this.formatDateForTitle(doc.created_at));
            formattedTitle = `${prefix}${formattedTitle}`;
        } else if (this.settings.titleFormat === 'suffix' && this.settings.titleSuffix) {
            const suffix = this.settings.titleSuffix.replace('{date}', this.formatDateForTitle(doc.created_at));
            formattedTitle = `${formattedTitle}${suffix}`;
        }

        // Use the same sanitized title for both filename and H1
        const sanitizedTitle = this.sanitizeText(formattedTitle);
        let finalMarkdown = frontmatter + '# ' + sanitizedTitle + '\n\n';

        console.log(`Content generation: Original title: "${title}"`);
        console.log(`Content generation: Formatted title: "${formattedTitle}"`);
        console.log(`Content generation: Sanitized title for H1: "${sanitizedTitle}"`);
        console.log(`Content generation: Filename will be: "${sanitizedTitle}.md"`);

        if (markdownContent) {
            finalMarkdown += markdownContent + '\n\n';
        }

        // ✅ FULL TRANSCRIPT SECTION
        if (this.settings.includeFullTranscript && transcript) {
            finalMarkdown += '## Full Transcript\n\n' + transcript;
            console.log(`✅ Added full transcript section (${transcript.length} chars)`);
        } else if (this.settings.includeFullTranscript && !transcript) {
            console.log('❌ Include transcript enabled but no transcript available');
            console.log('Available doc fields:', Object.keys(doc));
        } else {
            console.log('ℹ️ Include transcript disabled in settings');
        }

        console.log(`=== FINAL CONTENT (${finalMarkdown.length} chars) ===`);
        console.log(finalMarkdown.substring(0, 500) + (finalMarkdown.length > 500 ? '...' : ''));

        return finalMarkdown;
    }

    processPropertyValue(value, doc) {
        // Replace {attendees} and {participants} with actual attendee names
        if (value.includes('{attendees}') || value.includes('{participants}')) {
            const attendees = this.extractAttendeeNames(doc);
            console.log(`Found ${attendees.length} attendees for property replacement`);
            if (attendees.length > 0) {
                // Format each attendee name as [[name]] for Obsidian internal links
                const formattedAttendees = attendees.map(name => `[[${name}]]`);
                const formattedValue = value.replace('{attendees}', formattedAttendees.join(', ')).replace('{participants}', formattedAttendees.join(', '));
                console.log(`Formatted attendees: ${formattedValue}`);
                return formattedValue;
            } else {
                return value.replace('{attendees}', 'No attendees').replace('{participants}', 'No participants');
            }
        }

        // Replace {date} with formatted meeting creation date
        if (value.includes('{date}')) {
            const formattedDate = this.formatDateForProperty(doc.created_at);
            return value.replace('{date}', formattedDate);
        }

        return value;
    }

    formatDateForProperty(dateString) {
        if (!dateString) {
            // Fallback to current date if no creation date available
            dateString = new Date().toISOString();
        }

        try {
            // If it's already in YYYY-MM-DD format, parse and format
            if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return this.formatDateString(dateString);
            }

            // Parse ISO date string and format as configured
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // If parsing fails, fallback to current date
                return this.formatDateString(new Date().toISOString().split('T')[0]);
            }

            return this.formatDateString(date.toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error formatting date for property:', error);
            // Fallback to current date
            return this.formatDateString(new Date().toISOString().split('T')[0]);
        }
    }

    formatDateString(dateString) {
        // Simple date formatting based on configured format
        const format = this.settings.dateFormat || 'YYYY-MM-DD';

        try {
            const date = new Date(dateString + 'T00:00:00.000Z'); // Ensure UTC interpretation
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            // Replace format tokens with actual values
            let formatted = format
                .replace('YYYY', year)
                .replace('YY', String(year).slice(-2))
                .replace('MM', month)
                .replace('DD', day);

            return formatted;
        } catch (error) {
            console.error('Error formatting date string:', error);
            return dateString; // Fallback to original format
        }
    }

    extractAttendeeNames(doc) {
        const attendees = [];
        const processedEmails = new Set(); // Track processed emails to avoid duplicates
        
        try {
            console.log('=== EXTRACTING ATTENDEES ===');
            console.log('Available fields:', Object.keys(doc));
            
            // EXACT COPY FROM ORIGINAL PLUGIN - Handle people.creator and people.attendees
            if (doc.people && typeof doc.people === 'object') {
                console.log('Processing people object structure');
                
                // Process creator if available
                if (doc.people.creator) {
                    const creator = doc.people.creator;
                    console.log('Processing creator:', JSON.stringify(creator, null, 2));
                    
                    let creatorName = null;
                    
                    // Try to get creator name from various fields
                    if (creator.name) {
                        creatorName = creator.name;
                        console.log(`Found creator name: ${creatorName}`);
                    } else if (creator.details && creator.details.person && creator.details.person.name) {
                        const personDetails = creator.details.person.name;
                        if (personDetails.fullName) {
                            creatorName = personDetails.fullName;
                            console.log(`Found creator name from fullName: ${creatorName}`);
                        } else if (personDetails.givenName && personDetails.familyName) {
                            creatorName = `${personDetails.givenName} ${personDetails.familyName}`;
                            console.log(`Found creator name from givenName + familyName: ${creatorName}`);
                        } else if (personDetails.givenName) {
                            creatorName = personDetails.givenName;
                            console.log(`Found creator name from givenName: ${creatorName}`);
                        }
                    }
                    
                    if (creatorName && !attendees.includes(creatorName)) {
                        attendees.push(creatorName);
                        console.log(`Added creator: ${creatorName}`);
                    }
                }
                
                // Process attendees array if available
                if (doc.people.attendees && Array.isArray(doc.people.attendees)) {
                    console.log(`Processing ${doc.people.attendees.length} attendees from people.attendees`);
                    
                    for (const attendee of doc.people.attendees) {
                        console.log('Processing attendee from people.attendees:', JSON.stringify(attendee, null, 2));
                        
                        let attendeeName = null;
                        
                        // Try to get attendee name from various fields
                        if (attendee.name) {
                            attendeeName = attendee.name;
                            console.log(`Found attendee name: ${attendeeName}`);
                        } else if (attendee.details && attendee.details.person && attendee.details.person.name) {
                            const personDetails = attendee.details.person.name;
                            if (personDetails.fullName) {
                                attendeeName = personDetails.fullName;
                                console.log(`Found attendee name from fullName: ${attendeeName}`);
                            } else if (personDetails.givenName && personDetails.familyName) {
                                attendeeName = `${personDetails.givenName} ${personDetails.familyName}`;
                                console.log(`Found attendee name from givenName + familyName: ${attendeeName}`);
                            } else if (personDetails.givenName) {
                                attendeeName = personDetails.givenName;
                                console.log(`Found attendee name from givenName: ${attendeeName}`);
                            }
                        } else if (attendee.email) {
                            // Extract name from email if no display name
                            const emailName = attendee.email.split('@')[0].replace(/[._]/g, ' ');
                            attendeeName = emailName;
                            console.log(`Found attendee name from email: ${attendeeName}`);
                        }
                        
                        if (attendeeName && !attendees.includes(attendeeName)) {
                            attendees.push(attendeeName);
                            console.log(`Added attendee: ${attendeeName}`);
                        }
                    }
                }
            }

            // Also check google_calendar_event for additional attendee info
            if (doc.google_calendar_event && doc.google_calendar_event.attendees) {
                console.log(`Processing ${doc.google_calendar_event.attendees.length} calendar attendees`);
                
                for (const attendee of doc.google_calendar_event.attendees) {
                    console.log('Processing calendar attendee:', JSON.stringify(attendee, null, 2));
                    
                    // Skip if we've already processed this email
                    if (attendee.email && processedEmails.has(attendee.email)) {
                        console.log(`Skipping already processed email: ${attendee.email}`);
                        continue;
                    }
                    
                    if (attendee.displayName && !attendees.includes(attendee.displayName)) {
                        attendees.push(attendee.displayName);
                        console.log(`Added calendar attendee: ${attendee.displayName}`);
                    }
                    
                    if (attendee.email) {
                        processedEmails.add(attendee.email);
                    }
                }
            }

            // Fallback to participants field if available
            if (attendees.length === 0 && doc.participants && Array.isArray(doc.participants)) {
                console.log(`Fallback: Processing ${doc.participants.length} participants`);
                
                for (const participant of doc.participants) {
                    if (typeof participant === 'string') {
                        if (!attendees.includes(participant)) {
                            attendees.push(participant);
                            console.log(`Added string participant: ${participant}`);
                        }
                    } else if (participant && typeof participant === 'object') {
                        const name = participant.name || participant.displayName || participant.fullName;
                        const email = participant.email || participant.mail;
                        
                        if (name && !attendees.includes(name)) {
                            attendees.push(name);
                            console.log(`Added participant name: ${name}`);
                        } else if (email && !processedEmails.has(email)) {
                            const emailName = this.formatEmailAsName(email);
                            attendees.push(`[[${emailName}]]`);
                            console.log(`Added formatted email participant: ${emailName}`);
                            processedEmails.add(email);
                        }
                    }
                }
            }

            console.log(`Final attendees count: ${attendees.length}`);
            console.log('Final attendees list:', attendees);
            
            return attendees;
        } catch (error) {
            console.error('Error extracting attendee names:', error);
            return [];
        }
    }

    formatEmailAsName(email) {
        if (!email || !email.includes('@')) {
            return email;
        }
        
        // Extract part before @
        const localPart = email.split('@')[0];
        
        // Replace dots and dashes with spaces
        let name = localPart.replace(/[.-]/g, ' ');
        
        // Convert to Camel Case (capitalize first letter of each word)
        name = name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        return name.trim();
    }

    convertProseMirrorToMarkdown(content) {
        if (!content || typeof content !== 'object' || !content.content) {
            return '';
        }

        const processNode = (node, indentLevel = 0) => {
            if (!node || typeof node !== 'object') {
                return '';
            }

            const nodeType = node.type || '';
            const nodeContent = node.content || [];
            const text = node.text || '';
            
            if (nodeType === 'heading') {
                const level = node.attrs && node.attrs.level ? node.attrs.level : 1;
                const headingText = nodeContent.map(child => processNode(child, indentLevel)).join('');
                return '#'.repeat(level) + ' ' + headingText + '\n\n';
            } else if (nodeType === 'paragraph') {
                const paraText = nodeContent.map(child => processNode(child, indentLevel)).join('');
                return paraText + '\n\n';
            } else if (nodeType === 'bulletList') {
                const items = [];
                for (let i = 0; i < nodeContent.length; i++) {
                    const item = nodeContent[i];
                    if (item.type === 'listItem') {
                        const processedItem = this.processListItem(item, indentLevel);
                        if (processedItem) {
                            items.push(processedItem);
                        }
                    }
                }
                return items.join('\n') + '\n\n';
            } else if (nodeType === 'text') {
                return text;
            } else {
                return nodeContent.map(child => processNode(child, indentLevel)).join('');
            }
        };

        return processNode(content);
    }

    processListItem(listItem, indentLevel = 0) {
        if (!listItem || !listItem.content) {
            return '';
        }

        const indent = '  '.repeat(indentLevel);
        let itemText = '';
        let hasNestedLists = false;
        
        for (const child of listItem.content) {
            if (child.type === 'paragraph') {
                const paraText = (child.content || []).map(node => {
                    if (node.type === 'text') {
                        return node.text || '';
                    }
                    return '';
                }).join('');
                itemText = paraText;
            }
        }
        
        return indent + '- ' + itemText;
    }

    async renameSyncDirectory(oldPath, newPath) {
        try {
            if (!oldPath || !newPath || oldPath === newPath) {
                return;
            }

            console.log(`Renaming sync directory from "${oldPath}" to "${newPath}"`);

            const oldFolder = this.app.vault.getAbstractFileByPath(oldPath);
            if (oldFolder && oldFolder instanceof obsidian.TFolder) {
                await this.app.vault.createFolder(newPath);

                const files = this.app.vault.getFiles();
                const filesToMove = files.filter(file => file.path.startsWith(oldPath + '/'));

                for (const file of filesToMove) {
                    const newFilePath = file.path.replace(oldPath, newPath);
                    console.log(`Moving file: ${file.path} -> ${newFilePath}`);
                    await this.app.vault.rename(file, newFilePath);
                }

                await this.app.vault.delete(oldFolder);
                console.log(`Successfully renamed directory from "${oldPath}" to "${newPath}"`);
            }
        } catch (error) {
            console.error(`Error renaming directory from "${oldPath}" to "${newPath}":`, error);
        }
    }

    // Debounce function for directory changes
    debouncedDirectoryChange(value) {
        if (this.directoryChangeTimer) {
            clearTimeout(this.directoryChangeTimer);
        }

        this.directoryChangeTimer = setTimeout(async () => {
            const newValue = value.trim();
            const oldValue = this.settings.syncDirectory;

            if (newValue === '' || newValue === '/') {
                this.settings.syncDirectory = '';
            } else {
                this.settings.syncDirectory = newValue;
            }

            await this.saveData(this.settings);

            if (oldValue && oldValue !== this.settings.syncDirectory) {
                await this.renameSyncDirectory(oldValue, this.settings.syncDirectory);
            }

            console.log(`Sync directory changed from "${oldValue}" to "${this.settings.syncDirectory}"`);
        }, 1000); // Wait 1 second after user stops typing
    }

    onunload() {
        console.log('EIS GRANOLA PLUGIN: Unloading');
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
        if (this.directoryChangeTimer) {
            clearTimeout(this.directoryChangeTimer);
        }
    }
}

class EisGranolaSyncSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();

        containerEl.createEl('h2', {text: 'Eis Granola Sync Settings'});

        // Authentication section
        new obsidian.Setting(containerEl)
            .setName('Granola Configuration File')
            .setDesc('Path to Granola configuration file')
            .addText(text => text
                .setPlaceholder('Library/Application Support/Granola/supabase.json')
                .setValue(this.plugin.settings.authKeyPath)
                .onChange(async (value) => {
                    this.plugin.settings.authKeyPath = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // Sync configuration section
        containerEl.createEl('h3', {text: 'Sync Configuration'});

        new obsidian.Setting(containerEl)
            .setName('Sync Directory')
            .setDesc('Directory to save synced notes (leave empty for root vault)')
            .addText(text => text
                .setPlaceholder('Granola')
                .setValue(this.plugin.settings.syncDirectory || '')
                .onChange((value) => {
                    // Use debounced function instead of direct processing
                    this.plugin.debouncedDirectoryChange(value);
                }));

        new obsidian.Setting(containerEl)
            .setName('Notes to Sync')
            .setDesc('Number of recent notes to sync (default: 1)')
            .addText(text => text
                .setPlaceholder('1')
                .setValue((this.plugin.settings.notesToSync || 1).toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value) || 1;
                    this.plugin.settings.notesToSync = Math.max(1, numValue);
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new obsidian.Setting(containerEl)
            .setName('Auto Sync Interval (minutes)')
            .setDesc('Automatically sync every X minutes (0 = disabled)')
            .addText(text => text
                .setPlaceholder('0')
                .setValue((this.plugin.settings.autoSyncInterval || 0).toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value) || 0;
                    this.plugin.settings.autoSyncInterval = Math.max(0, numValue);
                    await this.plugin.saveData(this.plugin.settings);
                    
                    if (this.plugin.settings.autoSyncInterval > 0) {
                        this.plugin.startAutoSync();
                    } else {
                        if (this.plugin.autoSyncInterval) {
                            clearInterval(this.plugin.autoSyncInterval);
                            this.plugin.autoSyncInterval = null;
                        }
                    }
                }));

        new obsidian.Setting(containerEl)
            .setName('Skip Synced Notes')
            .setDesc('Skip syncing notes that already exist in the vault')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.skipExistingNotes)
                .onChange(async (value) => {
                    this.plugin.settings.skipExistingNotes = value;
                    await this.plugin.saveData(this.plugin.settings);
                }));

        // Properties Customization section
        const propertiesSection = containerEl.createEl('div');
        propertiesSection.createEl('h3', {text: 'Properties Customization'});

        // Display existing custom properties
        if (this.plugin.settings.customProperties && this.plugin.settings.customProperties.length > 0) {
            this.plugin.settings.customProperties.forEach((prop, index) => {
                new obsidian.Setting(propertiesSection)
                    .setName(`${prop.name}: ${prop.value}`)
                    .setDesc('Custom property')
                    .addButton(button => button
                        .setButtonText('Remove')
                        .setCta()
                        .setClass('remove-property-button')
                        .onClick(async () => {
                            this.plugin.settings.customProperties.splice(index, 1);
                            await this.plugin.saveData(this.plugin.settings);
                            this.display();
                        }));
            });
        }

        // Add new property button - ABOVE the form
        const addButtonContainer = propertiesSection.createDiv();
        new obsidian.Setting(addButtonContainer)
            .setName('Add Custom Property')
            .setDesc('Add a custom property to be included in note frontmatter. Use {attendees}, {participants} or {date} for dynamic content.')
            .addButton(button => button
                .setButtonText('Add Property')
                .setCta()
                .onClick(() => {
                    this.showAddPropertyForm(propertiesSection, addButtonContainer);
                }));

        // File generation section
        containerEl.createEl('h3', {text: 'File Generation'});

        new obsidian.Setting(containerEl)
            .setName('Date Format')
            .setDesc('Format for {date} placeholder in titles and custom properties (e.g., YYYY-MM-DD, DD-MM-YYYY)')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dateFormat || 'YYYY-MM-DD')
                .onChange(async (value) => {
                    this.plugin.settings.dateFormat = value || 'YYYY-MM-DD';
                    await this.plugin.saveData(this.plugin.settings);
                }));

        new obsidian.Setting(containerEl)
            .setName('Include Full Transcript')
            .setDesc('Include full meeting transcript in synced notes')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.includeFullTranscript || false)
                .onChange(async (value) => {
                    console.log(`🔧 TRANSCRIPT TOGGLE CHANGED: ${value}`);
                    this.plugin.settings.includeFullTranscript = value;
                    await this.plugin.saveData(this.plugin.settings);
                    console.log(`🔧 TRANSCRIPT SETTING SAVED: ${this.plugin.settings.includeFullTranscript}`);
                }));

        new obsidian.Setting(containerEl)
            .setName('Title Format')
            .setDesc('Choose how to format note titles')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'None')
                .addOption('prefix', 'Prefix')
                .addOption('suffix', 'Suffix')
                .setValue(this.plugin.settings.titleFormat || 'none')
                .onChange(async (value) => {
                    this.plugin.settings.titleFormat = value;
                    await this.plugin.saveData(this.plugin.settings);
                    this.display(containerEl);
                }));

        if ((this.plugin.settings.titleFormat || 'none') !== 'none') {
            new obsidian.Setting(containerEl)
                .setName(this.plugin.settings.titleFormat === 'prefix' ? 'Title Prefix' : 'Title Suffix')
                .setDesc(`Text to ${this.plugin.settings.titleFormat === 'prefix' ? 'prefix' : 'suffix'} to note titles and custom properties. Use {date} for meeting creation date.`)
                .addText(text => text
                    .setPlaceholder(this.plugin.settings.titleFormat === 'prefix' ? 'Meeting {date} - ' : ' - {date}')
                    .setValue(this.plugin.settings.titleFormat === 'prefix' ? (this.plugin.settings.titlePrefix || '') : (this.plugin.settings.titleSuffix || ''))
                    .onChange(async (value) => {
                        if (this.plugin.settings.titleFormat === 'prefix') {
                            this.plugin.settings.titlePrefix = value;
                        } else {
                            this.plugin.settings.titleSuffix = value;
                        }
                        await this.plugin.saveData(this.plugin.settings);
                    }));
        }

        // Actions section
        containerEl.createEl('h3', {text: 'Actions'});
        const syncButton = containerEl.createEl('button', {
            text: 'Sync Now',
            cls: 'mod-cta'
        });
        syncButton.addEventListener('click', async () => {
            syncButton.disabled = true;
            syncButton.textContent = 'Syncing...';
            
            try {
                await this.plugin.syncNotes();
            } catch (error) {
                console.error('Sync button error:', error);
            }
            
            syncButton.disabled = false;
            syncButton.textContent = 'Sync Now';
        });
    }

    showAddPropertyForm(section, insertBefore) {
        // Create form container
        const formContainer = section.createDiv('custom-property-form');
        formContainer.style.padding = '10px';
        formContainer.style.border = '1px solid var(--background-modifier-border)';
        formContainer.style.borderRadius = '5px';
        formContainer.style.marginBottom = '10px';

        // Insert before the Add Property button
        section.insertBefore(formContainer, insertBefore);

        // Property name input
        const nameInput = formContainer.createEl('input', {
            type: 'text',
            placeholder: 'Property name (e.g., status, priority, tags)'
        });
        nameInput.style.width = '48%';
        nameInput.style.marginRight = '4%';

        // Property value input
        const valueInput = formContainer.createEl('input', {
            type: 'text',
            placeholder: 'Property value (use {attendees}, {participants} or {date} for dynamic content)'
        });
        valueInput.style.width = '48%';

        // Buttons container
        const buttonsContainer = formContainer.createDiv();
        buttonsContainer.style.marginTop = '10px';

        // Save button
        const saveButton = buttonsContainer.createEl('button', {
            text: 'Save Property'
        });
        saveButton.style.marginRight = '10px';

        // Cancel button
        const cancelButton = buttonsContainer.createEl('button', {
            text: 'Cancel'
        });

        const closeForm = () => {
            formContainer.remove();
        };

        saveButton.addEventListener('click', async () => {
            const name = nameInput.value.trim();
            const value = valueInput.value.trim();

            if (name && value) {
                // Check if property already exists
                const existingIndex = this.plugin.settings.customProperties.findIndex(p => p.name === name);
                
                if (existingIndex >= 0) {
                    // Update existing property
                    this.plugin.settings.customProperties[existingIndex].value = value;
                    console.log(`Updated existing property: ${name} = ${value}`);
                } else {
                    // Add new property
                    this.plugin.settings.customProperties.push({ name, value });
                    console.log(`Added new property: ${name} = ${value}`);
                }

                await this.plugin.saveData(this.plugin.settings);
                closeForm();
                this.display();
            }
        });

        cancelButton.addEventListener('click', closeForm);
    }
}

module.exports = EisGranolaSyncPlugin;
