Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    autoScroll: false,
    items: [
        {xtype:'container',itemId:'selector_box', layout: {type:'hbox'},  margin: 5, height: 50},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink', height: 10, informationHtml:'The target level is the record type to which the project scoping<br/>and release or iteration will be applied'}
    ],
    field_names: ['ObjectID','FormattedID','Name','Parent','PortfolioItem'],

    launch: function() {
        this._fetchModels().then({
            scope: this,
            success:function(models){
                this.models = models;
                this._addSelectors(this.down('#selector_box'));
                // this._addTree();
            },
            failure: function(error_msg){
                alert(error_msg);
                this.setLoading(false);
            }
        });

    },
    _getAvailableTreeHeight: function() {
        var body_height = this.getHeight() || Ext.getBody().getHeight();
        this.logger.log("Body height: ", body_height);
        var available_height = body_height - 100;
        this.logger.log("Returning height: ", available_height);
        return available_height;
    },
    _addTree: function() {
        var container = this.down('#display_box');
        container.removeAll();
        
        if ( !this.target_query || this.target_query.toString() == "(Iteration = null)" || this.target_query.toString() == "(Release = null)" ) {
            this.logger.log(" Waiting for timebox to be selected" );
            this.setLoading(false);
        } else {
            this.logger.log(" Using filter/query: ", this.target_query.toString() );
            
            container.add({
                xtype:'insideouttree',
                cls: 'rally-grid',
                columns: this._getColumns(),
                targetType: this.target_type || "UserStory",
                targetQuery: this.target_query,
                height: this._getAvailableTreeHeight(),
                maxHeight: this._getAvailableTreeHeight(),
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
        }
    },
    _addSelectors: function(container){
        var model_names = Ext.Object.getKeys(this.models);
        var me = this;
        /**
         * So, the 'change' event when you try to use type-ahead in the
         * field picker and we don't want that to redraw the tree.  But
         * we want the 'change' event because it is fired when we try to
         * remember fields that were selected in the past and we definitely 
         * want that value.
         */
        this.react_to_change = true;
        var field_picker = container.add({
            xtype:'rallyfieldpicker',
            autoExpand:true,
            margin: 10,
            alwaysExpanded: false,
            fieldLabel: 'Show Fields:',
            labelWidth: 75,
            modelTypes:model_names,
            useColumnHeaderLabels: true,
            stateful: true,
            stateId: 'rally.techservices.fields',
            stateEvents:['blur','selectionchange'],
            getState: function() {
                var value_array = [];
                Ext.Array.each(this.getValue(), function(value){
                    value_array.push(value.get('name'));
                });
                
                return this.addPropertyToState({},'value',value_array);
            },
            listeners: {
                scope: this,
                blur: function(picker){
                    this.logger.log("BLUR fields", picker.isExpanded);
                    var additional_columns = picker.getValue() || [];
                    this.logger.log("Changing picker from ", this.additional_columns, " to ", additional_columns);
                    if ( this._fieldArraysAreDifferent(this.additional_columns,additional_columns) ) {
                        this.additional_columns = additional_columns;
                        picker.collapse();
                        this._addTree();
                    }
                },
                change: function(picker) {
                    this.logger.log('CHANGE fields');
                    this.additional_columns = picker.getValue() || [];
                    picker.collapse();
                    if ( this.additional_columns.length > 0 && this.react_to_change ) {
                        this.react_to_change = false;
                        this._addTree();
                    }
                },
                selectionchange: function() {
                    this.logger.log('SELECTION CHANGE fields');
                },
                datachanged: function() {
                    this.logger.log('DATA CHANGED fields');
                }
            }
        });
        field_picker.on('expand',function(picker){picker.collapse();},this,{single:true});
        
        var filters = Ext.create('Rally.data.wsapi.Filter',{
            property:'ElementName',
            value:'HierarchicalRequirement'
        });
        
        filters = filters.or(Ext.create('Rally.data.wsapi.Filter',{
            property:'Ordinal',
            value: 0
        }));
        container.add({
            xtype:'rallycombobox',
            displayField: 'DisplayName',
            margin: 10,
            autoExpand: true,
            storeConfig: {
                autoLoad: true,
                model:'TypeDefinition',
                filters: filters
            },
            fieldLabel: 'Target Level:',
            labelWidth: 75,
            valueField:'TypePath',
            stateful: true,
            stateId: 'rally.techservices.target.type.path',
            stateEvents:['select','change'],
            listeners: {
                scope: this,
                change: function(cb,new_value){
                    this.logger.log("type change ", cb.getRecord().get('TypePath'));
                    if ( this.target_type !== cb.getRecord().get('TypePath')) {
                        this.target_type = cb.getRecord().get('TypePath');
                        if ( container.down('#timebox') ) {
                            container.down('#timebox').destroy();
                        }
                        if ( this.target_type == 'HierarchicalRequirement' ) {
                            this._addIterationBox(container);
                        } else {
                            this._addReleaseBox(container);
                        }
                    }
                }
            
            }
        });
        
    },
    _addIterationBox: function(container) {

        var today = Rally.util.DateTime.toIsoString(new Date());
        
        var store = Ext.create('Rally.data.custom.Store',{
            data: [
                { _refObjectName: 'Current', _ref: 'Current', query: '( ( Iteration.StartDate <= ' + today + ') AND ( Iteration.EndDate >= ' + today + ') )'},
                { _refObjectName: 'Unscheduled', _ref: 'Unscheduled', query: '( Iteration = "" )'}
            ]
        });
        container.add({
            xtype:'rallycombobox',
            itemId:'timebox',
            fieldLabel:'Iteration:',
            labelWidth: 55,
            store: store,
            width: 250,
            margin: 10,
            allowBlank: false,
            stateful: false,
            stateId:'rally.techservices.target.current_not',
            stateEvents:['change'],
            listeners:{
                scope: this,
                change: function(iteration_box){
                    console.log(iteration_box.getValue(), iteration_box.getRecord().get('query'));
                    var new_query = iteration_box.getRecord().get('query');
                    if ( this.target_query != new_query ) {
                        this.target_query = new_query;
                        this._addTree();
                    }
                }
            }
        });
//        container.add({
//            xtype:'rallyiterationcombobox',
//            itemId:'timebox',
//            fieldLabel:'Iteration:',
//            labelWidth: 55,
//            width: 250,
//            margin: 10,
//            allowBlank: false,
//            stateful: false,
//            stateId:'rally.techservices.target.iteration',
//            stateEvents:['change'],
//            listeners:{
//                scope: this,
//                change: function(iteration_box){
//                    if ( this.target_query != iteration_box.getQueryFromSelected() ) {
//                        this.target_query = iteration_box.getQueryFromSelected();
//                        this._addTree();
//                    }
//                }
//            }
//        });
    },
    _addReleaseBox: function(container) {
        container.add({
            xtype:'rallyreleasecombobox',
            itemId:'timebox',
            fieldLabel:'Release:',
            labelWidth: 55,
            width: 250,
            margin: 10,
            allowBlank: false,
            stateful: false,
            stateId:'rally.techservices.target.release',
            stateEvents:['change'],
            listeners:{
                scope: this,
                change: function(release_box){
                    if ( this.target_query != release_box.getQueryFromSelected() ) {
                        this.target_query = release_box.getQueryFromSelected();
                        this._addTree();
                    }
                }
            }
        });
    },
    _addQueryBox: function(container){
        var query_box = container.add({
            xtype:'rallytextfield',
            fieldLabel: 'Target Query:',
            labelWidth: 85,
            margin: 10,
            width: 400,
            stateful: true,
            stateId: 'rally.techservices.target.query',
            stateEvents:['blur'],
            listeners: {
                scope: this,
                blur: function(textbox){
                    console.log('blur');
                    if ( this.target_query != textbox.getValue() ) {
                        this.target_query = textbox.getValue();
                        this._addTree();
                    }
                },
                staterestore: function(textbox,state){
                    console.log('query restore');
                    if ( this.target_query != state.value ) {
                        this.target_query = state.value;
                        this._addTree();
                    };
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
                width: 400,
                menuDisabled: true,
                otherFields: ['FormattedID','ObjectID']
            },
            {
                text:'Project',
                dataIndex:'Project',
                menuDisabled: true,
                renderer:function(value,meta_data,record){
                    return me._magicRenderer({name:'Project'},value,meta_data,record) || "";
                }
            },
            {
                text:'Release',
                dataIndex:'Release',
                menuDisabled: true,
                renderer:function(value,meta_data,record){
                    return me._magicRenderer({name:'Release'},value,meta_data,record) || "";
                }
            },
            {
                text:'Iteration',
                dataIndex:'Iteration',
                menuDisabled: true,
                renderer:function(value,meta_data,record){
                    return me._magicRenderer({name:'Iteration'},value,meta_data,record) || "";
                }
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
        var field_name = field.name || field.get('name');
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
                var model_names = Ext.Array.merge(['defect','hierarchicalrequirement','task'],pi_names);
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
    },
    _fieldArraysAreDifferent:function(fields_1,fields_2) {
        var changed = false;
        Ext.Array.each(fields_1, function(field_1){
            var in_fields_2 = false;
            Ext.Array.each(fields_2,function(field_2){
                if ( field_2.get('name') == field_1.get('name') ) {
                    in_fields_2 = true;
                }
            });
            if ( ! in_fields_2 ) { changed=true; }
        });
        
        Ext.Array.each(fields_2, function(field_2){
            var in_fields_1 = false;
            Ext.Array.each(fields_1,function(field_1){
                if ( field_1.get('name') == field_2.get('name')) {
                    in_fields_1 = true;
                }
            });
            if ( ! in_fields_1 ) { changed=true; }
        });
        
        return changed;
    }

});