const generator = require('yeoman-generator');
const assert = require('yeoman-assert');
const chalk = require('chalk');
const prompts = require('./prompts.js');
const replace = require('replace');
const fs = require('fs');


const jhipsterVar = {
    moduleName: 'fix-entity '
};


const jhipsterFunc = {};


module.exports = generator.extend({
    constructor: function (...args) { // eslint-disable-line object-shorthand
        generator.apply(this, args);
        this.entityConfig = this.options.entityConfig;
        this.defaultTableName = this.options.entityConfig.entityClass;
        this.tableNameInput;
    },


    // check current project state, get configs, etc
    initializing() {
        this.log('fix-entity generator');
        this.log('initializing');
        this.composeWith('jhipster:modules',
			{ jhipsterVar, jhipsterFunc },
			this.options.testmode ? { local: require.resolve('generator-jhipster/generators/modules') } : null
		);
    },


    // prompt the user for options
    prompting: {
        askForTableName: prompts.askForTableName,
        askForColumnName: prompts.askForColumnName
    },


    // other Yeoman run loop steps would go here :

    // configuring() : Saving configurations and configure the project (creating .editorconfig files and other metadata files)

    // default() : If the method name doesn't match a priority, it will be pushed to this group.


    /**
     * After creating a new entity, replace the value of the table name.
     *
     * Allows consistent mapping with an existing database table without modifying JHipster's entity subgenerator.
     **/
    writing() {
        // DEBUG : log where we are
        this.log('writing');

        // path of the Java entity class
        // something like : src/main/java/package/domain/Foo.java
        let ORMFile = jhipsterVar.javaDir + '/domain/' + this.entityConfig.entityClass + '.java';

        // path of the Liquibase changelog file
        // something like : src/main/resources/config/liquibase/changelog/20150128232313_added_entity_Foo.xml
        let liquibaseFile = jhipsterVar.resourceDir + 'config/liquibase/changelog/' + this.entityConfig.data.changelogDate + '_added_entity_' + this.entityConfig.entityClass + '.xml';

        // wanted table name (replaces JHipster's automatically created table name)
        let desiredTableName = this.tableNameInput;

        assert.file([ORMFile, liquibaseFile]);

        // replace the value of the 'name' attribute for @Table in the Java entity class

        let prefix = '@Table\\(name = "';
        let suffix = '"\\)';

        replace({
            regex: prefix + '.*' + suffix,
            replacement: prefix.replace('\\', '') + desiredTableName + suffix.replace('\\', ''),
            paths: [ORMFile],
            recursive: false,
            silent: true,
        });

        // replace the value of the 'tableName' attribute in the liquibase _added_entity file for this entity

        prefix = '<createTable tableName="';
        suffix = '">';

        replace({
            regex: prefix + '.*' + suffix,
            replacement: prefix + desiredTableName + suffix,
            paths: [liquibaseFile],
            recursive: false,
            silent: true,
        });

        // update the entity json file
        jhipsterFunc.updateEntityConfig(this.entityConfig.filename, 'entityTableName', desiredTableName);
    },


    // conflict() : Where conflicts are handled (used internally)


    // run installation (npm, bower, etc)
    install() {
        // DEBUG : log where we are
        this.log('install');
    },


    // cleanup, say goodbye
    end() {
        // DEBUG : log where we are
        this.log('End of fix-entity generator');
    }
});
