const Message = require("../models/message.model");
const Reply = require("../models/reply.model");

// Thread routes

// Get the 10 most recent threads with max 3 replies each
exports.getThreads = async (req, res) => {
  const { board } = req.params;
  await Message.find(
    { board: board },
    //{ __v: 0, reported: 0, delete_password: 0 },
  )
    //.lean()
    .sort({ bumped_on: 1 })
    .limit(10)
    .populate("replies", 
              //{ reported: 0, delete_password: 0 }
             )
    .then((messages) => {
      let result = messages.map((message) => {
        let replies = [];
        if (message.replies.length > 0) {
          replies = message.replies
            .sort((a, b) => a.created_on - b.created_on)
            .slice(0, 3)
            .map((reply) => {
              return {
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on,
              };
            });
        }
        //return {...message, replycount: replies.length, replies: replies }
        return {
          _id: message._id,
          text: message.text,
          created_on: message.created_on,
          bumped_on: message.bumped_on,
          replies: replies,
          replycount: message.replies.length || 0,
        };
      });
      res.status(200).send(result);
    });
};

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
    };
    res.status(200).send(result);
  });
};

exports.deleteThread = async (req, res) => {
  //const { board } = req.params;
  const { thread_id, delete_password } = req.body;
  await Message.findById(thread_id).then((message) => {
    const ismatch = message.comparePassword(delete_password);
    if (ismatch) {
      message.replies.map((reply) => {
        Reply.findByIdAndDelete(reply._id);
      });
      Message.findByIdAndDelete(thread_id)
        .then((d) => {
          res.status(200).send("success");
        })
        .catch((err) => console.log(err));
    } else res.status(201).send("incorrect password");
  });
};

exports.reportThread = async (req, res) => {
  const { board } = req.params;
  const { thread_id } = req.body;
  await Message.findOne({ _id: thread_id, board: board }).then((message) => {
    message.reported = true;
    message.save().then(() => res.status(200).send("reported"));
  });
};
//{ __v: 0, reported: 0, delete_password: 0 }
// Reply routes
exports.getReplies = async (req, res) => {
  const { board } = req.params;
  const { thread_id } = req.query;
  console.log(thread_id, board)
  await Message.findOne({ _id: thread_id, board: board })
    .populate("replies")
    .then((message) => {
      let replies = [];
      if (message.replies) {
        replies = message.replies.map((reply) => {
          return {
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on,
          };
        });
      }
      let result = {
        _id: message._id,
        text: message.text,
        replies: replies,
        created_on: message.created_on,
        bumped_on: message.bumped_on,
        replycount: message.replies.length || 0,
      };

      res.status(200).send(result);
    });
};

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
};

exports.deleteReply = async (req, res) => {
  //const { board } = req.params;
  const { thread_id, reply_id, delete_password } = req.body;
  //console.log(req.body, req.params, req.query);
  await Message.findOne({ _id: thread_id })
    .populate("replies")
    .then((message) => {
      let reply = {};
      // message.replies.map((r) => console.log(r._id));
      if (message.replies) {
        reply = message.replies.find((rep) => rep._id.toString() === reply_id);
      }
      //console.log("deleteReply", reply);
      if (reply) {
        const ismatch = reply.comparePassword(delete_password);
        if (ismatch) {
          message.bumped_on = new Date();
          reply.text = "[deleted]";
          reply.save();
          message.save().then((r) => {
            //console.log(r.replies)
            res.status(200).send("success");
          });
        } else res.status(201).send("incorrect password");
      }
      //else res.status(201).send("incorrect password");
    })
    .catch((err) => console.log(err)); //res.status(201).send("incorrect password"));
};

exports.reportReply = async (req, res) => {
  //const { board } = req.params;
  const { thread_id, reply_id } = req.body;
  await Message.findOne({ _id: thread_id })
    .populate("replies")
    .then((message) => {
      let reply = message.replies.find(
        (rep) => rep._id.toString() === reply_id,
      );
      //console.log("reportReply", reply);
      if (reply) {
        message.bumped_on = new Date();
        reply.reported = true;
        reply.save();

        message.save().then(() => res.status(200).send("reported"));
      } else {
        res.status(201).send("incorrect");
      }
    })
    .catch((err) => console.log(err)); //res.status(201).send("incorrect"));
};
