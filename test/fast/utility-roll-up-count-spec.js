describe("When using the tree roll up count utilities with a root array", function() {
    it("should roll up count from child to parent",function(){
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
            field_name: '__result',
            calculator: 'count'
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(2);
    });
    
    it("should roll up count from children to parent",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story1 = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1',
            PlanEstimate: 3
        });

        var child_story2 = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test child 2',
            PlanEstimate: 4
        });
        
        var child_story3 = Ext.create('mockStory', {
            ObjectID: 4,
            Name: 'test child 3',
            PlanEstimate: 5
        });
        parent_story.set('children',[child_story1,child_story2,child_story3]);
        
        var root_items = [parent_story];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count'
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(4);
    });
    
    it("should roll up count from multiple levels of children to parent",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1'
        });

        var grandchild_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test child 2'
        });
        
        var great_grandchild_story = Ext.create('mockStory', {
            ObjectID: 4,
            Name: 'test child 3',
            PlanEstimate: 5
        });
        grandchild_story.set('children',[great_grandchild_story]);
        child_story.set('children',[grandchild_story]);
        parent_story.set('children',[child_story]);
        
        var root_items = [parent_story];
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count'
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(4);
    });
    
    it("should roll up count from multiple levels of children to parent when including midlevels",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent',
            PlanEstimate: 5
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1',
            PlanEstimate: 5
        });

        var grandchild_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test child 2',
            PlanEstimate: 5
        });
        
        var great_grandchild_story = Ext.create('mockStory', {
            ObjectID: 4,
            Name: 'test child 3',
            PlanEstimate: 5
        });
        grandchild_story.set('children',[great_grandchild_story]);
        child_story.set('children',[grandchild_story]);
        parent_story.set('children',[child_story]);
        
        var root_items = [parent_story];
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count',
            leaves_only: false
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(4);
    });
    
    it("should roll up value from multiple levels of children to parent when ignoring midlevels",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent',
            PlanEstimate: 1
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1',
            PlanEstimate: 3
        });

        var grandchild_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test child 2',
            PlanEstimate: 5
        });
        
        var great_grandchild_story = Ext.create('mockStory', {
            ObjectID: 4,
            Name: 'test child 3',
            PlanEstimate: 10
        });
        grandchild_story.set('children',[great_grandchild_story]);
        child_story.set('children',[grandchild_story]);
        parent_story.set('children',[child_story]);
        
        var root_items = [parent_story];
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count',
            leaves_only: true
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(1);
    });
    
    it("should roll up count from multiple levels of asymmetric children to parent when ignoring midlevels",function(){
        var parent_story = Ext.create('mockStory',{
            ObjectID: 1,
            Name: 'test parent',
            PlanEstimate: 1
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1',
            PlanEstimate: 3
        });
        
        // include this one
        var leaf_child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1',
            PlanEstimate: 25
        });

        var grandchild_story = Ext.create('mockStory', {
            ObjectID: 3,
            Name: 'test child 2',
            PlanEstimate: 5
        });
        
        // include this one
        var leaf_grandchild_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child 1',
            PlanEstimate: 8
        });
        
        // include this one
        var great_grandchild_story = Ext.create('mockStory', {
            ObjectID: 4,
            Name: 'test child 3',
            PlanEstimate: 10
        });
        grandchild_story.set('children',[great_grandchild_story]);
        child_story.set('children',[leaf_grandchild_story,grandchild_story]);
        parent_story.set('children',[child_story,leaf_child_story]);
        
        var root_items = [parent_story];
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count',
            leaves_only: true
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(3);
    });
    
    it("should roll up count from child to parent when different types",function(){
        var parent_pi = Ext.create('mockPI',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child',
            PlanEstimate: 5
        });
        parent_pi.set('children',[child_story]);
        
        var root_items = [parent_pi];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count'
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(2);
    });
    
    it("should roll up leaf-only count from child to parent when different types",function(){
        var parent_pi = Ext.create('mockPI',{
            ObjectID: 1,
            Name: 'test parent'
        });
        
        var child_story = Ext.create('mockStory', {
            ObjectID: 2,
            Name: 'test child',
            PlanEstimate: 5
        });
        parent_pi.set('children',[child_story]);
        
        var root_items = [parent_pi];
        
        var root_items = Rally.technicalservices.util.TreeBuilding.rollup({
            root_items: root_items,
            field_name: '__result',
            calculator: 'count',
            leaves_only: true
        });
        expect(root_items.length).toEqual(1);
        expect(root_items[0].get('__result')).toEqual(1);
    });
    
});
