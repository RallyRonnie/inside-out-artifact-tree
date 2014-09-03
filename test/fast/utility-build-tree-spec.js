describe("When using the tree utilities with a hash of found items", function() {
    it("should return an array of root-level models when a parent and a child are provided",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        child_story.set('parent',parent_story);
        
        var hash = {
            1: parent_story,
            2: child_story
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(hash);
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('Name')).toEqual('test parent');
        expect(root_items[0].get('children').length).toEqual(1);
    });
    
    it("should return an array of root-level models when parent is provided as data not a model",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent for not a model'
        });
        
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        child_story.set('parent',parent_story.getData());
        
        var hash = {
            1: parent_story,
            2: child_story
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(hash);

        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('Name')).toEqual('test parent for not a model');
        expect(root_items[0].get('children').length).toEqual(1);
    });
    
    it("should return an array of root-level hashes when data provided as hashes",function(){
        var parent_story = {
            ObjectID: 1,
            Name: 'test parent for not a model'
        };
        
        
        var child_story = {
            ObjectID: 2,
            Name: 'test child',
            parent: parent_story
        };
        
        var hash = {
            1: parent_story,
            2: child_story
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItemsFromHashes(hash);

        expect(root_items.length).toEqual(1);
        expect(root_items[0].Name).toEqual('test parent for not a model');
        expect(root_items[0].children.length).toEqual(1);
    });
    
    it("should return an array of models when neither has a parent",function(){
        var one_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test 1'
        });
        
        
        var two_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test 2'
        });
        
        var hash = {
            1: one_story,
            2: two_story
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(hash);

        expect(root_items.length).toEqual(2);
        expect(root_items[0].get('Name')).toEqual('test 1');
        expect(root_items[0].get('children').length).toEqual(0);
    });
    
    it("should return an array of models when item has a parent not in the hash",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        child_story.set('parent',parent_story);

        var hash = {
            2: child_story
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(hash);
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('Name')).toEqual('test child');
        expect(root_items[0].get('children').length).toEqual(0);
    });
    
    it("should return an array of models for a 3-deep tree",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        child_story.set('parent',parent_story);

        var grand_child_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test grandchild'
        });
        grand_child_story.set('parent',child_story);
        
        var hash = {
            3: grand_child_story,
            2: child_story,
            1: parent_story
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(hash);

        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('Name')).toEqual('test parent');
        expect(root_items[0].get('children').length).toEqual(1);
        expect(root_items[0].get('children')[0].get('children').length).toEqual(1);        
        expect(root_items[0].get('children')[0].get('Name')).toEqual('test child');
    });
    
    it("should return an array of models for a complicated tree",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        child_story.set('parent',parent_story);

        var grand_child_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test grandchild'
        });
        grand_child_story.set('parent',child_story);
        
        var parent_story2 = Ext.create('mockStory',{
            ObjectID: 4,
            Name: 'test parent2'
        });
        
        var child_story2 = Ext.create('mockStory', {
            ObjectID: 5,
            Name: 'test child2'
        });
        child_story2.set('parent',parent_story2);

        var grand_child_story2 = Ext.create('mockStory', {
            ObjectID: 6,
            Name: 'test grandchild2'
        });
        grand_child_story2.set('parent',child_story2);        
        var grand_child_story2a = Ext.create('mockStory', {
            ObjectID: 7,
            Name: 'test grandchild2a'
        });
        grand_child_story2a.set('parent',child_story2);
        
        var hash = {
            3: grand_child_story,
            2: child_story,
            1: parent_story,
            4: parent_story2,
            5: child_story2,
            6: grand_child_story2,
            7: grand_child_story2a
        }
        
        var root_items = Rally.technicalservices.util.TreeBuilding.constructRootItems(hash);

        expect(root_items.length).toEqual(2);
        expect(root_items[0].get('Name')).toEqual('test parent');
        expect(root_items[0].get('children').length).toEqual(1);
        expect(root_items[0].get('children')[0].get('children').length).toEqual(1);        
        expect(root_items[0].get('children')[0].get('Name')).toEqual('test child');
    });
});
