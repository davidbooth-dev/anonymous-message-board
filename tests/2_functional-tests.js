const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

let id = '';
let reply_id = '';

chai.use(chaiHttp);

suite('Functional Tests', function() {
    suite("Send requests to /api/threads/:board", () => {        
        test("Create a new thread", (done) => {
            chai
                .request(server)
                .post("/api/threads/general")
                .send({ text: 'Create new thread', delete_password: 'deleteme' })
                .end((req, res) => {
                    id = res.body._id;
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, "Response should be an object");
                    assert.property(res.body, "_id", "There should be a _id property");
                    assert.property(res.body, "text", "There should be a text property");
                    assert.property(res.body, "replies", "There should be a replies property");
                    assert.isArray(res.body.replies, 'Expects replies to be an array');
                    assert.property(res.body, "created_on", "There should be a created_on key");     
                    assert.property(res.body, "bumped_on", "There should be a bumped_on key");
                    assert.isUndefined(res.body.delete_password, "There should be no delete_password key");
                    assert.isUndefined(res.body.reported, "There should be no reported key");

                    done();
                });
        });
        test("Get the 10 most recent threads with 3 replies each", (done) => {
            chai
                .request(server)
                .get("/api/threads/general")
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isArray(res.body, "response should be an array");
                    assert.isAtLeast(res.body.length, 0, "response should have at least 0 threads");
                    assert.isAtMost(res.body.length, 10, "response should have at most 10 threads");
                    assert.property(res.body[0], "text", "thread should have a text property");
                    assert.property(res.body[0], "created_on", "thread should have a created_on property");
                    assert.property(res.body[0], "bumped_on", "thread should have a bumped");
                    assert.property(res.body[0], "replies", "thread should have a replies property");
                    assert.property(res.body[0], "replycount", "thread should have a replycount property");
                    
                    done();
                });
        });
        
        test("Report a thread", (done) => {
            chai
                .request(server)
                .put("/api/threads/general")
                .send({ thread_id: id })
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isString(res.text, "response should be a string");
                    assert.equal(res.text, 'reported');
                    
                    done();
                });
        });
       test("Delete a thread with the incorrect password", (done) => {
            chai
                .request(server)
                .delete("/api/threads/general")
                .send({ thread_id: id, delete_password: 'letmein' })
                .end((req, res) => {
                    assert.equal(res.status, 201);
                    assert.isString(res.text, "response should be a string");
                    assert.equal(res.text, 'incorrect password');
                    
                    done();
                });
        });
        test("Delete a thread with the correct password", (done) => {
            chai
                .request(server)
                .delete("/api/threads/general")
                .send({ thread_id: id, delete_password: 'deleteme'})
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isString(res.text, "response should be a string");
                    assert.equal(res.text, 'success');
                    
                    done();
                });
        });
    });
    suite("Send requests to /api/replies/:board", () => {
        test("Get a single thread with all replies", (done) => {
            id= '65df0dcfe119280542fa46dd'
            chai
                .request(server)
                .get("/api/replies/general")
                .query({ thread_id: id })
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, "response should be an object");
                    assert.property(res.body, "text", "There should be a text property");
                    assert.property(res.body, "replies", "There should be a replies property");
                    assert.isArray(res.body.replies, 'Expected replies to be an array');
                    assert.property(res.body, "created_on", "There should be a created_on property");
                    assert.property(res.body, "bumped_on", "There should be a bumped_on property");
                    
                   done();
                });
        });
        test("Create a new reply", (done) => {
            chai
                .request(server)
                .post("/api/replies/general")
                .send({ thread_id: id, text: 'new reply created', delete_password: 'deletereply' })
                .end((req, res) => {
                    reply_id = res.body._id
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, "Response should be an object");
                    assert.property(res.body, "reported", "There should be a reported property")
                    assert.property(res.body, "text", "There should be a text property");
                    assert.property(res.body, "created_on", "There should be a created_on property");
                    assert.property(res.body, "delete_password", "There should be a delete_password property");

                    done();
                });
        });
        test("Report a reply", (done) => {
            chai
                .request(server)
                .put("/api/replies/general")
                .send({ thread_id: id, reply_id: reply_id })
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isString(res.text, "response should be a string");
                    assert.equal(res.text, "reported");

                    done();
                });
        });
        test("Delete a reply with the incorrect password", (done) => {
            chai
                .request(server)
                .delete("/api/replies/general")
                .send({ thread_id: id, reply_id: reply_id, delete_password: 'deletereplynot' })
                .end((req, res) => {
                    assert.equal(res.status, 201);
                    assert.isString(res.text, "response should be a string");                    
                    assert.equal(res.text, 'incorrect password');

                    done();
                });
        });
        test("Delete a reply with the correct password", (done) => {
            chai
                .request(server)
                .delete("/api/replies/general")
                .send({ thread_id: id, reply_id: reply_id, delete_password: 'deletereply' })
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isString(res.text, "response should be a string");                    
                    assert.equal(res.text, 'success')

                    done();
                });
        });
    });
});
