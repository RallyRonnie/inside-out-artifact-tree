describe("When using the tree roll up calculate utilities with a root array", function() {
    it("should roll up calculated value from child to parent",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child',
            PlanEstimate: 5
        });
        child_story.set('parent',parent_story);
        parent_story.set('children',[child_story]);
        
        var root_items = [parent_story];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__value',
            calculator: function(item){ 
                var orig_value = item.get('PlanEstimate') || 0;
                return orig_value * 3;
            }
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__value')).toEqual(15);
    });
    
    it("should roll up calculated value from child to parent and combine with parent value",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent',
            PlanEstimate: 5
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child',
            PlanEstimate: 5
        });
        child_story.set('parent',parent_story);
        parent_story.set('children',[child_story]);
        
        var root_items = [parent_story];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__value',
            calculator: function(item){ 
                var orig_value = item.get('PlanEstimate') || 0;
                return orig_value * 3;
            }
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__value')).toEqual(30);
    });

    it("should roll up calculated value from child to parent and not combine with parent value",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent',
            PlanEstimate: 5
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child',
            PlanEstimate: 5
        });
        child_story.set('parent',parent_story);
        parent_story.set('children',[child_story]);
        
        var root_items = [parent_story];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__value',
            leaves_only: true,
            calculator: function(item){ 
                var orig_value = item.get('PlanEstimate') || 0;
                return orig_value * 3;
            }
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__value')).toEqual(15);
    });

});
