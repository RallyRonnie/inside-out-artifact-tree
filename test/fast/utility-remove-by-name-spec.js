describe("When using the tree pruning by name with a root array", function() {
    it("should remove branches of tree if node matches name",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child',
            PlanEstimate: 5
        });
        
        var child_story2 = Ext.create('mockStory', {
            ObjectID: 5,
            Name: 'kid',
            PlanEstimate: 5
        });
        
        var grandchild_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test grandchild',
            PlanEstimate: 5
        });
        grandchild_story.set('parent',child_story);
        child_story.set('children',[grandchild_story]);
        child_story.set('parent',parent_story);
        parent_story.set('children',[child_story,child_story2]);
        
        var root_items = [parent_story];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.pruneByFieldValue(root_items, 'Name', 'child');
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('children').length).toEqual(1);
    });
    it("should remove deeper branches of tree if node matches name",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child1 = Ext.create('mockStory', { ObjectID: 2, Name: 'test child'});
        var child2 = Ext.create('mockStory', { ObjectID: 12, Name: 'test child2'});
        
        var grandchild1 = Ext.create('mockStory', { ObjectID: 3, Name: 'remove me'});
        var grandchild2 = Ext.create('mockStory',{ objectID: 5, Name: 'grandkid'});
        var grandchild3 = Ext.create('mockStory',{ objectID: 6, Name: 'grandkid'});
        
        var greatgrandchild = Ext.create('mockStory', { ObjectID: 7, Name: 'ggc'});
        
        greatgrandchild.set('parent', grandchild1);
        
        grandchild1.set('children',greatgrandchild);
        
        grandchild1.set('parent',child1);
        grandchild2.set('parent',child1);
        grandchild3.set('parent',child1);
        
        child1.set('children',[grandchild1,grandchild2,grandchild3]);
        child1.set('parent',parent_story);
        child2.set('parent',parent_story);
        
        parent_story.set('children',[child1,child2]);
        
        var root_items = [parent_story];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.pruneByFieldValue(root_items, 'Name', 'remove');
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('children').length).toEqual(2);
        expect(root_items[0].get('children')[0].get('children').length).toEqual(2);
    });
});
