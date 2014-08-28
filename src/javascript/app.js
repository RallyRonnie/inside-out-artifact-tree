Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    launch: function() {
        
        var m_name = 'Defect',
        m_fields = ['Name','State'];
        
        this._fetchPortfolioNames().then({
            scope: this,
            success: function(){
                console.log(this.sModelNames)
            },
            failure: function(error_msg){
                alert(error_msg);
                this.logger.log(error_msg);
            }
        });
        
    }, 
    _fetchPortfolioNames: function(){
        var deferred = Ext.create('Deft.Deferred');
        
        var typeStore = Ext.create('Rally.data.wsapi.Store', {
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
                        var sModelNames = _.map(records, function (rec) { return rec.get('TypePath'); });
                        deferred.resolve(sModelNames);
                    } else {
                        deferred.reject('Error loading portofolio item names.');
                    }
               }
           }
        });
        return deferred.promise;
    }

});