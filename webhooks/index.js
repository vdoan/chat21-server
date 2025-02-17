/* 
    ver 0.1.0
    Andrea Sponziello - (c) Tiledesk.com
*/

const amqp = require('amqplib/callback_api');
// const winston = require("../winston");
// const logger = require('../tiledesk-logger').logger;
let logger;
var url = require('url');
const MessageConstants = require("../models/messageConstants");
// const messageConstants = require('../models/messageConstants');

/**
 * This is the class that manages webhooks
 */
class Webhooks {

  /**
   * Constructor for Persistence object
   *
   * @example
   * const { Webhooks } = require('webhooks');
   * const webhooks = new Webhooks({appId: 'mychat'});
   *
   * @param {Object} options JSON configuration.
   * @param {Object} options.appId Mandatory. The appId.
   * @param {Object} options.exchange Mandatory. exchange name.
   * @param {Object} options.RABBITMQ_URI Mandatory. The RabbitMQ connection URI.
   * @param {Object} options.webhook_endpoint Mandatory. This weebhook endpoint.
   * @param {Object} options.queue_name Optional. The queue name. Defaults to 'weebhooks'.
   * @param {Object} options.webhook_events Optional. The active webhook events.
   * @param {Object} options.logger Optional. The logger.
   * 
   */
  constructor(options) {
    if (!options) {
      throw new Error('options can NOT be empty. appId and RABBITMQ_URI are mandatory');
    }
    if (!options.RABBITMQ_URI) {
      throw new Error('RABBITMQ_URI option can NOT be empty.');
    }
    if (!options.exchange) {
      throw new Error('exchange option can NOT be empty.');
    }
    if (!options.appId) {
      throw new Error('appId option can NOT be empty.');
    }
    if (!options.webhook_endpoint) {
      throw new Error('webhook_endpoint option can NOT be empty.');
    }
    if (options.logger) {
      logger = options.logger;
    }
    else {
      logger = require('../tiledesk-logger').logger;
    }
    // throw new Error('webhook_endpoint option can NOT be empty.......');
    this.webhook_endpoint = options.webhook_endpoint;
    this.RABBITMQ_URI = options.RABBITMQ_URI;
    this.appId = options.appId;
    this.topic_webhook_message_deliver = `observer.webhook.apps.${this.appId}.message_deliver`;
    this.topic_webhook_message_update = `observer.webhook.apps.${this.appId}.message_update`;
    // this.topic_webhook_message_received = `observer.webhook.apps.${this.appId}.message_received`;
    // this.topic_webhook_message_saved = `observer.webhook.apps.${this.appId}.message_saved`
    // this.topic_webhook_conversation_saved = `observer.webhook.apps.${this.appId}.conversation_saved`
    this.topic_webhook_conversation_archived = `observer.webhook.apps.${this.appId}.conversation_archived`;
    this.amqpConn = null;
    this.exchange = options.exchange;
    this.channel = null;
    this.pubChannel = null;
    this.offlinePubQueue = [];
    this.enabled = true
    this.queue = options.queue_name || 'webhooks';

    const DEFAULT_WEBHOOK_EVENTS = [
      MessageConstants.WEBHOOK_EVENTS.MESSAGE_SENT,
      MessageConstants.WEBHOOK_EVENTS.MESSAGE_DELIVERED,
      MessageConstants.WEBHOOK_EVENTS.MESSAGE_RECEIVED,
      MessageConstants.WEBHOOK_EVENTS.MESSAGE_RETURN_RECEIPT,
      MessageConstants.WEBHOOK_EVENTS.CONVERSATION_ARCHIVED,
      MessageConstants.WEBHOOK_EVENTS.CONVERSATION_UNARCHIVED,
    ]
    this.webhook_events_array = options.webhook_events || DEFAULT_WEBHOOK_EVENTS;
        

    logger.debug("webhooks inizialized: this.exchange:", this.exchange, "this.offlinePubQueue:", this.offlinePubQueue)
  }


  getWebHookEnabled() {
    return this.webhook_enabled;
  }

  setWebHookEnabled(enabled) {
    this.webhook_enabled = enabled;
  }

  getWebHookEndpoint() {
    return this.webhook_endpoint;
  }
  setWebHookEndpoint(url) {
    this.webhook_endpoint = url;
  }
  
  getWebHookEvents() {
    return this.webhook_events_array;
  }
  setWebHookEvents(events) {
    this.webhook_events_array = events;
  }
  

