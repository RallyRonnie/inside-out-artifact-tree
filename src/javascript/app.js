Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    field_names: ['ObjectID','FormattedID','Name','Parent','PortfolioItem'],

    launch: function() {
        this._fetchPortfolioNames().then({
            scope: this,
            success: function(pi_model_names){
                this.logger.log(pi_model_names);
                this._gatherData("HierarchicalRequirement").then({
                    scope: this,
                    success:function(all_unordered_items){
                        var ordered_items = Rally.ts.util.TreeBuilding.constructRootItems(all_unordered_items);
                        this.logger.log("Ordered items", ordered_items);
                        var ordered_items_as_hashes = Rally.ts.util.TreeBuilding.convertModelsToHashes(ordered_items);
                        this._makeStoreAndShowGrid(ordered_items_as_hashes);
                    },
                    failure:function(error_msg){ alert(error_msg); }
                });
            },
            failure: function(error_msg){
                alert(error_msg);
            }
        });
        
    },
    _gatherData:function(model_name){
        var deferred = Ext.create('Deft.Deferred');
        this._fetchTargetItems(model_name,this.field_names).then({
            scope: this,
            success:function(target_items){
                this.logger.log(target_items);

                var fetched_items_by_oid = {};
                Ext.Array.each(target_items,function(item){
                    fetched_items_by_oid[item.get('ObjectID')] = item;
                });
                
                this._fetchParentItems(target_items,fetched_items_by_oid).then({
                    scope: this,
                    success: function(all_unordered_items){
                        deferred.resolve(all_unordered_items);
                    },
                    failure: function(error_msg) { deferred.reject(error_msg); }
                });
            },
            failure:function(error_msg){ deferred.reject(error_msg); }
        });
        return deferred;
    },
    // The target items are items at the starting level -- query and scope applies
    _fetchTargetItems: function(model_name,field_names){
        var deferred = Ext.create('Deft.Deferred');

        Ext.create('Rally.data.wsapi.Store', {
            autoLoad: true,
            model: model_name,
            fetch: field_names,
            listeners:  {
                scope: this,
                load: function(store, records, success){
                    if (success) {
                        deferred.resolve(records);
                    } else {
                        deferred.reject('Error loading ' + model_name + ' items');
                    }
               }
           }
        });
        return deferred.promise;
    },
    _fetchParentItems: function(child_items,fetched_items, deferred){
        if ( !deferred ) {
            deferred = Ext.create('Deft.Deferred');
        }
        this.logger.log('fetched_items:',fetched_items);
        var fetched_oids = Ext.Object.getKeys(fetched_items);
        
        var parents_by_type = {};
        
        Ext.Array.each(child_items,function(child){
            var parent = this._getParentFrom(child);
            if ( parent ) {
                console.log(parent);
                var parent_type = parent._type;
                var parent_oid = parent.ObjectID;
                if ( !parents_by_type[parent_type] ) { parents_by_type[parent_type] = []; }
                // don't look for parents more than once
                if ( !Ext.Array.contains(parents_by_type[parent_type], parent_oid) ){
                    if ( !Ext.Array.contains(fetched_oids, parent_oid) ) {
                        parents_by_type[parent_type].push(parent_oid);
                    }
                }
            }
        },this);
        
        var promises = [];
        Ext.Object.each(parents_by_type,function(type,oids){
            if (oids.length > 0 ) {
                promises.push(this._fetchItemsByOIDArray(type,oids));
            }
        },this);
        
        if (promises.length > 0) {
            Deft.Promise.all(promises).then({
                scope: this,
                success: function(results) {
                    this.logger.log("Found ", results);
                    var parents = Ext.Array.flatten(results);
                    Ext.Array.each(parents,function(parent){
                        fetched_items[parent.get('ObjectID')] = parent;
                    });
                    this._fetchParentItems(parents,fetched_items,deferred);
                },
                failure: function(error_msg){ deferred.reject(error_msg); }
            });
        } else {
            this.logger.log("DONE:",fetched_items);
            deferred.resolve(fetched_items);
        }
        return deferred.promise;

    },
    _getParentFrom:function(child){
        this.logger.log(child.get('_type'));
        var type = child.get('_type');
        if ( type == "hierarchicalrequirement" ) {
            var parent = child.get('Parent') || child.get('PortfolioItem');
            child.set('parent',parent);
            return parent;
        }
        
        if ( /portfolio/.test(type) ) {
            var parent = child.get("Parent");
            child.set('parent', parent);
            return parent;
        }
        return null;
    },
    _fetchItemsByOIDArray:function(model_name,oids){
        var deferred = Ext.create('Deft.Deferred');
        var filters = Ext.create('Rally.data.wsapi.Filter',{property:'ObjectID',value:oids[0]});
        
        for ( var i=1;i<oids.length;i++ ) {
            filters = filters.or(Ext.create('Rally.data.wsapi.Filter',{
                property:'ObjectID',
                value:oids[i]
            }));
        }
        
        Ext.create('Rally.data.wsapi.Store', {
            autoLoad: true,
            model: model_name,
            fetch: this.field_names,
            filters: filters,
            context: {
                project: null
            },
            listeners:  {
                scope: this,
                load: function(store, records, success){
                    if (success) {
                        deferred.resolve(records);
                    } else {
                        deferred.reject('Error loading ' + model_name + ' items');
                    }
               }
           }
        });
        return deferred.promise;
    },
    _makeStoreAndShowGrid: function(ordered_items){
        this.logger.log('_makeStoreAndShowGrid',ordered_items);
        var tree_store = Ext.create('Ext.data.TreeStore',{
            model: TSTreeModel,
            root: {
                expanded: false,
                children: ordered_items
            }
        });
        
        this.logger.log("store",tree_store);
        
        var columns = this._getColumns();
        
        this.logger.log('columns',columns);
        
        this.down('#display_box').add({
            xtype:'treepanel',
            store: tree_store,
            cls: 'rally-grid',
            rootVisible: false,
            enableColumnMove: true,
            rowLines: true,
            viewConfig : {
                stripeRows : true
            },
            columns: columns
        });
    },
    _nameRenderer: function(value,meta_data,record) {
        this.logger.log("_nameRenderer",value);
        var display_value = record.get('Name');
        if ( record.get('FormattedID') ) {
            var link_text = record.get('FormattedID') + ": " + value;
            var url = Rally.nav.Manager.getDetailUrl( record );
            display_value = "<a target='_blank' href='" + url + "'>" + link_text + "</a>";
        }
        return display_value;
    },
    _getColumns: function() {
        this.logger.log("_getColumns");
        var me = this;
        var name_renderer = function(value,meta_data,record) {
            return me._nameRenderer(value,meta_data,record);
        };
        
        var columns = [
            {
                xtype: 'treecolumn',
                text: 'Item',
                dataIndex: 'Name',
                itemId: 'tree_column',
                renderer: name_renderer,
                width: 200
            }
        ];
        return columns;
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
                        var pi_model_names = _.map(records, function (rec) { return rec.get('TypePath'); });
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