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
        this.down('#display_box').add({
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
    _getColumns: function() {
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
                width: 200,
                otherFields: ['FormattedID','ObjectID']
            },
            {
                text:'Size',
                dataIndex:'PlanEstimate'
            }
        ];
        return columns;
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

});