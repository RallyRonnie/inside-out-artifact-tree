/*
 * Most of our trees are generated top-down, which
 * is most performant; however, sometimes we need to
 * point to a set of items in the middle of a tree and
 * (to apply scope or query) and then construct the
 * tree above and below the found items
 * 
 * A good example of this is wanting to see all
 * the PIs that have a story in a particular iteration
 * or in a particular team.  The PIs won't be assigned
 * to an iteration and might not be in the chosen project
 * scope, so first we have to find the iteration-tied stories
 * and then go up and down the tree to make context appear.
 * 
 * 
 */
 
 Ext.define('Rally.technicalservices.InsideOutTree', {
    extend: 'Ext.container.Container',
    alias: 'widget.insideouttree',
    requires: [ 'Rally.technicalservices.Logger', 'Rally.technicalservices.util.TreeBuilding'],
    logger: new Rally.technicalservices.Logger(),
    columns: [],
    /**
     * @cfg {String} targetQuery
     * 
     * WSAPI query to be applied at the target level
     * 
     */
    targetQuery: '(ObjectID > 0)',
    
    initComponent: function() {
        if ( this.columns.length == 0 ) { throw("Missing required setting: columns"); }
        
        this.callParent();
        this.addEvents(
            /**
             * @event aftertree
             * Fires when the tree has been created and placed on the page.
             * @param {Rally.technicalservices.InsideOutTree} this
             * @param {Ext.tree.Panel} tree
             */
            'aftertree',
            /**
             * @event afterloadtargets
             * Fires when data has been collected from the initial target query
             * @param {Rally.technicalservices.InsideOutTree} this
             */
            'afterloadtargets',
            /**
             * @event afterload
             * Fires when data has been collected from the parents and children
             * @param {Rally.technicalservices.InsideOutTree} this
             */
            'afterload'
         );
    },
    initItems: function() {
        this.callParent();
        this._fetchPortfolioNames().then({
            scope: this,
            success: function(pi_model_names){
                this.logger.log("Portfolio Item Names: ",pi_model_names);
                this._gatherData("HierarchicalRequirement").then({
                    scope: this,
                    success:function(all_unordered_items){
                        this.fireEvent('afterload',this);
                        var ordered_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(all_unordered_items);
                        var ordered_items_as_hashes = Rally.technicalservices.util.TreeBuilding.convertModelsToHashes(ordered_items);
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
        this._fetchTargetItems(model_name).then({
            scope: this,
            success:function(target_items){
                var fetched_items_by_oid = {};
                Ext.Array.each(target_items,function(item){
                    fetched_items_by_oid[item.get('ObjectID')] = item;
                });
                this.fireEvent('afterloadtargets',this);
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
    _fetchTargetItems: function(model_name){
        var deferred = Ext.create('Deft.Deferred');

        var query = '( ObjectID > 0 )';
        
        if ( this.targetQuery ){
            query = this.targetQuery;
        }
        
        var filters = Rally.data.wsapi.Filter.fromQueryString(query);
        
        Ext.create('Rally.data.wsapi.Store', {
            autoLoad: true,
            model: model_name,
            fetch: this._getFetchNames(),
            filters:filters,
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
                    var parents = Ext.Array.flatten(results);
                    Ext.Array.each(parents,function(parent){
                        fetched_items[parent.get('ObjectID')] = parent;
                    });
                    this._fetchParentItems(parents,fetched_items,deferred);
                },
                failure: function(error_msg){ deferred.reject(error_msg); }
            });
        } else {
            deferred.resolve(fetched_items);
        }
        return deferred.promise;

    },
    _getParentFrom:function(child){
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
            fetch: this._getFetchNames(),
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
            
        var model_config = {
            extend: 'TSTreeModel',
            fields: this._getFetchNames()
        };
        Ext.define('TSTreeModelWithAdditions', model_config);
        
        var tree_store = Ext.create('Ext.data.TreeStore',{
            model: TSTreeModelWithAdditions,
            root: {
                expanded: false,
                children: ordered_items
            }
        });
        
        var tree = this.add({
            xtype:'treepanel',
            store: tree_store,
            cls: 'rally-grid',
            rootVisible: false,
            enableColumnMove: true,
            sortableColumns: false,
            rowLines: true,
            columns: this.columns
        });

        this.fireEvent('aftertree',this,tree);
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
    },
    _getFetchNames: function() {
        var base_field_names = ['ObjectID','Name','Parent','PortfolioItem','_type'];
        
        Ext.Array.each(this.columns, function(column){
            base_field_names = Ext.Array.merge(base_field_names,[column.dataIndex]);
            if ( column.otherFields ) {
                base_field_names = Ext.Array.merge(base_field_names,column.otherFields);
            }
        });
        
        return base_field_names;
    }
});
