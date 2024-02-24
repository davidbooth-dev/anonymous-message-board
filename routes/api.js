'use strict';

const { 
    createThread, 
    deleteThread, 
    getThreads, 
    reportThread,
    createReply, 
    deleteReply, 
    getReplies, 
    reportReply
} = require('../controllers/message.controller');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(getThreads)
    .post(createThread)
    .delete(deleteThread)
    .put(reportThread);
    
  app.route('/api/replies/:board')
    .get(getReplies)
    .post(createReply)
    .delete(deleteReply)
    .put(reportReply);
};
