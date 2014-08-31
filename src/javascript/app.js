Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selector_box', margin: 5, height: 50},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    field_names: ['ObjectID','FormattedID','Name','Parent','PortfolioItem'],

    launch: function() {
        this._fetchModels().then({
            scope: this,
            success:function(models){
                this.models = models;
                this._addSelectors(this.down('#selector_box'));
                this._addTree();
            },
            failure: function(error_msg){
                alert(error_msg);
            }
        });

    },
    _addTree: function() {
        var container = this.down('#display_box');
        container.removeAll();
        
        container.add({
            xtype:'insideouttree',
            columns: this._getColumns(),
            targetQuery: '( Iteration.Name = "R3 S1" )',
            margin: 5,
            listeners: {
                scope:this,
                afterrender:function(){
                    this.setLoading("Loading tree...");
                },
                afterloadtargets:function() {
                    this.setLoading('Finding relatives...');
                },
                afterload:function(){
                    this.setLoading('Building tree...');
                },
                aftertree:function(){
                    this.setLoading(false);
                }
            }
        });
    },
    _addSelectors: function(container){
        var model_names = Ext.Object.getKeys(this.models);
        container.add({
            xtype:'rallyfieldpicker',
            autoExpand:false,
            alwaysExpanded: false,
            fieldLabel: 'Show Fields:',
            labelWidth: 65,
            modelTypes:model_names,
            useColumnHeaderLabels: true,
            listeners: {
                scope: this,
                blur: function(picker){
                    this.additional_columns = picker.getValue();
                    picker.collapse();
                    this._addTree();
                }
            }
        });
    },
    _getColumns: function() {
        var me = this;
        var name_renderer = function(value,meta_data,record) {
            return me._nameRenderer(value,meta_data,record);
        };
        
        var magic_renderer = function(field,value,meta_data,record){
            return me._magicRenderer(field,value,meta_data,record);
        }
        
        var columns = [
            {
                xtype: 'treecolumn',
                text: 'Item',
                dataIndex: 'Name',
                itemId: 'tree_column',
                renderer: name_renderer,
                width: 200,
                menuDisabled: true,
                otherFields: ['FormattedID','ObjectID']
            }
        ];
        
        if ( this.additional_columns ) {
            this.logger.log("Additional fields: ", this.additional_columns);
            Ext.Array.each(this.additional_columns, function(field) {
                columns.push({
                    text:field.get('displayName').replace(/\(.*\)/,""),
                    dataIndex:field.get('name'),
                    menuDisabled: true,
                    renderer:function(value,meta_data,record){
                        return me._magicRenderer(field,value,meta_data,record) || "";
                    }
                });
            });
        }
        return columns;
    },
    _magicRenderer: function(field,value,meta_data,record){
        var field_name = field.get('name');
        var record_type = record.get('_type');
        var model = this.models[record_type];
        // will fail fi field is not on the record
        // (e.g., we pick accepted date, by are also showing features
        try {
            var template = Rally.ui.renderer.RendererFactory.getRenderTemplate(model.getField(field_name)) || "";
            return template.apply(record.data);
        } catch(e) {
            return ".";
        }
    },
    _nameRenderer: function(value,meta_data,record) {
        var display_value = record.get('Name');
        if ( record.get('FormattedID') ) {
            var link_text = record.get('FormattedID') + ": " + value;
            var url = Rally.nav.Manager.getDetailUrl( record );
            display_value = "<a target='_blank' href='" + url + "'>" + link_text + "</a>";
        }
        return display_value;
    },
    _fetchModels: function(){
        var deferred = Ext.create('Deft.Deferred');
        this._fetchPortfolioNames().then({
            scope: this,
            success:function(pi_names){
                var model_names = Ext.Array.merge(['defect','hierarchicalrequirement'],pi_names);
                console.log("model_names",model_names);
                Rally.data.ModelFactory.getModels({
                    types: model_names,
                    success: function(model_hash) {
                        deferred.resolve(model_hash);
                    },
                    failure: deferred.reject
                });
            },
            failure:deferred.reject
        });
        return deferred.promise;
    },
    _fetchPortfolioNames: function(){
        var deferred = Ext.create('Deft.Deferred');
        
        Ext.create('Rally.data.wsapi.Store', {
            autoLoad: true,
            model: 'TypeDefinition',
            sorters: [{
              property: 'Ordinal',
              direction: 'ASC'
            }],
            filters: [{
              property: 'Parent.Name',
              operator: '=',
              value: 'Portfolio Item'
            }, {
              property: 'Creatable',
              operator: '=',
              value: true
            }],
            listeners:  {
                scope: this,
                load: function(store, records, success){
                    if (success) {
                        var pi_model_names = _.map(records, function (rec) { return Ext.util.Format.lowercase(rec.get('TypePath')); });
                        deferred.resolve(pi_model_names);
                    } else {
                        deferred.reject('Error loading portofolio item names.');
                    }
               }
           }
        });
        return deferred.promise;
    }

});