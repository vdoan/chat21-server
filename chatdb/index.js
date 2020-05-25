/* 
    ver 0.1
    Andrea Sponziello - (c) Tiledesk.com
*/

var Message = require("../models/message");

/**
 * This is the class that manages DB persistence
 */
class ChatDB {

  /**
   * Constructor for Persistence object
   *
   * @example
   * const { ChatDB } = require('chatdb');
   * const chatdb = new ChatDB({database: db});
   *
   */
  constructor(options) {
    if (!options.database) {
      throw new Error('mongodb option can NOT be empty.');
    }
    this.db = options.database
    this.messages_collection = 'messages'
    this.groups_collection = 'groups'
    this.conversations_collection = 'conversations'
    this.db.collection(this.messages_collection).createIndex(
      { 'timelineOf':1, 'message_id': 1 }
    );
    this.db.collection(this.conversations_collection).createIndex(
      { 'timelineOf':1, 'conversWith': 1 }
    );
  }

  saveOrUpdateMessage(message, callback) {
    console.log("saving message...", message)
    this.db.collection(this.messages_collection).updateOne({timelineOf: message.timelineOf, message_id: message.message_id}, { $set: message }, { upsert: true }, function(err, doc) {
      console.log("error...", err)
      if (err) {
        if (callback) {
          callback(err, null)
        }
      }
      else {
        if (callback) {
          callback(null, doc)
        }
      }
    });
  }

  // saveMessage(message, callback) {
  //   console.log("saving message...", message)
  //   this.db.collection(this.messages_collection).insertOne(message, function(err, doc) {
  //     if (err) {
  //       if (callback) {
  //         callback(err, null)
  //       }
  //     }
  //     else {
  //       if (callback) {
  //         callback(null, doc)
  //       }
  //     }
  //   });
  // }

  saveOrUpdateConversation(conversation, callback) {
    console.log("saving conversation...", conversation)
    this.db.collection(this.conversations_collection).updateOne({timelineOf: conversation.timelineOf, conversWith: conversation.conversWith}, { $set: conversation}, { upsert: true }, function(err, doc) {
      if (callback) {
        callback(err, null)
      }
      else {
        if (callback) {
          callback(null, doc)
        }
      }
    });
  }

  saveOrUpdateGroup(group, callback) {
    console.log("saving group...", group)
    this.db.collection(this.groups_collection).updateOne( { uid: group.uid }, { $set: group }, { upsert: true }, function(err, doc) {
      if (callback) {
        callback(err, null)
      }
      else {
        if (callback) {
          callback(null, doc)
        }
      }
    });
  }

  getGroup(group_id, callback) {
    this.db.collection(this.groups_collection).findOne( { uid: group_id }, function(err, doc) {
      if (err) {
        if (callback) {
          callback(err, null)
        }
      }
      else {
        if (callback) {
          callback(null, doc)
        }
      }
    });
  }

  // updateMessage(message_fields, callback) {
  //   console.log("saving message...", message)
  //   this.db.collection(this.messages_collection).updateOne({message_id: message.message_id},
  //     {$set: message_fields}, function(err, doc) {
  //     if (err) {
  //       console.log(err);
  //       if (callback) {
  //         callback(err, null)
  //       }
  //     }
  //     console.log("updated message", doc);
  //     if (callback) {
  //       callback(null, doc)
  //     }
  //   });
  // }
  

}

module.exports = { ChatDB };