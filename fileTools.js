const fs = require("fs");
const childProcess = require("child_process");
const homedir = require('os').homedir();

const gitFindRecursive = (dir, do_not_search = ["node_modules", ".git"]) => {

    if(dir.endsWith("/")) dir = dir.substr(0, dir.length - 1);

    let git_repos = [];
    try {
        let outer_dirs = fs.readdirSync(dir,{ withFileTypes: true }).filter(dirent => dirent.isDirectory());

        for(let x = 0; x < outer_dirs.length ; x++){
            let current_dir = outer_dirs[x].name;
            if(! do_not_search.includes(current_dir))
                git_repos = [...git_repos, ...gitFindRecursive(`${dir}/${outer_dirs[x].name}`)];

            if(current_dir === ".git")
                git_repos.push(dir);
        }
    } catch(e){}

    return git_repos;
};

const performGitPull = (dir) => {
    let data = "";
    try {
        data = childProcess.execSync(`cd ${dir} ; git config credential.helper store ; git pull`, {timeout: 5000, stdio: "pipe"}).toString();
    } catch (e) {
        data = `There was an error. This is likely due to insufficient credentials being provided. Below is the error: \n\n${e}`;
    }
    return data;
};

const storeCredentials = (username, password, site) => {
    fs.appendFileSync(`${homedir}/.git-credentials`, `https://${username}:${password}@${site}\n`);
};

const deleteCredentials = () => {
    if(fs.existsSync(`${homedir}/.git-credentials`))
        fs.unlinkSync(`${homedir}/.git-credentials`);
};

module.exports = {
    gitFindRecursive,
    performGitPull,
    storeCredentials,
    deleteCredentials
};