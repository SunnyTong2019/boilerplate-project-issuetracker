/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  MongoClient.connect(CONNECTION_STRING, function(err, db) {
  
  if(err) console.log('Database error: ' + err);

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      
      var objForQuery = {};
      
      if (req.query._id) objForQuery._id = new ObjectId(req.query._id);
      if (req.query.issue_title) objForQuery.issue_title = req.query.issue_title;
      if (req.query.issue_text) objForQuery.issue_text = req.query.issue_text;
      if (req.query.assigned_to) objForQuery.assigned_to = req.query.assigned_to;
      if (req.query.created_by) objForQuery.created_by = req.query.created_by;
      if (req.query.status_text) objForQuery.status_text = req.query.status_text;
      if (req.query.open=='true') objForQuery.open = true;
      if (req.query.open=='false') objForQuery.open = false;
    
      if (req.query.created_on) // if created_on has value provided
      {
        var time=new Date(req.query.created_on);
      
        if (time.getHours()==0 && time.getMinutes()==0 && time.getSeconds()==0 && time.getMilliseconds()==0)
        // if the value provided only has date, no time, ex. /api/issues/apitest?created_on=2019-06-22
        {
          var timeHi=new Date(req.query.created_on);
          timeHi.setHours(23);
          timeHi.setMinutes(59);
          timeHi.setSeconds(59);
          timeHi.setMilliseconds(999);
          
          // then search records on that day with time from 00:00:00.000 to 23:59:59.999
          objForQuery.created_on={
            $gte: time,
            $lt:  timeHi
          };
         }
         else // if the value provided has date and time, ex. /api/issues/apitest?created_on=2019-06-22T19:13:48.558
         { objForQuery.created_on=time; } // then search records on that exact date and time
      }
    
      if (req.query.updated_on)
      {
        var time=new Date(req.query.updated_on);
      
        if (time.getHours()==0 && time.getMinutes()==0 && time.getSeconds()==0 && time.getMilliseconds()==0)
        {
          var timeHi=new Date(req.query.updated_on);
          timeHi.setHours(23);
          timeHi.setMinutes(59);
          timeHi.setSeconds(59);
          timeHi.setMilliseconds(999);
          
          objForQuery.updated_on={
            $gte: time,
            $lt:  timeHi
          };
         }
         else
         { objForQuery.updated_on=time; } 
      }
    
      db.collection(project).find(objForQuery).toArray(function(err, result) {
        if (err) console.log(err);
        res.json(result);
      });

    })
    
    .post(function (req, res){
      var project = req.params.project;
      
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by)
      { res.json('Missing required fields'); }
      else
      {
      db.collection(project).insertOne(
        {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to,
          status_text: req.body.status_text,
          open: true,
          created_on: new Date(),
          updated_on: new Date()
        },
        (err, doc) => { 
         if (err) console.log(err);
         res.json(doc.ops);
        }
       );
      }
    })
    
    .put(function (req, res){
      var project = req.params.project;
      
      db.collection(project).findOne({_id: new ObjectId(req.body._id)}, function(err, result) {
          if (err) console.log(err);

          if (result)
            {
              if (!req.body.issue_title && !req.body.issue_text && !req.body.created_by && !req.body.assigned_to && !req.body.status_text && !req.body.open)
              { res.json("no updated field sent"); }
              else
              { 
                var objForUpdate = {};

                if (req.body.issue_title) objForUpdate.issue_title = req.body.issue_title;
                if (req.body.issue_text) objForUpdate.issue_text = req.body.issue_text;
                if (req.body.assigned_to) objForUpdate.assigned_to = req.body.assigned_to;
                if (req.body.created_by) objForUpdate.created_by = req.body.created_by;
                if (req.body.status_text) objForUpdate.status_text = req.body.status_text;
                if (req.body.open) objForUpdate.open = false; 
                // above set objForUpdate.open =false, not =req.body.open, because req.body.open="false" which is a string, not boolean.
                objForUpdate.updated_on = new Date();

                objForUpdate = { $set: objForUpdate }
                
                db.collection(project).updateOne({_id: new ObjectId(req.body._id)},
                    objForUpdate,
                    (err, doc) => { 
                    if (err) console.log(err);
                    res.json('successfully updated');
                    }
                  );
              }
            }
          else
            { res.json("could not update "+req.body._id); }
     });
 
    })

    
    .delete(function (req, res){
      var project = req.params.project;
      
      if (req.body._id)
      {
        db.collection(project).findOne({_id: new ObjectId(req.body._id)}, function(err, result) {
          if (err) console.log(err);
          if (result)
            {
                db.collection(project).deleteOne({_id: new ObjectId(req.body._id)},
                    (err, doc) => { 
                    if (err) console.log(err);
                    res.json('deleted '+req.body._id);
                    }
                  );
            }
          else
            { res.json("could not delete "+req.body._id); }
         });
      }
      else { res.json('_id error'); }
    
    });
    
  });
};
