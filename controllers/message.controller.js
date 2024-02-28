const Message = require("../models/message.model");
const Reply = require("../models/reply.model");

// Thread routes

// Get the 10 most recent threads with max 3 replies each
exports.getThreads = async (req, res) => {
  const { board } = req.params;
  await Message.find(
      { board: board },
      { __v: 0, reported: 0, delete_password: 0 }
    )
    .lean()
    .sort({ bumped_on: -1 })
    .limit(10)
    .populate("replies",
      { __v: 0, reported: 0, delete_password: 0 }
    )
    .then((messages) => {
      let result = messages.map((message) => {
        let replies = [];
        if (message.replies.length > 0) {
          replies = message.replies
            .sort((a, b) => a.created_on - b.created_on)
            .slice(0, 3);
        }
        return { ...message, replies: replies, replycount: replies.length }
      });
      res.status(200).send(result);
    });
}

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;
  const newRecord = new Message({
    board: board,
    text: text,
    delete_password: delete_password,
  });
  await newRecord.save().then((data) => {
    let result = {
      _id: data._id,
      text: data.text,
      created_on: data.created_on,
      bumped_on: data.bumped_on,
      replies: [],
    }
    res.status(200).send(result);
  });
}

exports.deleteThread = async (req, res) => {
  const { board } = req.params;
  const { thread_id, delete_password } = req.body;
  await Message.findOne({ _id: thread_id, board:board }).then((message) => {
    const ismatch = message.comparePassword(delete_password);
    if (ismatch) {
      message.replies.map((reply) => {
        Reply.findByIdAndDelete(reply._id);
      });
      Message.findByIdAndDelete(thread_id)
        .then(() => res.status(200).send("success"));
    } else res.status(201).send("incorrect password");
  });
}

exports.reportThread = async (req, res) => {
  const { board } = req.params;
  const { thread_id } = req.body;
  await Message.findOne({ _id: thread_id, board: board }).then((message) => {
    message.reported = true;
    message.save().then(() => res.status(200).send("reported"));
  });
}

// Reply routes
exports.getReplies = async (req, res) => {
  const { board } = req.params;
  const { thread_id } = req.query;
    await Message.findOne(
      { _id: thread_id, board: board },
      { __v: 0, reported: 0, delete_password: 0 }
    )
    .lean()
    .populate("replies",
      { __v: 0, reported: 0, delete_password: 0 }
    )
    .then((message) => {
      let result = { ...message, replycount: message.replies.length }
      res.status(200).send(result);
    });
}

exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, text, delete_password } = req.body;
  await Message.findOne({ _id: thread_id, board: board }).then((message) => {
    const replyDate = new Date();
    const newReply = new Reply({
      text: text,
      delete_password: delete_password,
      created_on: replyDate,
    });
    newReply.save().then((reply) => {
      message.bumped_on = replyDate;
      message.replies.push(reply);
      message.save().then(() => res.status(200).send(newReply));
    });
  });
}

exports.deleteReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, reply_id, delete_password } = req.body;
  await Message.findOne({ _id: thread_id, board: board })
    .populate("replies")
    .then((message) => {
      let reply = {};
      if (message.replies) {
        reply = message.replies.find((rep) => rep._id.toString() === reply_id);
      }
      if (reply) {
        const ismatch = reply.comparePassword(delete_password);
        if (ismatch) {
          message.bumped_on = new Date();
          reply.text = "[deleted]";
          reply.save();
          message.save().then((r) => {
            res.status(200).send("success");
          });
        } else res.status(201).send("incorrect password");
      }
    });
}

exports.reportReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, reply_id } = req.body;
  await Message.findOne({ _id: thread_id, board: board })
    .populate("replies")
    .then((message) => {
      let reply = message.replies.find(
        (rep) => rep._id.toString() === reply_id,
      );
      if (reply) {
        message.bumped_on = new Date();
        reply.reported = true;
        reply.save();
        message.save().then(() => res.status(200).send("reported"));
      } else {
        res.status(201).send("incorrect");
      }
    });
}