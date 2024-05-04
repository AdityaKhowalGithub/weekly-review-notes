import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface WeeklyReviewSettings {
	daysAgo: number;
}

const DEFAULT_SETTINGS: WeeklyReviewSettings = {
	daysAgo: 7
}

export default class WeeklyReview extends Plugin {
	settings: WeeklyReviewSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'Start Review',
			name: 'Start Weekly Review',
			callback: () => {
				this.createWeeklyReviewFile();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeeklyReviewSettingTab(this.app, this));
	}

	onunload() {
		// Perform any cleanup if necessary
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createWeeklyReviewFile() {
		const files = this.app.vault.getMarkdownFiles();
		let start = moment().subtract(this.settings.daysAgo, 'days').startOf('day');
		let recentFiles = files.filter(f => moment(f.stat.ctime).isAfter(start)).sort((a, b) => b.stat.ctime - a.stat.ctime);

		const reviewContent = recentFiles.map(f => `- [[${f.basename}]]`).join('\n');
		const reviewFilename = `Weekly Review - ${moment().format('YYYY-MM-DD')}.md`;

		await this.app.vault.create(reviewFilename, reviewContent);

		new Notice(`Weekly review file created with links to ${recentFiles.length} files.`);
		app.workspace.openLinkText(reviewFilename, '', false, { active: true });
	}
}

class WeeklyReviewSettingTab extends PluginSettingTab {
	plugin: WeeklyReview;

	constructor(app: App, plugin: WeeklyReview) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Settings for Weekly Review' });

		new Setting(containerEl)
			.setName('How many days to show?')
			.setDesc('Set the number of days for the review period (default is 7)')
			.addText(text => text
				.setPlaceholder('Days')
				.setValue(this.plugin.settings.daysAgo.toString())
				.onChange(async (value) => {
					let num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.daysAgo = num;
						await this.plugin.saveSettings();
					} else {
						new Notice('Please enter a valid number of days.');
					}
				}));
	}
}
