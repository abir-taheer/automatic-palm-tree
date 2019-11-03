const childProcess = require("child_process");
const bodyParser = require("body-parser");

const express = require("express");
const app = express();
const path = require("path");
const http = require('http').createServer(app);
const fileTools = require("./fileTools");

const app_port = process.env.PORT || 3448;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'client/build')));

app.route("/pull").post((req, res) => {
    childProcess.execSync("git config credential.helper store");
    let dirs = fileTools.gitFindRecursive("./../../");
    fileTools.storeCredentials(req.body["github-username"], req.body["github-password"], "github.com");
    fileTools.storeCredentials(req.body["gitlab-username"], req.body["gitlab-password"], "gitlab.com");
    let response = {};
    dirs.map(i => {
        response[path.resolve(i)] = fileTools.performGitPull(i)
    });
    fileTools.deleteCredentials();
    res.json(response);
});

app.route("*").get((req,res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});


http.listen(app_port, () => {
    console.log('listening on *:' + app_port);
});