  // WHnotifyMessageReceived
  // notifyMessageReceived(message) {
  //   logger.debug("NOTIFY MESSAGE:", message)
  //   const notify_topic = `observer.webhook.apps.${app_id}.message_received`
  //   logger.debug("notifying webhook notifyMessageReceived topic:", notify_topic)
  //   const message_payload = JSON.stringify(message)
  //   this.publish(this.exchange, notify_topic, Buffer.from(message_payload), (err) => {
  //     if (err) {
  //       logger.debug("Err", err)
  //     }
  //   })
  // }
  

  // WHprocess_webhook_message_received
  // process_webhook_message_received(topic, message_string, callback) {
  //   logger.debug("process_webhook_message_received.from.incoming:", message_string, "on topic", topic)
  //   var message = JSON.parse(message_string)
  //   logger.debug("timelineOf...:", message.timelineOf)
  //   if (callback) {
  //     callback(true)
  //   }
    
  //   if (this.isMessageOnGroupTimeline(message)) {
  //     logger.debug("Sending this message for group timeline:", message)
  //   }
  //   const message_id = message.message_id;
  //   const recipient_id = message.recipient_id;
  //   const app_id = message.app_id;
    
  //   var json = {
  //     event_type: "new-message",
  //     createdAt: new Date().getTime(),
  //     recipient_id: recipient_id,
  //     app_id: app_id,
  //     message_id: message_id,
  //     data: message
  //   };
  
  //   var q = url.parse(process.env.WEBHOOK_ENDPOINT, true);
  //   logger.debug("ENV WEBHOOK URL PARSED:", q)
  //   var protocol = (q.protocol == "http") ? require('http') : require('https');
  //   let options = {
  //     path:  q.pathname,
  //     host: q.hostname,
  //     port: q.port,
  //     method: 'POST',
  //     headers: {
  //       "Content-Type": "application/json"
  //     }
  //   };

  //   callback = function(response) {
  //     var respdata = ''
  //     response.on('data', function (chunk) {
  //       respdata += chunk;
  //     });
    
  //     response.on('end', function () {
  //       logger.debug("WEBHOOK RESPONSE:", respdata);
  //     });
  //   }
    
  //   var req = protocol.request(options, callback);
  //   req.write(json);
  //   req.end();
    
  // }
  
  
  // WHisMessageOnGroupTimeline
  // isMessageOnGroupTimeline(message) {
  //   if (message && message.timelineOf) {
  //     if (message.timelineOf.toLowerCase().indexOf("group") !== -1) {
  //       return true
  //     }
  //   }
  //   return false
  // }
  

  // ************ WEBHOOKS *********** //

  WHnotifyMessageStatusSentOrDelivered(message_payload, topic, callback) {
    logger.log("WHnotifyMessageStatusSentOrDelivered()", message_payload)
    let message = JSON.parse(message_payload);
    message['temp_field_chat_topic'] = topic;
    if (message.status == MessageConstants.CHAT_MESSAGE_STATUS_CODE.SENT) {
      logger.log("SENT...")
      this.WHnotifyMessageStatusSent(message, (err) => {
        if (callback) {
          callback(err);
        }
        else {
          callback(null);
        }
      })
    }
    else if (message.status == MessageConstants.CHAT_MESSAGE_STATUS_CODE.DELIVERED) {
      logger.log("DELIVERED...")
      this.WHnotifyMessageStatusDelivered(message, (err) => {
        if (callback) {
          callback(err);
        }
        else {
          callback(null);
        }
      })
    }
    else {
      logger.log("FUCK THIS DELIVERED...")
      callback(null);
    }
  }

  WHnotifyMessageStatusSent(message, callback) {
    logger.log("WH Sent method.");
    if (this.webhook_events_array.indexOf(MessageConstants.WEBHOOK_EVENTS.MESSAGE_SENT) == -1) {
      logger.debug("WH MESSAGE_SENT disabled.");
      callback(null);
    } else {
      logger.log("WH MESSAGE_SENT enabled");
      logger.debug("WH MESSAGE_DELIVERED enabled.");
      this.WHnotifyMessageDeliver(message, (err) => {
        callback(err);
      });
    }
  }

  WHnotifyMessageStatusDelivered(message, callback) {
    if (this.webhook_events_array.indexOf(MessageConstants.WEBHOOK_EVENTS.MESSAGE_DELIVERED) == -1) {
      logger.debug("WH MESSAGE_DELIVERED disabled.");
      callback(null);
    } else {
      logger.debug("WH MESSAGE_DELIVERED enabled.");
      this.WHnotifyMessageDeliver(message, (err) => {
        callback(err);
      });
    }
  }

