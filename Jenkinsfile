node('docker-slave') {
    stage 'Initialize Build'

    //clean up Workspace
    sh "rm -rf *"

    def git_url = 'git@git.mcp.com:ui/rainier.git'
    def git_branch = "${env.BRANCH_NAME}"
    def docker_repo = 'rdocker.mcp.com:6000'
    def docker_app_image = 'rainier-ui'
    def docker_jenkins_image = 'jenkins-ui-slave:latest'

    git credentialsId: '4a49b307-3aa5-42fd-8ffc-775341d291b2', url: "${git_url}", branch: "${git_branch}"

    //Update Version
    sh "bash scripts/versioning/set_gitHash.sh"
    def git_hash = readFile 'gitHash.txt'

    sh "bash scripts/versioning/set_versions.sh ${git_hash}"
    def version = readFile 'version.txt'
    def version_latest = readFile 'versionLatest.txt'

    //pull latest jenkins slave container
    sh "docker pull ${docker_repo}/${docker_jenkins_image}"

    docker.withRegistry("http://${docker_repo}"){
        docker.image("${docker_repo}/${docker_jenkins_image}").inside {

            sh "ln -f -s /src/node/node_modules/ ."

            stage "Bower Install"
            sh 'bower install --allow-root'

            stage "Grunt Build"
            sh 'grunt build --force'
        }
    }

    stage 'Build Push Clean Docker Image'
    sh "bash scripts/docker/buildPushCleanImage.sh ${docker_repo} ${docker_app_image} ${version_latest}"
    sh "bash scripts/docker/buildPushCleanImage.sh ${docker_repo} ${docker_app_image} ${version}"

}
