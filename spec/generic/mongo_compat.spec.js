if (typeof(window) === 'undefined') {
  var loki = require('../../src/lokijs.js');
}

describe('mongo_compat', function () {
  var db, users;

  beforeEach(function () {
    db = new loki('test.db');
    users = db.addCollection('users');
  });

  it('insertOne should insert a document', function () {
    var result = users.insertOne({ name: 'odin', age: 50 });
    expect(result).toBeDefined();
    expect(result.name).toBe('odin');
    expect(users.count()).toBe(1);
  });

  it('insertMany should insert multiple documents', function () {
    var result = users.insertMany([
      { name: 'thor', age: 35 },
      { name: 'loki', age: 30 }
    ]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(users.count()).toBe(2);
  });

  it('updateOne should update a single document using $set', function () {
    users.insert({ name: 'thor', age: 35, weapon: 'hammer' });
    users.insert({ name: 'loki', age: 30, weapon: 'magic' });

    var result = users.updateOne({ name: 'thor' }, { $set: { weapon: 'mjolnir' } });
    
    var thor = users.findOne({ name: 'thor' });
    expect(thor.weapon).toBe('mjolnir');
    
    var loki = users.findOne({ name: 'loki' });
    expect(loki.weapon).toBe('magic');
  });

  it('updateOne should update a single document using $inc', function () {
    users.insert({ name: 'thor', age: 35 });

    users.updateOne({ name: 'thor' }, { $inc: { age: 1 } });
    
    var thor = users.findOne({ name: 'thor' });
    expect(thor.age).toBe(36);
  });

  it('updateMany should update multiple documents', function () {
    users.insert({ name: 'thor', type: 'god', power: 100 });
    users.insert({ name: 'loki', type: 'god', power: 90 });
    users.insert({ name: 'hulk', type: 'hero', power: 80 });

    users.updateMany({ type: 'god' }, { $inc: { power: 10 } });

    var thor = users.findOne({ name: 'thor' });
    expect(thor.power).toBe(110);

    var loki = users.findOne({ name: 'loki' });
    expect(loki.power).toBe(100);

    var hulk = users.findOne({ name: 'hulk' });
    expect(hulk.power).toBe(80);
  });

  it('deleteOne should delete a single document', function () {
    users.insert({ name: 'thor', type: 'god' });
    users.insert({ name: 'loki', type: 'god' });

    var result = users.deleteOne({ type: 'god' });
    expect(result.deletedCount).toBe(1);
    expect(users.count()).toBe(1);
  });

  it('deleteMany should delete multiple documents', function () {
    users.insert({ name: 'thor', type: 'god' });
    users.insert({ name: 'loki', type: 'god' });
    users.insert({ name: 'hulk', type: 'hero' });

    var result = users.deleteMany({ type: 'god' });
    expect(result.deletedCount).toBe(2);
    expect(users.count()).toBe(1);
    expect(users.findOne({ name: 'hulk' })).toBeDefined();
  });

  it('countDocuments should return the correct count', function () {
    users.insert({ name: 'thor', type: 'god' });
    users.insert({ name: 'loki', type: 'god' });
    users.insert({ name: 'hulk', type: 'hero' });

    expect(users.countDocuments({ type: 'god' })).toBe(2);
    expect(users.countDocuments()).toBe(3);
  });
});
