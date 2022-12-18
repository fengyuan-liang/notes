# 毕设项目Jenkins部署

## 1. hnit-cms



```json
pipeline {
    agent any
    environment {
        harborHost = '192.168.30.17:9052'
        harborRepo = 'hnit-project'
        harborUser = 'admin'
        harborPasswd = 'anMnKB2Jb0Ak51P30vfsAOP5chL7WBB7g7gerCBH1ni6wQUi9Tt'
    }
    // 存放所有任务的合集
    stages {
        stage('拉取Git代码') {
            steps {
            	echo '开始拉取代码'
            	checkout([$class: 'GitSCM', branches: [[name: '${tag}']], extensions: [], userRemoteConfigs: [[credentialsId: '74871a2d-f4ab-4538-bec1-5e53d01bf012', url: 'http://192.168.30.102:8929/love-umbrella-team/server/hnit-project.git']]])
                echo '拉取Git代码 - SUCESS'
            }
        }

        stage('构建代码') {
            steps {
                echo '开始构建代码'
                sh '''cd ./apps/hnit-cms
                /var/jenkins_home/apache-maven-3.8.6/bin/mvn clean  package -Dmaven.test.skip=true'''
                echo '构建代码 - SUCESS'
            }
        }

        stage('检测代码质量') {
            steps {
                echo '检测代码质量'
                sh '/var/jenkins_home/sonar-scanner4.6.0/bin/sonar-scanner -Dsonar.sources=./ -Dsonar.projectname=${JOB_NAME} -Dsonar.projectKey=${JOB_NAME} -Dsonar.java.binaries=./target/ -Dsonar.login=baffc5c6c521af24387d239d1171c229686edf06'
                echo '检测代码质量 - SUCESS'
            }
        }

        stage('制作自定义镜像并发布Harbor') {
            steps {
                echo '制作自定义镜像并发布Harbor'
                steps {
                    sh '''cp ./target/*.jar ./docker/
                    cd ./docker
                    docker build -t ${JOB_NAME}:${tag} ./'''
                    sh '''docker login -u ${harborUser} -p ${harborPasswd} ${harborHost}
                    docker tag ${JOB_NAME}:${tag} ${harborHost}/${harborRepo}/${JOB_NAME}:${tag}
                    docker push ${harborHost}/${harborRepo}/${JOB_NAME}:${tag}'''
                }
            }
        }

        stage('通过ssh部署项目') {
            steps {
                echo '基于Harbor部署工程'
            }
        }
    }
}
```