  WHnotifyMessageStatusReturnReceipt(message, callback) {
    if (this.webhook_events_array.indexOf(MessageConstants.WEBHOOK_EVENTS.MESSAGE_RETURN_RECEIPT) == -1) {
      logger.debug("WH MESSAGE_RETURN_RECEIPT disabled.");
      callback(null);
    } else {
      this.WHnotifyMessageUpdate(message, (err) => {
        callback(err);
      });
    }
  }

  WHnotifyMessageDeliver(message, callback) {
    // logger.debug("WH NOTIFY MESSAGE:", message);
    if (this.enabled===false) {
      logger.debug("webhooks disabled");
      callback(null)
      return
    }
    const notify_topic = `observer.webhook.apps.${this.appId}.message_deliver`
    logger.debug("notifying webhook MessageSent topic:" + notify_topic)
    const message_payload = JSON.stringify(message)
    logger.debug("MESSAGE_PAYLOAD: " + message_payload)
    this.publish(this.exchange, notify_topic, Buffer.from(message_payload), (err) => {
      if (err) {
        logger.error("Err", err)
        callback(err)
      }
      else {
        callback(null)
      }
    })
  }

  WHnotifyMessageUpdate(message, callback) {
    logger.debug("NOTIFY MESSAGE UPDATE:", message);
    if (this.enabled===false) {
      logger.debug("webhooks disabled");
      callback(null)
      return
    }
    const notify_topic = `observer.webhook.apps.${this.appId}.message_update`
    logger.debug("notifying webhook message_update topic:" + notify_topic)
    const message_payload = JSON.stringify(message)
    logger.debug("MESSAGE_PAYLOAD: " + message_payload)
    this.publish(this.exchange, notify_topic, Buffer.from(message_payload), (err) => {
      if (err) {
        logger.error("Err", err)
        callback(err)
      }
      else {
        callback(null)
      }
    })
  }

  WHnotifyConversationArchived(conversation, topic, callback) {
    logger.debug("NOTIFY CONVERSATION ARCHIVED:", conversation)

    if (this.enabled===false) {
      logger.debug("WHnotifyConversationArchived Discarding notification. webhook_enabled is false.");
      // callback({err: "WHnotifyConversationArchived Discarding notification. webhook_enabled is false."}); 
      callback(null)
      return
    }

    conversation['temp_field_chat_topic'] = topic;

    const notify_topic = `observer.webhook.apps.${this.appId}.conversation_archived`
    logger.debug("notifying webhook notifyConversationArchived topic: " + notify_topic)
    const payload = JSON.stringify(conversation)
    logger.debug("PAYLOAD:", payload)
    this.publish(this.exchange, notify_topic, Buffer.from(payload), (err) => {
      if (err) {
        logger.error("Err", err)
        callback(err)
      }
      else {
        callback(null)
      }
    })
  }

  WHprocess_webhook_message_deliver(topic, message_string, callback) {
    logger.debug("process WHprocess_webhook_message_deliver: " + message_string + " on topic: " + topic)
    var message = JSON.parse(message_string)
    if (callback) {
      callback(true)
    }
    // if (this.enabled===false) {
    //   logger.debug("WHprocess_webhook_message_deliver Discarding notification. webhook_enabled is false.");
    //   return
    // }

    // if (!this.WHisMessageOnGroupTimeline(message)) {
    //   logger.debug("WHprocess_webhook_message_deliver Discarding notification. Not to group.");
    //   // callback(true);
    //   return
    // }
    if (!this.webhook_endpoint) {
      logger.debug("WHprocess_webhook_message_deliver Discarding notification. webhook_endpoint is undefined.")
      // callback(true);
      return
    }
    // if (this.webhook_methods_array.indexOf("new-message")==-1) {
    //   logger.debug("WHprocess_webhook_message_deliver Discarding notification. new-message not enabled.");
    //   // callback(true); 
    //   return
    // }

    logger.debug("Sending notification to webhook (message_deliver) on webhook_endpoint:" + this.webhook_endpoint);
    const message_id = message.message_id;
    const recipient_id = message.recipient;
    const app_id = message.app_id;
    let event_type;
    if (message.status === MessageConstants.CHAT_MESSAGE_STATUS_CODE.SENT) {
      event_type = MessageConstants.WEBHOOK_EVENTS.MESSAGE_SENT;
    }
    else {
      event_type = MessageConstants.WEBHOOK_EVENTS.MESSAGE_DELIVERED;
    }
    var json = {
      event_type: event_type,
      createdAt: new Date().getTime(),
      recipient_id: recipient_id,
      app_id: app_id, // or this.appId?
      message_id: message_id,
      data: message,
      extras: {topic: message['temp_field_chat_topic']}
    };
    delete message['temp_field_chat_topic'];
    // logger.debug("WHprocess_webhook_message_received Sending JSON webhook:", json)
    this.WHsendData(json, function(err, data) {
      if (err)  {
        logger.error("Err WHsendData callback", err);
      } else {
        logger.debug("WHsendData sendata end with data:" + data);
      }
    })
  }

