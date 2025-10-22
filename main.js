// Eis Granola Sync Plugin - Clean version
const obsidian = require('obsidian');

class EisGranolaSyncPlugin extends obsidian.Plugin {
    async onload() {
        console.log('EIS GRANOLA PLUGIN: Loading');
        
        this.settings = Object.assign({
            syncDirectory: 'Granola',
            authKeyPath: '',
            skipExistingNotes: false,
            notesToSync: 1,
            titleFormat: 'none',
            includeFullTranscript: false,
            autoSyncInterval: 0,
            customProperties: []
        }, await this.loadData());

        console.log('EIS GRANOLA PLUGIN: Settings loaded');
        console.log('Plugin ready for testing');
        
        this.addSettingTab(new EisGranolaSyncSettingTab(this.app, this));
    }

    async onunload() {
        console.log('EIS GRANOLA PLUGIN: Unloading');
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

        containerEl.createEl('h2', {text: 'Eis Granola Sync'});

        new obsidian.Setting(containerEl)
            .setName('Plugin Status')
            .setDesc('Plugin loaded successfully')
            .addButton(button => button
                .setButtonText('Test')
                .setCta()
                .onClick(() => {
                    console.log('Plugin test button clicked');
                    console.log('Settings:', this.plugin.settings);
                }));
    }
}

module.exports = EisGranolaSyncPlugin;
