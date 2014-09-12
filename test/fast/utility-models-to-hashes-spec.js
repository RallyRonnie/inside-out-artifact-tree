describe("When using the tree utilities with an array of models", function() {
    it("should return an array of hashes when given models",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        
        var model_array = [parent_story,child_story];
        
        var hash_array = Rally.technicalservices.util.TreeBuilding.convertModelsToHashes(model_array);
        expect(hash_array.length).toEqual(2);
        expect(hash_array[0].Name).toEqual('test parent');
    });
    
    it("should return an array of hashes when given hashes",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        
        var model_array = [parent_story.getData(),child_story.getData()];
        
        var hash_array = Rally.technicalservices.util.TreeBuilding.convertModelsToHashes(model_array);
        expect(hash_array.length).toEqual(2);
        expect(hash_array[0].Name).toEqual('test parent');
    });
    
    it("should return an array of hashes when given nested models",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        child_story.set('parent',parent_story);
        parent_story.set('children',[child_story]);
        
        var model_array = [parent_story,child_story];
        
        var hash_array = Rally.technicalservices.util.TreeBuilding.convertModelsToHashes(model_array);
        expect(hash_array.length).toEqual(2);
        expect(hash_array[0].Name).toEqual('test parent');
        expect(hash_array[0].children.length).toEqual(1);
        expect(hash_array[0].children[0].Name).toEqual('test child');
        expect(hash_array[0].leaf).toEqual(false);
        expect(hash_array[0].expanded).toEqual(false);
        
        expect(hash_array[1].Name).toEqual('test child');
        expect(hash_array[1].parent.Name).toEqual('test parent');
        expect(hash_array[1].leaf).toEqual(true);
        expect(hash_array[1].expanded).toEqual(false);
        
    });
    
    it("should return an array of hashes when given models that had a new field set",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child'
        });
        
        child_story.set('FRED',7);
        parent_story.set('FRED',8);
        
        var model_array = [parent_story,child_story];
        
        var hash_array = Rally.technicalservices.util.TreeBuilding.convertModelsToHashes(model_array);
        expect(hash_array.length).toEqual(2);
        expect(hash_array[0].Name).toEqual('test parent');
        expect(hash_array[0].FRED).toEqual(8);
    });
    
});