  WHprocess_webhook_message_update(topic, message_string, callback) {
    logger.debug("process WHprocess_webhook_message_update: " + message_string + " on topic: " + topic)
    var message = JSON.parse(message_string)
    logger.debug("timelineOf:" + message.timelineOf)
    if (callback) {
      callback(true)
    }
    if (!this.webhook_endpoint) {
      logger.debug("WHprocess_webhook_message_update Discarding notification. webhook_endpoint is undefined.")
      return
    }
    logger.debug("Sending notification to webhook (message_deliver) on webhook_endpoint:" + this.webhook_endpoint);
    const message_id = message.message_id;
    const recipient_id = message.recipient;
    const app_id = message.app_id;
    let event_type;
    if (message.status == MessageConstants.CHAT_MESSAGE_STATUS_CODE.RECEIVED) {
      event_type = MessageConstants.WEBHOOK_EVENTS.MESSAGE_RECEIVED;
    }
    else if (message.status == MessageConstants.CHAT_MESSAGE_STATUS_CODE.RETURN_RECEIPT) {
      event_type = MessageConstants.WEBHOOK_EVENTS.MESSAGE_RETURN_RECEIPT;
    }
    var json = {
      event_type: event_type,
      createdAt: new Date().getTime(),
      recipient_id: recipient_id,
      app_id: app_id, // or this.appId?
      message_id: message_id,
      data: message,
      extras: {topic: topic}
    };
    // logger.debug("WHprocess_webhook_message_received Sending JSON webhook:", json)
    this.WHsendData(json, function(err, data) {
      if (err)  {
        logger.error("Err WHsendData callback", err);
      } else {
        logger.debug("WHsendData sendata end with data:" + data);
      }
    })
  }

  WHprocess_webhook_conversation_archived(topic, payload, callback) {
    logger.debug("process webhook_conversation_archived on topic" + topic)
    logger.debug("process webhook_conversation_archived on payload" + payload)
    
    var conversation = JSON.parse(payload)
    logger.debug("conversation['temp_field_chat_topic']", conversation['temp_field_chat_topic']);
    if (callback) {
      callback(true)
    }

    if (this.enabled===false) {
      logger.debug("Discarding notification. webhook_enabled is false.");
      // callback(true);
      return
    }

    if (!this.webhook_endpoint) {
      logger.debug("WHprocess_webhook_conversation_archived: Discarding notification. webhook_endpoint is undefined.")
      return
    }

    logger.debug("Sending notification to webhook (webhook_conversation_archived):", this.webhook_endpoint)
    if (!conversation['temp_field_chat_topic']) {
      logger.debug("WHprocess_webhook_conversation_archived NO 'temp_field_chat_topic' error.")
    }
    var topic_parts = conversation['temp_field_chat_topic'].split(".")
    logger.debug("ARCHIVE. TOPIC PARTS:", topic_parts)
    if (topic_parts.length < 7) {
      logger.debug("process_archive topic error. topic_parts.length < 7:" + topic)
      return
    }
    const app_id = topic_parts[1];
    const user_id = topic_parts[3];
    const convers_with = topic_parts[5];

    // chatdb.getConversation(timelineOf, conversWith, function(err, conversation) {
    var json = {
      event_type: MessageConstants.WEBHOOK_EVENTS.CONVERSATION_ARCHIVED,
      createdAt: new Date().getTime(),
      app_id: app_id,
      user_id: user_id, // temporary patch for Tiledesk
      recipient_id: convers_with,
      convers_with: convers_with,
      data: conversation,
      extras: {topic: conversation['temp_field_chat_topic']}
    };
    delete conversation['temp_field_chat_topic'];
    logger.debug("Sending JSON webhook:", json)
    this.WHsendData(json, function(err, data) {
      if (err)  {
        logger.error("Err WHsendData callback", err);
      } else {
        logger.debug("WHsendData sendata end with data:" + data);
      }
    })
  }

