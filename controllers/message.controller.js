
const Message = require('../models/message.model');
const Reply = require('../models/reply.model');

//const date = require('../scripts/date');

// Thread routes

// Get the 10 most recent threads with max 3 replies each
exports.getThreads = async(req, res) => {
    const { board } = req.params;
    await Message.find({ board: board })
        .sort('-bumped_on')
        .limit(10)
        .populate('replies')
        .then(messages => {
            let arr = messages.filter(m => {
                if(m.replies.length > 0){
                    let rs = m.replies.filter(r => {
                        if(r.text!=='[deleted]') return r
                    });
                    m.replies = rs.sort((a, b) => b.created_on - a.created_on).slice(0, 3);
    
                    return rs;
                }
                return []
            })

            let result = arr.map(ele => {
                let count = ele.replies ? ele.replies.length : 0;
                return {...ele._doc, replycount: count} 
            });
           
            res.status(200).send(result);
        })
        .catch((err) => {
            console.log(err)
            res.status(201).send('failure')
        });
}

exports.createThread = async(req, res) => {
    const { board } = req.params;
    const { text, delete_password } = req.body;
    const now = new Date();
    const newRecord = new Message({ 
        board: board, 
        text: text,
        delete_password: delete_password,
        created_on: now,
        bumped_on: now  
    });
    
    await newRecord.save()
        .then(data => {
            let t = Object.assign({}, data._doc)
            t.thread_id = data._id
            res.status(200).send(t)
        })
        .catch((err) => {
            console.log(err)
            res.status(201).send('failure')
        });
}

exports.deleteThread = async(req, res) => {
    const { board } = req.params;
    const { thread_id, delete_password } = req.body;
    await Message.findById(thread_id)
        .then(message => {
            if(message && message.board === board){
                const ismatch = message.comparePassword(delete_password);
                if(ismatch){ 
                    Message.findByIdAndDelete({ _id: thread_id })
                        .then(d => res.status(200).send('success'))
                        .catch(err => console.log(err));                        
                    }
                    else res.status(201).send('incorrect password');
                }
                else res.status(201).send('Thread not found');
        })
        .catch(() => res.status(201).send('failure'));
}

exports.reportThread = async(req, res) => {
    const { board } = req.params;
    const { report_id } = req.body;
    await Message.findOne({ _id: report_id, board: board})
        .then(message => {
            message.reported = true;
            message.save().then(() => res.status(200).send('reported'));
        })
        .catch(() => res.status(201).send('failure'));
}

// Reply routes
exports.getReplies = async(req, res) => {
    const { board } = req.params;
    const { thread_id } = req.query;
    await Message.findOne({ _id: thread_id, board: board })
        .populate('replies')
        .then(message => {
            if(message.replies.length > 0){
                let rs = message.replies.filter(r => {
                    if(r.text!=='[deleted]') return r
                });
                message.replies = rs.sort((a, b) => b.created_on - a.created_on).slice(0, 3);
            }

            res.status(200).send(message)
        })
        .catch(() => res.status(201).send('failure'));
}

exports.createReply = async(req, res) => {
    const { board } = req.params;
    const { thread_id, text, delete_password } = req.body;
    await Message.findOne({ _id: thread_id, board: board })
        .then(message => {
            const newReply = new Reply({ text: text, delete_password: delete_password });
            newReply.save().then(reply => {
                message.bumped_on = new Date();
                message.replies.push(reply);
                message.save().then(() => res.status(200).json(newReply));
            });
        })
        .catch(() => res.status(201).send('failure'));
}

exports.deleteReply = async(req, res) => {
    const { board } = req.params;
    const { thread_id, reply_id, delete_password } = req.body;
    await Message.findOne({ _id: thread_id, board: board })
        .populate('replies')
        .then(message => {
            let reply = message.replies.find(rep => rep._id.toString() === reply_id)
            if(reply){
                const ismatch = reply.comparePassword(delete_password);
                if(ismatch){                
                    reply.text = '[deleted]';
                    reply.save().then(() => res.status(200).send('success'));
                }
                else res.status(201).send('incorrect password');
            }
        })
        .catch(() => res.status(201).send('failure'));
}

exports.reportReply = async(req, res) => {
    const { board } = req.params;
    const { thread_id, reply_id } = req.body;
    await Message.findOne({ _id: thread_id, board: board })
        .populate('replies')
        .then(message => {
            let reply = message.replies.find(rep => rep._id.toString() === reply_id)
            if(reply){
                reply.reported = true;
                reply.save().then(() => res.status(200).send('reported'))
            }
        })
        .catch(() => res.status(201).send('failure'));
}