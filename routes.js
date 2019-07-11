const conn = require('./salesforce/connection.js');
const nforce = require('nforce');

module.exports = function (app) {
  app.get("/", (req, res) => res.sendFile("./build/es6-unbundled/index.html"));

  app.get('/api/tasks', function (req, res) {
    const query = "SELECT Id, AssignedName__c, Title__c, TaskDescription__c, Status__c, DueDate__c, Color__c FROM Kanban__c";

    conn.query({ query }, (err, data) => {

      if (!err && data.records) {
        res.json(data.records);
      } else {
        res.json(err);
      }
    });
  });

  app.post('/api/tasks', function(req, res) {
    const record = nforce.createSObject('Kanban__c');
    record.set('AssignedName__c', req.body.assignedname__c);
    record.set('Title__c', req.body.title__c);
    record.set('TaskDescription__c', req.body.taskdescription__c);
    record.set('Status__c', req.body.status__c);
    record.set('DueDate__c', req.body.duedate__c);
    record.set('Color__c', req.body.color__c);
  
    conn.insert({ sobject: record }, (err, resp) => {
      if(!err) {
        res.json({ success: true });
      } else {
        res.json(err);
      }
    });
  });

  app.put('/api/tasks/:id', function(req, res) {
    const record = nforce.createSObject('Kanban__c');
    record.set('Id', req.params.id);
    record.set('Status__c', req.body.status__c);
  
    conn.update({ sobject: record }, (err, data) => {
      if (!err) {
        res.json({ success: true });
      } else {
        res.json(err);
      }
    });
  });
};