  WHisMessageOnGroupTimeline(message) {
    if (message && message.timelineOf) {
      if (message.timelineOf.toLowerCase().indexOf("group") !== -1) {
        return true
      }
    }
    return false
  }

  WHsendData(json, callback) {
    var q = url.parse(this.webhook_endpoint, true);
    var protocol = (q.protocol == "http:") ? require('http') : require('https');
    let options = {
      path:  q.pathname,
      host: q.hostname,
      port: q.port,
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      }
    };
    try {
      const req = protocol.request(options, (response) => {
        logger.debug("statusCode: "+  response.statusCode + " for webhook_endpoint: " + this.webhook_endpoint);
        if (response.statusCode < 200 || response.statusCode > 299) { // (I don"t know if the 3xx responses come here, if so you"ll want to handle them appropriately
          logger.debug("http statusCode error "+  response.statusCode + " for webhook_endpoint: " + this.webhook_endpoint);
          return callback({statusCode:response.statusCode}, null)
        }
        var respdata = ''
        response.on('data', (chunk) => {
          // logger.debug("chunk"+chunk)
          respdata += chunk;
        });
        response.on('end', () => {
          logger.debug("WEBHOOK RESPONSE: "+ respdata + " for webhook_endpoint: " + this.webhook_endpoint);
          return callback(null, respdata) //TODO SE IL WEBHOOK NN RITORNA SEMBRA CHE SI BLOCCI
        });
      });
      req.on('error', (err) => {
        logger.error("WEBHOOK RESPONSE Error: ", err);
        return callback(err, null)
      });
      req.write(JSON.stringify(json));
      req.end();
      // logger.debug("end")
    }
    catch(err) {
      logger.error("an error occurred while posting this json " + JSON.stringify(json), err)
      return callback(err, null)
    }
  }

  async whenConnected() {
    const resolve = await this.startPublisher();
    logger.info("webhook publisher started.");
    this.startWorker();
    logger.info("webhook worker started.");
    return resolve;
  }

  startPublisher() {
    const that = this;
    return new Promise(function (resolve, reject) {
        that.amqpConn.createConfirmChannel( (err, ch) => {
            if (that.closeOnErr(err)) return;
            ch.on("error", function (err) {
                logger.error("[Webooks.AMQP] channel error", err);
            });
            ch.on("close", function () {
                logger.debug("[Webooks.AMQP] channel closed");
            });
            that.pubChannel = ch;
            // if (that.offlinePubQueue.length > 0) {
                // while (true) {
                //     var m = this.offlinePubQueue.shift();
                //     if (!m) break;
                //     this.publish(m[0], m[1], m[2]);
                //   }

                // while (true) {
                //     var [exchange, routingKey, content] = offlinePubQueue.shift();
                //     that.publish(exchange, routingKey, content);
                // }
            // }
            return resolve(ch)
        });
    });
  }

  closeOnErr(err) {
    if (!err) return false;
    logger.error("[Webooks.AMQP] error", err);
    this.amqpConn.close();
    return true;
  }

  startWorker() {
    logger.debug("starting webhook worker.");
    this.amqpConn.createChannel((err, ch) => {
      this.channel = ch;
      if (this.closeOnErr(err)) return;
      ch.on("error", function (err) {
        logger.error("[Webooks.AMQP] channel error", err);
      });
      ch.on("close", function () {
        logger.debug("[Webooks.AMQP] channel closed");
      });
      ch.prefetch(10);
      ch.assertExchange(this.exchange, 'topic', {
        durable: true
      });
      ch.assertQueue(this.queue, { durable: true }, (err, _ok) => {
        if (this.closeOnErr(err)) return;
        logger.debug("subscribed to _ok.queue: " + _ok.queue);
        this.subscribeTo(this.topic_webhook_message_deliver, ch, _ok.queue)
        this.subscribeTo(this.topic_webhook_message_update, ch, _ok.queue)
        this.subscribeTo(this.topic_webhook_conversation_archived, ch, _ok.queue)
        ch.consume(this.queue, this.processMsg.bind(this), { noAck: false });
      });
    });
  }

  subscribeTo(topic, channel, queue) {
    channel.bindQueue(queue, this.exchange, topic, {}, function (err, oka) {
      if (err) {
        logger.error("Webooks.Error:", err, " binding on queue:", queue, "topic:", topic)
      }
      else {
        logger.info("Webooks.bind: '" + queue + "' on topic: " + topic);
      }
    });
  }

  processMsg(msg) {
    logger.debug("Webhooks.subscribeTo:" + this);
    this.work(msg, (ok) => {
      logger.debug("Webhooks.worked.");
      try {
        if (ok)
          this.channel.ack(msg);
        else
          this.channel.reject(msg, true);
      } catch (e) {
        logger.debug("gin2:", e)
        this.closeOnErr(e);
      }
    });
  }

  work(msg, callback) {
    logger.debug("Webhooks.NEW TOPIC..." + msg.fields.routingKey) //, " message:", msg.content.toString());
    const topic = msg.fields.routingKey //.replace(/[.]/g, '/');
    const message_string = msg.content.toString();
    if (topic.startsWith('observer.webhook.') && topic.endsWith('.message_deliver')) {
      // if (this.enabled === false) {
      //    logger.debug("work observer.webhook....message_received notification. webhook_enabled is false.");
      //    callback(true);
      // } else {
        this.WHprocess_webhook_message_deliver(topic, message_string, callback);
      // }
    }
    else if (topic.startsWith('observer.webhook.') && topic.endsWith('.message_update')) {
      // if (this.enabled === false) {
      //    logger.debug("work observer.webhook....message_update notification. webhook_enabled is false.");
      //    callback(true);
      // } else {
        this.WHprocess_webhook_message_update(topic, message_string, callback);
      // }
    }
    // else if (topic.startsWith('observer.webhook.') && topic.endsWith('.message_received')) {
    //   if (this.enabled === false) {
    //      logger.debug("work observer.webhook....message_received notification. webhook_enabled is false.");
    //      callback(true);
    //   } else {
    //     this.WHprocess_webhook_message_received(topic, message_string, callback);
    //   }
    // }
    else if (topic.startsWith('observer.webhook.') && topic.endsWith('.conversation_archived')) {
    //   if (this.enabled === false) {
    //     logger.debug("work observer.webhook....conversation_archived notification. webhook_enabled is false.");
    //     callback(true);
    //  } else {
      this.WHprocess_webhook_conversation_archived(topic, message_string, callback);
    //  }
    }
    else {
      logger.error("Webooks.unhandled topic:", topic)
      callback(true)
    }
  }

  start() {
    const that = this;
    logger.info("Webhook config: ", this);
    return new Promise(function (resolve, reject) {
      return that.startMQ(resolve, reject);
    });
  }

  startMQ(resolve, reject) {
    const that = this;
    
    logger.debug("Webooks. Connecting to RabbitMQ...")
    amqp.connect(that.RABBITMQ_URI, (err, conn) => {
        if (err) {
            logger.error("[Webooks.AMQP]", err);                    
            return setTimeout(() => { that.startMQ(resolve, reject) }, 1000);
        }
        conn.on("error", (err) => {
            if (err.message !== "Connection closing") {
              logger.error("[Webooks.AMQP] conn error", err);
                return reject(err);
            }
        });
        conn.on("close", () => {
            logger.error("[Webooks.AMQP] reconnecting");
            return setTimeout(() => { that.startMQ(resolve, reject) }, 1000);
        });
        logger.info("Webooks. AMQP connected.")
        that.amqpConn = conn;
        that.whenConnected().then(function(ch) {
          logger.debug("Webooks. whenConnected() returned")
          resolve({conn: conn, ch: ch});
        });
    });
    
  }

  publish(exchange, routingKey, content, callback) {
    try {
      logger.debug("Webooks.TRYING TO PUB...")
      this.pubChannel.publish(exchange, routingKey, content, { persistent: true }, (err, ok) => {
          if (err) {
            logger.error("[Webooks.AMQP] publish ERROR:", err);
            this.offlinePubQueue.push([exchange, routingKey, content]);
            this.pubChannel.connection.close();
            callback(err)
          }
          else {
            callback(null)
          }
        });
    } catch (e) {
      logger.error("[Webooks.AMQP] publish CATCHED ERROR:", e);
      this.offlinePubQueue.push([exchange, routingKey, content]);
      callback(e)
    }
  }

  
}

module.exports = { Webhooks };