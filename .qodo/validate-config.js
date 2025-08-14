#!/usr/bin/env node

/**
 * Qodo Configuration Validator for Professional PDF Editor
 * 
 * This script validates the Qodo configuration files to ensure they are
 * properly formatted and contain all required settings.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class QodoConfigValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.configDir = path.join(process.cwd(), '.qodo');
        this.rootConfig = path.join(process.cwd(), '.qodo.yaml');
    }

    /**
     * Main validation function
     */
    async validate() {
        console.log('🔍 Validating Qodo configuration...\n');

        try {
            await this.validateMainConfig();
            await this.validateCustomRules();
            await this.validateWorkflows();
            await this.validateIgnoreFile();
            await this.validateTemplates();

            this.printResults();
            return this.errors.length === 0;
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            return false;
        }
    }

    /**
     * Validate main .qodo.yaml configuration
     */
    async validateMainConfig() {
        console.log('📋 Validating main configuration (.qodo.yaml)...');

        if (!fs.existsSync(this.rootConfig)) {
            this.errors.push('Main configuration file .qodo.yaml not found');
            return;
        }

        try {
            const content = fs.readFileSync(this.rootConfig, 'utf8');
            const config = yaml.load(content);

            // Validate required sections
            const requiredSections = ['project', 'review', 'security', 'testing'];
            for (const section of requiredSections) {
                if (!config[section]) {
                    this.errors.push(`Missing required section: ${section}`);
                }
            }

            // Validate project information
            if (config.project) {
                if (!config.project.name) {
                    this.errors.push('Project name is required');
                }
                if (!config.project.language) {
                    this.warnings.push('Project language not specified');
                }
            }

            // Validate review settings
            if (config.review) {
                if (!config.review.include_patterns || config.review.include_patterns.length === 0) {
                    this.warnings.push('No include patterns specified for review');
                }
                if (!config.review.focus_areas || config.review.focus_areas.length === 0) {
                    this.warnings.push('No focus areas specified for review');
                }
            }

            // Validate security settings
            if (config.security) {
                if (config.security.enabled !== true) {
                    this.warnings.push('Security scanning is not enabled');
                }
            }

            console.log('✅ Main configuration validated');
        } catch (error) {
            this.errors.push(`Invalid YAML in main configuration: ${error.message}`);
        }
    }

    /**
     * Validate custom rules configuration
     */
    async validateCustomRules() {
        console.log('📝 Validating custom rules...');

        const customRulesPath = path.join(this.configDir, 'custom-rules.yaml');
        
        if (!fs.existsSync(customRulesPath)) {
            this.warnings.push('Custom rules file not found');
            return;
        }

        try {
            const content = fs.readFileSync(customRulesPath, 'utf8');
            const rules = yaml.load(content);

            if (!rules.rules) {
                this.errors.push('Custom rules file missing rules section');
                return;
            }

            // Validate rule categories
            const expectedCategories = ['electron_security', 'pdf_processing', 'react_typescript', 'security'];
            for (const category of expectedCategories) {
                if (!rules.rules[category]) {
                    this.warnings.push(`Missing rule category: ${category}`);
                }
            }

            // Validate individual rules
            for (const [category, categoryRules] of Object.entries(rules.rules)) {
                if (Array.isArray(categoryRules)) {
                    for (const rule of categoryRules) {
                        if (!rule.id) {
                            this.errors.push(`Rule in category ${category} missing id`);
                        }
                        if (!rule.severity) {
                            this.warnings.push(`Rule ${rule.id} missing severity`);
                        }
                        if (!rule.pattern) {
                            this.warnings.push(`Rule ${rule.id} missing pattern`);
                        }
                    }
                }
            }

            console.log('✅ Custom rules validated');
        } catch (error) {
            this.errors.push(`Invalid YAML in custom rules: ${error.message}`);
        }
    }

    /**
     * Validate workflows configuration
     */
    async validateWorkflows() {
        console.log('⚙️ Validating workflows...');

        const workflowsPath = path.join(this.configDir, 'workflows.yaml');
        
        if (!fs.existsSync(workflowsPath)) {
            this.warnings.push('Workflows file not found');
            return;
        }

        try {
            const content = fs.readFileSync(workflowsPath, 'utf8');
            const workflows = yaml.load(content);

            if (!workflows.workflows) {
                this.errors.push('Workflows file missing workflows section');
                return;
            }

            // Validate required workflows
            const requiredWorkflows = ['pull_request', 'main_branch'];
            for (const workflow of requiredWorkflows) {
                if (!workflows.workflows[workflow]) {
                    this.warnings.push(`Missing workflow: ${workflow}`);
                }
            }

            // Validate workflow structure
            for (const [name, workflow] of Object.entries(workflows.workflows)) {
                if (!workflow.trigger) {
                    this.errors.push(`Workflow ${name} missing trigger configuration`);
                }
                if (!workflow.steps) {
                    this.errors.push(`Workflow ${name} missing steps`);
                }
            }

            console.log('✅ Workflows validated');
        } catch (error) {
            this.errors.push(`Invalid YAML in workflows: ${error.message}`);
        }
    }

    /**
     * Validate ignore file
     */
    async validateIgnoreFile() {
        console.log('🚫 Validating ignore file...');

        const ignorePath = path.join(process.cwd(), '.qodoignore');
        
        if (!fs.existsSync(ignorePath)) {
            this.warnings.push('.qodoignore file not found');
            return;
        }

        const content = fs.readFileSync(ignorePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

        // Check for common patterns
        const expectedPatterns = ['node_modules/', 'dist/', '*.log', 'coverage/'];
        for (const pattern of expectedPatterns) {
            if (!lines.some(line => line.includes(pattern))) {
                this.warnings.push(`Consider adding ${pattern} to .qodoignore`);
            }
        }

        console.log('✅ Ignore file validated');
    }

    /**
     * Validate template files
     */
    async validateTemplates() {
        console.log('📄 Validating templates...');

        const templatePath = path.join(this.configDir, 'pr-template.md');
        
        if (!fs.existsSync(templatePath)) {
            this.warnings.push('PR template not found');
            return;
        }

        const content = fs.readFileSync(templatePath, 'utf8');
        
        // Check for required sections
        const requiredSections = ['Description', 'Type of Change', 'Security Checklist', 'Testing'];
        for (const section of requiredSections) {
            if (!content.includes(section)) {
                this.warnings.push(`PR template missing section: ${section}`);
            }
        }

        console.log('✅ Templates validated');
    }

    /**
     * Print validation results
     */
    printResults() {
        console.log('\n📊 Validation Results:');
        console.log('='.repeat(50));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 All configurations are valid!');
            return;
        }

        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }

        console.log('\n📝 Summary:');
        console.log(`  Errors: ${this.errors.length}`);
        console.log(`  Warnings: ${this.warnings.length}`);

        if (this.errors.length === 0) {
            console.log('\n✅ Configuration is valid (with warnings)');
        } else {
            console.log('\n❌ Configuration has errors that need to be fixed');
        }
    }
}

// Check if js-yaml is available, if not provide fallback
let yaml;
try {
    yaml = require('js-yaml');
} catch (error) {
    console.log('⚠️  js-yaml not found, using simple YAML parser');
    yaml = {
        load: (content) => {
            try {
                // Simple YAML parser for basic validation
                return JSON.parse(content.replace(/:\s*([^"\n]*)/g, ': "$1"'));
            } catch {
                throw new Error('Invalid YAML format');
            }
        }
    };
}

// Run validation if called directly
if (require.main === module) {
    const validator = new QodoConfigValidator();
    validator.validate().then(isValid => {
        process.exit(isValid ? 0 : 1);
    });
}

module.exports = QodoConfigValidator;