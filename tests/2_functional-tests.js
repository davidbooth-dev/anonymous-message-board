const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    suite("Send requests to /api/threads/:board", () => {
        let id = '65d9cb2e387a1bc46c98d341';
        test("Get the 10 most recent threads with 3 replies each", (done) => {
            chai
                .request(server)
                .get("/api/threads/general")
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isArray(res.body, "response should be an array");

                    done();
                });
        });
        test("Create a new thread", (done) => {
            chai
                .request(server)
                .post("/api/threads/general")
                .send({ text: 'Create new thread', delete_password: 'deleteme' })
                .end((req, res) => {
                    id = res.body._id;
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, "Response should be an object");
                    assert.property(res.body, "thread_id", "There should be a thread_id property");
                    assert.property(res.body, "text", "There should be a text property");
                    assert.property(res.body, "replies", "There should be a replies property");
                    assert.isArray(res.body.replies, 'Expected replies to be an array');
                    assert.property(res.body, "created_on", "There should be a created_on property");                    
                    assert.property(res.body, "bumped_on", "There should be a bumped_on property");

                    done();
                });
        });
        test("Report a thread", (done) => {
            chai
                .request(server)
                .put("/api/threads/general")
                .send({ report_id: id })
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
        let id = '65d9cb2e387a1bc46c98d341';
        let reply_id = '';
        test("Get a single thread with all replies", (done) => {
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

                    done();
                });
        });
        test("Create a new reply", (done) => {
            chai
                .request(server)
                .post("/api/replies/general")
                .send({ thread_id: id, text: 'new reply created', delete_password: 'deletereply' })
                .end((req, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body, "Response should be an object");
                    assert.property(res.body, "reported", "There should be a reported property")
                    assert.property(res.body, "text", "There should be a text property");
                    assert.property(res.body, "created_on", "There should be a created_on property");
                    assert.property(res.body, "delete_password", "There should be a delete_password property");

                    reply_id = res.body._id;

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
