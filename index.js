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

let in_process_pull = false;

app.route("/pull").post(async (req, res) => {
    in_process_pull = true;
    childProcess.execSync("git config credential.helper store");
    let dirs = fileTools.gitFindRecursive("./../../");

    let github_username = req.body["github-username"] || req.body["gitlab-username"];
    let github_password = req.body["github-password"] || req.body["gitlab-password"];

    let gitlab_username = req.body["gitlab-username"] || req.body["github-username"];
    let gitlab_password = req.body["gitlab-password"] || req.body["github-password"];


    fileTools.storeCredentials(github_username, github_password, "github.com");
    fileTools.storeCredentials(gitlab_username, gitlab_password, "gitlab.com");
    let response = {};
    dirs.map(async i => {
        response[path.resolve(i)] = fileTools.performGitPull(i);
    });

    let checkComplete = (seconds_passed) => {
        setTimeout(() => {
            if (Object.keys(response).length === dirs.length || seconds_passed > 5) {
                fileTools.deleteCredentials();
                in_process_pull = false;
                res.json(response);
            } else {
                checkComplete(seconds_passed + 1);
            }
        }, 1000);
    };

    checkComplete(0);
});

app.route("*").get((req,res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

const autoDeleteCredentials = () => {
    if(! in_process_pull)
        fileTools.deleteCredentials();
    setTimeout(autoDeleteCredentials, 5000);
};

autoDeleteCredentials();

http.listen(app_port, () => {
    console.log('listening on *:' + app_port);
});